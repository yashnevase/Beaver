const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middleware/auth');
const { validateBody } = require('../../../middleware/validate');
const { uploadWithCompression } = require('../../../utils/fileUpload');
const profileController = require('../controllers/profileController');
const profileValidators = require('../validators/profileValidators');

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the authenticated user's profile and uploaded documents
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *   put:
 *     summary: Update the authenticated user's profile fields
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address_line:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *
 * /users/me/photo:
 *   post:
 *     summary: Upload profile photo for the authenticated user
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 *
 * /users/me/documents:
 *   get:
 *     summary: List KYC documents uploaded by the authenticated user
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Documents fetched successfully
 *   post:
 *     summary: Upload a KYC document for the authenticated user
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               doc_type:
 *                 type: string
 *                 enum: [aadhaar, pan, address_proof]
 *               doc_number:
 *                 type: string
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */

const prepareProfilePhotoUpload = (req, res, next) => {
  req.uploadSubDir = 'avatars';
  req.allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  next();
};

const prepareDocumentUpload = (req, res, next) => {
  req.uploadSubDir = 'documents';
  req.allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];
  next();
};

router.get('/', authenticateToken, profileController.getMyProfile);
router.get('/completeness', authenticateToken, profileController.getProfileCompleteness);
router.put('/', authenticateToken, validateBody(profileValidators.updateMyProfileSchema), profileController.updateMyProfile);
router.post('/photo', authenticateToken, prepareProfilePhotoUpload, uploadWithCompression('photo', { generateThumb: true }), profileController.uploadProfilePhoto);
router.get('/documents', authenticateToken, profileController.listMyDocuments);
router.post('/documents', authenticateToken, prepareDocumentUpload, uploadWithCompression('document', { generateThumb: false }), validateBody(profileValidators.uploadDocumentSchema), profileController.uploadDocument);

module.exports = router;
