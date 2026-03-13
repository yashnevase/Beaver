const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes');
const propertyRoutes = require('../modules/property/routes');
const inviteRoutes = require('../modules/invite/routes');
const agreementRoutes = require('../modules/agreement/routes');
const transactionRoutes = require('../modules/transaction/routes');
const paymentRoutes = require('../modules/payment/routes');
const paymentController = require('../modules/payment/controllers');
const chatRoutes = require('../modules/chat/routes');
const notificationRoutes = require('../modules/notification/routes');
const dashboardRoutes = require('../modules/dashboard/routes');
const userRoutes = require('../modules/user/routes');
const adminRoutes = require('../modules/admin/routes');

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/invites', inviteRoutes);
router.use('/agreements', agreementRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);
router.post('/webhooks/razorpay', paymentController.handleWebhook);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
