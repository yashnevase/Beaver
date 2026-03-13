const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission, requireRole } = require('../../../middleware/auth');
const { validateBody } = require('../../../middleware/validate');
const propertyController = require('../controllers');
const propertyImageController = require('../controllers/propertyImageController');
const { uploadWithCompression } = require('../../../utils/fileUpload');
const { propertySchema, updatePropertySchema } = require('../validators/propertyValidators');

const preparePropertyImageUpload = (req, res, next) => {
  req.uploadSubDir = 'property-images';
  req.allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  next();
};

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: List properties visible to the authenticated user
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: Properties fetched successfully
 *   post:
 *     summary: Owner creates a new property
 *     tags: [Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, address_line, city, state, pincode, rent_amount, deposit_amount]
 *     responses:
 *       201:
 *         description: Property created successfully
 *
 * /properties/{id}:
 *   get:
 *     summary: Get property details by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Property fetched successfully
 *   put:
 *     summary: Owner updates a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Property updated successfully
 *   delete:
 *     summary: Owner soft-deletes a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Property deleted successfully
 */

router.get('/', authenticateToken, requirePermission('properties.view'), propertyController.listProperties);
router.post('/', authenticateToken, requireRole(['owner', 'admin']), requirePermission('properties.create'), validateBody(propertySchema), propertyController.createProperty);
router.get('/:id', authenticateToken, requirePermission('properties.view'), propertyController.getPropertyById);
router.put('/:id', authenticateToken, requireRole(['owner', 'admin']), requirePermission('properties.update'), validateBody(updatePropertySchema), propertyController.updateProperty);
router.delete('/:id', authenticateToken, requireRole(['owner', 'admin']), requirePermission('properties.delete'), propertyController.deleteProperty);
router.get('/:id/images', authenticateToken, requirePermission('properties.view'), propertyImageController.listPropertyImages);
router.post('/:id/images', authenticateToken, requireRole(['owner', 'admin']), requirePermission('properties.update'), preparePropertyImageUpload, uploadWithCompression('image', { generateThumb: true }), propertyImageController.addPropertyImage);
router.delete('/:id/images/:imageId', authenticateToken, requireRole(['owner', 'admin']), requirePermission('properties.update'), propertyImageController.deletePropertyImage);

module.exports = router;
