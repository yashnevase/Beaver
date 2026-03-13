const db = require('../../../models');
const { ROLES, getRolePermissions } = require('../../../constants/roles');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginationParams, getSortParams, buildPaginationResponse } = require('../../../utils/pagination');
const logger = require('../../../config/logger');

const listRoles = () => {
  const roles = Object.entries(ROLES).map(([key, role]) => ({
    key,
    name: role.name,
    description: role.description,
    permissions: role.permissions
  }));
  return roles;
};

const listPermissions = () => {
  const grouped = {};
  Object.entries(PERMISSIONS).forEach(([key, description]) => {
    const module = key.split('.')[0];
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push({ key, description });
  });
  return grouped;
};

const getRoleDetail = (roleKey) => {
  const role = ROLES[roleKey];
  if (!role) throw ApiError.notFound('Role not found');
  return {
    key: roleKey,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(p => ({ key: p, description: PERMISSIONS[p] || p }))
  };
};

const listUsers = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const { sort, order } = getSortParams(query, ['user_id', 'email', 'full_name', 'role', 'created_at']);

  const where = { deleted_at: null };
  if (query.role) where.role = query.role;
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
  if (query.search) {
    where[db.Sequelize.Op.or] = [
      { email: { [db.Sequelize.Op.like]: `%${query.search}%` } },
      { full_name: { [db.Sequelize.Op.like]: `%${query.search}%` } }
    ];
  }

  const { count, rows } = await db.User.findAndCountAll({
    where,
    attributes: { exclude: ['password_hash', 'password_reset_token'] },
    order: [[sort, order]],
    limit,
    offset
  });

  return buildPaginationResponse(rows, count, page, limit);
};

const changeUserRole = async (userId, newRole, adminUserId) => {
  if (!ROLES[newRole]) throw ApiError.badRequest(`Invalid role: ${newRole}`);

  const user = await db.User.findOne({ where: { user_id: userId, deleted_at: null } });
  if (!user) throw ApiError.notFound('User not found');

  const oldRole = user.role;
  await user.update({ role: newRole });

  logger.info(`Admin ${adminUserId} changed user ${userId} role from ${oldRole} to ${newRole}`);

  return { message: 'Role updated', user: user.toJSON(), oldRole, newRole };
};

const toggleUserActive = async (userId, isActive, adminUserId) => {
  const user = await db.User.findOne({ where: { user_id: userId, deleted_at: null } });
  if (!user) throw ApiError.notFound('User not found');

  await user.update({ is_active: isActive });

  logger.info(`Admin ${adminUserId} ${isActive ? 'activated' : 'deactivated'} user ${userId}`);

  return { message: `User ${isActive ? 'activated' : 'deactivated'}`, user: user.toJSON() };
};

const getAuditLogs = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);

  const where = {};
  if (query.action) where.action = query.action;
  if (query.actor_id) where.actor_id = query.actor_id;

  const { count, rows } = await db.AuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return buildPaginationResponse(rows, count, page, limit);
};

const getActionLogs = async (query) => {
  const { page, limit, offset } = getPaginationParams(query);

  const where = {};
  if (query.module) where.module = query.module;
  if (query.user_id) where.user_id = query.user_id;
  if (query.action_type) where.action_type = query.action_type;

  const { count, rows } = await db.ActionLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return buildPaginationResponse(rows, count, page, limit);
};

module.exports = {
  listRoles,
  listPermissions,
  getRoleDetail,
  listUsers,
  changeUserRole,
  toggleUserActive,
  getAuditLogs,
  getActionLogs
};
