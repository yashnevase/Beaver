const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../../../middleware/auth');
const dashboardController = require('../controllers');

router.get('/', authenticateToken, requirePermission('dashboard.view'), dashboardController.getDashboard);
router.get('/analytics', authenticateToken, requirePermission('dashboard.analytics'), dashboardController.getAnalytics);

module.exports = router;
