const bcrypt = require('bcrypt');
const db = require('../../../models');
const { tokenService, otpService } = require('../../../lib/auth');
const emailService = require('../../../lib/email');
const { ApiError } = require('../../../middleware/errorHandler');
const { getRolePermissions } = require('../../../constants/roles');
const logger = require('../../../config/logger');

const buildTokenPayload = (user) => ({
  user_id: user.user_id,
  email: user.email,
  role: user.role,
  tier: user.tier,
  permissions: getRolePermissions(user.role)
});

const register = async (userData, ipAddress, userAgent) => {
  const { email, password, full_name, phone, role } = userData;
  
  const validRoles = ['owner', 'tenant'];
  const userRole = validRoles.includes(role) ? role : 'tenant';
  
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }
  
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  
  const user = await db.User.create({
    email,
    password_hash: passwordHash,
    full_name,
    phone: phone || null,
    role: userRole,
    tier: 'free',
    is_active: false,
    email_verified: false
  });
  
  const otp = otpService.generateOTP();
  await otpService.storeOTP(user.user_id, otp);
  
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  const emailResult = await emailService.sendOTPEmail(user, otp, expiryMinutes);
  
  logger.info(`User registered: ${email} as ${userRole}, OTP sent`);
  
  const response = {
    message: 'Registration successful. Please verify your email with the OTP sent.',
    userId: user.user_id,
    email: user.email
  };
  
  if (emailResult.smtpDisabled) {
    response.otp = emailResult.otp;
    response.devMode = true;
  }
  
  return response;
};

const verifyOTP = async (email, otp, ipAddress, userAgent) => {
  const user = await db.User.findOne({ where: { email } });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  if (user.email_verified) {
    throw ApiError.badRequest('Email already verified');
  }
  
  await otpService.validateOTP(user.user_id, otp);
  
  await user.update({
    email_verified: true,
    is_active: true
  });
  
  const tokenPayload = buildTokenPayload(user);
  
  const accessToken = tokenService.generateAccessToken(tokenPayload);
  const refreshToken = tokenService.generateRefreshToken({ user_id: user.user_id });
  
  await tokenService.storeRefreshToken(user.user_id, refreshToken, ipAddress, userAgent);
  
  await emailService.sendWelcomeEmail(user, process.env.FRONTEND_URL);
  
  logger.info(`Email verified and user activated: ${email}`);
  
  return {
    accessToken,
    refreshToken,
    user: user.toJSON()
  };
};

const resendOTP = async (email) => {
  const user = await db.User.findOne({ where: { email } });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  if (user.email_verified) {
    throw ApiError.badRequest('Email already verified');
  }
  
  const otp = otpService.generateOTP();
  await otpService.storeOTP(user.user_id, otp, 'REGISTRATION');
  
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  const emailResult = await emailService.sendOTPEmail(user, otp, expiryMinutes);
  
  logger.info(`OTP resent to: ${email}`);
  
  const response = {
    message: 'OTP has been resent to your email'
  };
  
  if (emailResult.smtpDisabled) {
    response.otp = emailResult.otp;
    response.devMode = true;
  }
  
  return response;
};

const login = async (email, password, ipAddress, userAgent) => {
  const user = await db.User.findOne({ where: { email } });
  
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  
  if (!user.email_verified) {
    throw ApiError.forbidden('Please verify your email first');
  }
  
  if (!user.is_active) {
    throw ApiError.forbidden('Account is inactive');
  }
  
  if (user.deleted_at) {
    throw ApiError.forbidden('Account has been deleted');
  }
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  
  await user.update({ last_login_at: new Date() });
  
  const tokenPayload = buildTokenPayload(user);
  
  const accessToken = tokenService.generateAccessToken(tokenPayload);
  const refreshToken = tokenService.generateRefreshToken({ user_id: user.user_id });
  
  await tokenService.storeRefreshToken(user.user_id, refreshToken, ipAddress, userAgent);
  
  logger.info(`User logged in: ${email}`);
  
  return {
    accessToken,
    refreshToken,
    user: user.toJSON()
  };
};

const refreshAccessToken = async (refreshToken, ipAddress, userAgent) => {
  const payload = tokenService.verifyRefreshToken(refreshToken);
  
  if (!payload) {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  
  const storedToken = await tokenService.validateRefreshToken(refreshToken, payload.user_id);
  
  if (!storedToken) {
    throw ApiError.unauthorized('Refresh token not found or expired');
  }
  
  const user = await db.User.findByPk(payload.user_id);
  
  if (!user || !user.is_active || user.deleted_at) {
    throw ApiError.unauthorized('User not found or inactive');
  }
  
  const tokenPayload = buildTokenPayload(user);
  
  const newAccessToken = tokenService.generateAccessToken(tokenPayload);
  const newRefreshToken = tokenService.generateRefreshToken({ user_id: user.user_id });
  
  await tokenService.revokeRefreshToken(storedToken.token_id);
  await tokenService.storeRefreshToken(user.user_id, newRefreshToken, ipAddress, userAgent);
  
  logger.info(`Token refreshed for user: ${user.email}`);
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

const logout = async (refreshToken) => {
  const payload = tokenService.verifyRefreshToken(refreshToken);
  
  if (payload) {
    const storedToken = await tokenService.validateRefreshToken(refreshToken, payload.user_id);
    if (storedToken) {
      await tokenService.revokeRefreshToken(storedToken.token_id);
    }
  }
  
  return { message: 'Logged out successfully' };
};

const forgotPassword = async (email) => {
  const user = await db.User.findOne({ where: { email } });
  
  if (!user) {
    return { message: 'If email exists, OTP has been sent' };
  }
  
  const otp = otpService.generateOTP();
  await otpService.storeOTP(user.user_id, otp, 'PASSWORD_RESET');
  
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  const emailResult = await emailService.sendOTPEmail(user, otp, expiryMinutes);
  
  logger.info(`Password reset OTP sent to: ${email}`);
  
  const response = {
    message: 'If email exists, OTP has been sent'
  };
  
  if (emailResult.smtpDisabled) {
    response.otp = emailResult.otp;
    response.devMode = true;
  }
  
  return response;
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await db.User.findOne({ where: { email } });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  await otpService.validateOTP(user.user_id, otp, 'PASSWORD_RESET');
  
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const newPasswordHash = await bcrypt.hash(newPassword, bcryptRounds);
  
  await user.update({ password_hash: newPasswordHash });
  
  await tokenService.revokeAllUserTokens(user.user_id);
  await tokenService.incrementRefreshTokenVersion(user.user_id);
  
  logger.info(`Password reset successful for user: ${user.email}`);
  
  return { message: 'Password reset successful' };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await db.User.findByPk(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }
  
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const newPasswordHash = await bcrypt.hash(newPassword, bcryptRounds);
  
  await user.update({ password_hash: newPasswordHash });
  
  await tokenService.revokeAllUserTokens(user.user_id);
  await tokenService.incrementRefreshTokenVersion(user.user_id);
  
  logger.info(`Password changed for user: ${user.email}`);
  
  return { message: 'Password changed successfully' };
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
};
