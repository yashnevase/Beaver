const { adminService } = require('../services');
const ApiResponse = require('../../../utils/ApiResponse');

const listRoles = async (req, res, next) => {
  try {
    const roles = adminService.listRoles();
    return ApiResponse.success(res, roles, 'Roles retrieved');
  } catch (error) {
    next(error);
  }
};

const getRoleDetail = async (req, res, next) => {
  try {
    const role = adminService.getRoleDetail(req.params.role);
    return ApiResponse.success(res, role, 'Role detail retrieved');
  } catch (error) {
    next(error);
  }
};

const listPermissions = async (req, res, next) => {
  try {
    const permissions = adminService.listPermissions();
    return ApiResponse.success(res, permissions, 'Permissions retrieved');
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const result = await adminService.listUsers(req.query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const changeUserRole = async (req, res, next) => {
  try {
    const result = await adminService.changeUserRole(req.params.id, req.body.role, req.user.user_id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const toggleUserActive = async (req, res, next) => {
  try {
    const result = await adminService.toggleUserActive(req.params.id, req.body.is_active, req.user.user_id);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getActionLogs = async (req, res, next) => {
  try {
    const result = await adminService.getActionLogs(req.query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRoles,
  getRoleDetail,
  listPermissions,
  listUsers,
  changeUserRole,
  toggleUserActive,
  getAuditLogs,
  getActionLogs
};
