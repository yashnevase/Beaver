const express = require('express');
const router = express.Router();
const authController = require('../controllers');
const { validateBody } = require('../../../middleware/validate');
const { authenticateToken } = require('../../../middleware/auth');
const { loginRateLimiter } = require('../../../config/rateLimiters');
const authValidators = require('../validators/authValidators');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new owner or tenant
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, full_name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [owner, tenant]
 *     responses:
 *       201:
 *         description: Registration successful
 *
 * /auth/verify-otp:
 *   post:
 *     summary: Verify signup OTP and activate account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *
 * /auth/resend-otp:
 *   post:
 *     summary: Resend account verification OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP resent
 *
 * /auth/login:
 *   post:
 *     summary: Login and receive access/refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and get a new access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset OTP issued
 *
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using OTP while logged out
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, new_password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *
 * /auth/change-password:
 *   post:
 *     summary: Change password while logged in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */

// Authentication Module Routes
// Base path: /api/auth
// Public routes (no authentication required unless specified)

// Register a new user
// Body: email, password, first_name, last_name, role_id (optional)
// Returns: OTP sent to email (or OTP in response if SMTP disabled)
router.post('/register',
  validateBody(authValidators.registerSchema),
  authController.register
);

// Verify email with OTP
// Body: email, otp
// Returns: Access token and refresh token
router.post('/verify-otp',
  validateBody(authValidators.verifyOTPSchema),
  authController.verifyOTP
);

// Resend OTP to email
// Body: email
// Returns: New OTP sent to email
router.post('/resend-otp',
  validateBody(authValidators.resendOTPSchema),
  authController.resendOTP
);

// User login
// Body: email, password
// Returns: Access token and refresh token
// Rate limited: Max 5 attempts per 15 minutes
router.post('/login',
  loginRateLimiter,
  validateBody(authValidators.loginSchema),
  authController.login
);

// Refresh access token
// Body: refreshToken
// Returns: New access token and new refresh token (token rotation)
router.post('/refresh',
  validateBody(authValidators.refreshTokenSchema),
  authController.refreshToken
);

// User logout
// Body: refreshToken
// Invalidates the refresh token
router.post('/logout',
  validateBody(authValidators.refreshTokenSchema),
  authController.logout
);

// Request password reset
// Body: email
// Returns: OTP sent to email for password reset
router.post('/forgot-password',
  validateBody(authValidators.forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password with OTP
// Body: email, otp, new_password
// Returns: Success message
router.post('/reset-password',
  validateBody(authValidators.resetPasswordSchema),
  authController.resetPassword
);

// Change password (authenticated users)
// Body: current_password, new_password
// Requires: Valid access token
router.post('/change-password',
  authenticateToken,
  validateBody(authValidators.changePasswordSchema),
  authController.changePassword
);

module.exports = router;
