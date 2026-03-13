const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission, requireRole } = require('../../../middleware/auth');
const { validateBody } = require('../../../middleware/validate');
const agreementController = require('../controllers');
const agreementDocController = require('../controllers/agreementDocController');
const { uploadWithCompression } = require('../../../utils/fileUpload');
const { createAgreementSchema, updateAgreementSchema, revokeAgreementSchema, renewAgreementSchema, rejectAgreementSchema, settleAgreementSchema } = require('../validators/agreementValidators');

const prepareAgreementDocUpload = (req, res, next) => {
  req.uploadSubDir = 'agreement-docs';
  req.allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  next();
};

/**
 * @swagger
 * /agreements/pending-actions:
 *   get:
 *     summary: Get pending actions (profile, drafts, deposits, rent) for the current user
 *     tags: [Agreements]
 *     responses:
 *       200:
 *         description: Pending actions fetched successfully
 *
 * /agreements:
 *   get:
 *     summary: List agreements visible to the authenticated user
 *     tags: [Agreements]
 *     responses:
 *       200:
 *         description: Agreements fetched successfully
 *   post:
 *     summary: Owner creates a draft agreement for a tenant/property
 *     tags: [Agreements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, tenant_id, start_date, end_date, rent_amount]
 *     responses:
 *       201:
 *         description: Agreement created successfully
 *
 * /agreements/{id}:
 *   get:
 *     summary: Get agreement details by ID
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement fetched successfully
 *   put:
 *     summary: Update a draft or existing agreement
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement updated successfully
 *
 * /agreements/{id}/timeline:
 *   get:
 *     summary: Get agreement event timeline for legal and lifecycle tracking
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement timeline fetched successfully
 *
 * /agreements/{id}/pdf:
 *   get:
 *     summary: Download generated agreement PDF
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement PDF download
 *
 * /agreements/{id}/accept:
 *   post:
 *     summary: Tenant accepts the agreement and moves it toward activation
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement accepted successfully
 *
 * /agreements/{id}/reject:
 *   post:
 *     summary: Tenant rejects the agreement with an optional reason
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement rejected successfully
 *
 * /agreements/{id}/revoke:
 *   post:
 *     summary: Owner revokes the agreement
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement revoked successfully
 *
 * /agreements/{id}/renew:
 *   post:
 *     summary: Owner renews the agreement tenure
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement renewed successfully
 *
 * /agreements/{id}/settle:
 *   post:
 *     summary: Owner settles deposit refund/deduction and closes the agreement
 *     tags: [Agreements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agreement settled successfully
 */

router.get('/pending-actions', authenticateToken, requirePermission('agreements.view'), agreementController.getPendingActions);
router.get('/', authenticateToken, requirePermission('agreements.view'), agreementController.listAgreements);
router.post('/', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.create'), validateBody(createAgreementSchema), agreementController.createAgreement);
router.get('/:id', authenticateToken, requirePermission('agreements.view'), agreementController.getAgreementById);
router.get('/:id/timeline', authenticateToken, requirePermission('agreements.view'), agreementController.getAgreementTimeline);
router.get('/:id/pdf', authenticateToken, requirePermission('agreements.view'), agreementController.getAgreementPdf);
router.post('/:id/accept', authenticateToken, requireRole(['tenant']), requirePermission('agreements.view'), agreementController.acceptAgreement);
router.post('/:id/reject', authenticateToken, requireRole(['tenant']), requirePermission('agreements.view'), validateBody(rejectAgreementSchema), agreementController.rejectAgreement);
router.put('/:id', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.update'), validateBody(updateAgreementSchema), agreementController.updateAgreement);
router.post('/:id/revoke', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.revoke'), validateBody(revokeAgreementSchema), agreementController.revokeAgreement);
router.post('/:id/renew', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.update'), validateBody(renewAgreementSchema), agreementController.renewAgreement);
router.post('/:id/settle', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.update'), validateBody(settleAgreementSchema), agreementController.settleAgreement);
router.get('/:id/documents', authenticateToken, requirePermission('agreements.view'), agreementDocController.listAgreementDocuments);
router.post('/:id/documents', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.update'), prepareAgreementDocUpload, uploadWithCompression('document', { generateThumb: false }), agreementDocController.uploadAgreementDocument);
router.delete('/:id/documents/:docId', authenticateToken, requireRole(['owner', 'admin']), requirePermission('agreements.update'), agreementDocController.deleteAgreementDocument);

module.exports = router;
