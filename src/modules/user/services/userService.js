const db = require('../../../models');
const { ApiError } = require('../../../middleware/errorHandler');
const cache = require('../../../lib/cache');
const { ROLES } = require('../../../constants/roles');
const { getPaginationParams, getSortParams, buildPaginationResponse } = require('../../../utils/pagination');
const logger = require('../../../config/logger');
const datetimeService = require('../../../lib/datetime');

const getAll = async (query, currentUserId) => {
  const cacheKey = `users:all:${JSON.stringify(query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  const { page, limit, offset } = getPaginationParams(query);
  const { sort, order } = getSortParams(query, ['user_id', 'email', 'full_name', 'created_at']);
  
  const whereClause = {
    deleted_at: null
  };
  
  if (query.role) {
    whereClause.role = query.role;
  }
  
  if (query.is_active !== undefined) {
    whereClause.is_active = query.is_active === 'true';
  }
  
  if (query.email_verified !== undefined) {
    whereClause.email_verified = query.email_verified === 'true';
  }
  
  if (query.search) {
    whereClause[db.Sequelize.Op.or] = [
      { email: { [db.Sequelize.Op.like]: `%${query.search}%` } },
      { full_name: { [db.Sequelize.Op.like]: `%${query.search}%` } }
    ];
  }
  
  const { count, rows } = await db.User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password_hash', 'password_reset_token'] },
    order: [[sort, order]],
    limit,
    offset
  });
  
  const result = buildPaginationResponse(rows, count, page, limit);
  
  await cache.set(cacheKey, result, 300);
  
  return result;
};

const getById = async (userId) => {
  const cacheKey = `user:${userId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  const user = await db.User.findOne({
    where: { 
      user_id: userId,
      deleted_at: null
    }
  });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  await cache.set(cacheKey, user, 300);
  
  return user;
};

const create = async (userData, currentUserId) => {
  const { email, password, full_name, role } = userData;
  
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }
  
  const bcrypt = require('bcrypt');
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  
  const validRoles = Object.keys(ROLES);
  const userRole = validRoles.includes(role) ? role : 'tenant';
  
  const user = await db.User.create({
    email,
    password_hash: passwordHash,
    full_name,
    role: userRole,
    is_active: true,
    email_verified: true
  });
  
  await cache.del('users:all:*');
  
  logger.info(`User created: ${user.email} by user ${currentUserId}`);
  
  return user;
};

const update = async (userId, updateData, currentUserId) => {
  const user = await db.User.findOne({
    where: { 
      user_id: userId,
      deleted_at: null
    }
  });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const allowedFields = ['full_name', 'is_active', 'email_verified', 'profile_photo'];
  const filteredData = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });
  
  if (updateData.role) {
    const validRoles = Object.keys(ROLES);
    if (validRoles.includes(updateData.role)) {
      filteredData.role = updateData.role;
    }
  }
  
  await user.update(filteredData);
  
  await cache.del(`user:${userId}`);
  await cache.del('users:all:*');
  
  logger.info(`User updated: ${user.email} by user ${currentUserId}`);
  
  return user;
};

const remove = async (userId, currentUserId) => {
  const user = await db.User.findOne({
    where: { 
      user_id: userId,
      deleted_at: null
    }
  });
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  await user.update({
    deleted_at: new Date(),
    is_active: false
  });
  
  await cache.del(`user:${userId}`);
  await cache.del('users:all:*');
  
  logger.info(`User soft deleted: ${user.email} by user ${currentUserId}`);
  
  return { message: 'User deleted successfully' };
};

const activate = async (userId, currentUserId) => {
  const user = await db.User.findByPk(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  await user.update({ is_active: true });
  
  await cache.del(`user:${userId}`);
  await cache.del('users:all:*');
  
  logger.info(`User activated: ${user.email} by user ${currentUserId}`);
  
  return { message: 'User activated successfully', user: user.toJSON() };
};

const deactivate = async (userId, currentUserId) => {
  const user = await db.User.findByPk(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  await user.update({ is_active: false });
  
  await cache.del(`user:${userId}`);
  await cache.del('users:all:*');
  
  logger.info(`User deactivated: ${user.email} by user ${currentUserId}`);
  
  return { message: 'User deactivated successfully', user: user.toJSON() };
};

const scheduleDeactivation = async (userId, deactivationDate, currentUserId) => {
  const user = await db.User.findByPk(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const scheduledDate = new Date(deactivationDate);
  
  if (scheduledDate <= new Date()) {
    throw ApiError.badRequest('Deactivation date must be in the future');
  }
  
  logger.info(`User deactivation scheduled: ${user.email} for ${scheduledDate} by user ${currentUserId}`);
  
  return { 
    message: 'User deactivation scheduled successfully', 
    scheduled_at: datetimeService.formatDateTime(scheduledDate),
    user: user.toJSON() 
  };
};

const assignRole = async (userId, roleName, currentUserId) => {
  const user = await db.User.findByPk(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  const validRoles = Object.keys(ROLES);
  if (!validRoles.includes(roleName)) {
    throw ApiError.badRequest(`Invalid role: ${roleName}. Valid roles: ${validRoles.join(', ')}`);
  }
  
  const oldRole = user.role;
  await user.update({ role: roleName });
  
  await cache.del(`user:${userId}`);
  await cache.del('users:all:*');
  
  logger.info(`Role ${roleName} assigned to user ${user.email} by user ${currentUserId}`);
  
  return { 
    message: 'Role assigned successfully', 
    user: user.toJSON(),
    oldRole,
    newRole: roleName
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  activate,
  deactivate,
  scheduleDeactivation,
  assignRole
};
