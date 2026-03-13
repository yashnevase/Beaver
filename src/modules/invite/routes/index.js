const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth, requirePermission, requireRole } = require('../../../middleware/auth');
const { validateBody } = require('../../../middleware/validate');
const inviteController = require('../controllers');
const { createInviteSchema } = require('../validators/inviteValidators');

/**
 * @swagger
 * /invites:
 *   post:
 *     summary: Owner creates a tenant invite for a property
 *     tags: [Invites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, email]
 *             properties:
 *               property_id:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Invite created successfully
 *
 * /invites/{token}:
 *   get:
 *     summary: Fetch invite details by token for onboarding page prefill
 *     tags: [Invites]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite fetched successfully
 *
 * /invites/{token}/accept:
 *   post:
 *     summary: Accept an invite and auto-create a draft agreement for the tenant
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite accepted successfully
 */

router.post('/', authenticateToken, requireRole(['owner', 'admin']), requirePermission('invites.create'), validateBody(createInviteSchema), inviteController.createInvite);
router.get('/:token', optionalAuth, inviteController.getInviteByToken);
router.post('/:token/accept', authenticateToken, inviteController.acceptInvite);

module.exports = router;
