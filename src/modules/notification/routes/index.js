const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../../../middleware/auth');
const notificationController = require('../controllers');

router.get('/', authenticateToken, requirePermission('notifications.view'), notificationController.listNotifications);
router.put('/:id/read', authenticateToken, requirePermission('notifications.view'), notificationController.markAsRead);
router.put('/read-all', authenticateToken, requirePermission('notifications.view'), notificationController.markAllAsRead);

module.exports = router;
