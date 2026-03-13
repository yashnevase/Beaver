const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../../../middleware/auth');
const { validateBody } = require('../../../middleware/validate');
const paymentController = require('../controllers');
const { initiatePaymentSchema, verifyPaymentSchema } = require('../validators/paymentValidators');

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate a rent or deposit Razorpay payment order
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agreement_id, amount, type]
 *             properties:
 *               agreement_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [rent, deposit]
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *
 * /payments/verify:
 *   post:
 *     summary: Verify a completed Razorpay payment signature and finalize the transaction
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *
 * /payments/webhooks/razorpay:
 *   post:
 *     summary: Receive Razorpay webhook events
 *     tags: [Payments]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */

router.post('/initiate', authenticateToken, requirePermission('payments.initiate'), validateBody(initiatePaymentSchema), paymentController.initiatePayment);
router.post('/verify', authenticateToken, requirePermission('payments.initiate'), validateBody(verifyPaymentSchema), paymentController.verifyPayment);
router.post('/webhooks/razorpay', paymentController.handleWebhook);

module.exports = router;
