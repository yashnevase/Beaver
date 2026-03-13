const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../../../middleware/auth');
const { validateQuery, validateParams } = require('../../../middleware/validate');
const transactionController = require('../controllers');
const { transactionListQuerySchema, transactionIdParamsSchema } = require('../validators/transactionValidators');

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: List transactions visible to the authenticated user
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Transactions fetched successfully
 *
 * /transactions/export/pdf:
 *   get:
 *     summary: Export transactions as PDF
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: PDF export generated
 *
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction details by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction fetched successfully
 */

router.get('/', authenticateToken, requirePermission('transactions.view'), validateQuery(transactionListQuerySchema), transactionController.listTransactions);
router.get('/export/pdf', authenticateToken, requirePermission('transactions.export'), transactionController.exportTransactionsPdf);
router.get('/:id', authenticateToken, requirePermission('transactions.view'), validateParams(transactionIdParamsSchema), transactionController.getTransactionById);

module.exports = router;
