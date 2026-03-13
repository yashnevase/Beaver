const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../../middleware/auth');
const adminController = require('../controllers');

router.get('/roles', authenticateToken, requireRole(['admin']), adminController.listRoles);
router.get('/roles/:role', authenticateToken, requireRole(['admin']), adminController.getRoleDetail);
router.get('/permissions', authenticateToken, requireRole(['admin']), adminController.listPermissions);
router.get('/users', authenticateToken, requireRole(['admin']), adminController.listUsers);
router.patch('/users/:id/role', authenticateToken, requireRole(['admin']), adminController.changeUserRole);
router.patch('/users/:id/active', authenticateToken, requireRole(['admin']), adminController.toggleUserActive);
router.get('/audit-logs', authenticateToken, requireRole(['admin']), adminController.getAuditLogs);
router.get('/action-logs', authenticateToken, requireRole(['admin']), adminController.getActionLogs);

module.exports = router;
