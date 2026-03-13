const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userExportController = require('../controllers/userExportController');
const profileRoutes = require('./profileRoutes');
const { authenticateToken, requirePermission } = require('../../../middleware/auth');
const { validateBody, validateParams } = require('../../../middleware/validate');
const userValidators = require('../validators/userValidators');

// User Management Module Routes
// Base path: /api/users
// All routes require authentication and appropriate permissions

router.use('/me', profileRoutes);

// Get all users with pagination and filters
// Query params: page, limit, role, is_active, search
// Permission required: users.view
router.get('/',
  authenticateToken,
  requirePermission('users.view'),
  userController.getAll
);

// Export users to Excel file
// Query params: role, is_active, search (same as getAll)
// Permission required: users.export
// Returns: Downloadable Excel file
router.get('/export/excel',
  authenticateToken,
  requirePermission('users.export'),
  userExportController.exportExcel
);

// Export users to PDF file
// Query params: role, is_active, search (same as getAll)
// Permission required: users.export
// Returns: Downloadable PDF file
router.get('/export/pdf',
  authenticateToken,
  requirePermission('users.export'),
  userExportController.exportPDF
);

// Get user by ID
// URL param: id (user ID)
// Permission required: users.view
router.get('/:id',
  authenticateToken,
  requirePermission('users.view'),
  validateParams(userValidators.userIdSchema),
  userController.getById
);

// Create a new user
// Body: email, password, first_name, last_name, role_id
// Permission required: users.create
router.post('/',
  authenticateToken,
  requirePermission('users.create'),
  validateBody(userValidators.createUserSchema),
  userController.create
);

// Update user by ID
// URL param: id (user ID)
// Body: email, first_name, last_name, role_id (all optional)
// Permission required: users.update
router.put('/:id',
  authenticateToken,
  requirePermission('users.update'),
  validateParams(userValidators.userIdSchema),
  validateBody(userValidators.updateUserSchema),
  userController.update
);

// Delete user by ID (soft delete)
// URL param: id (user ID)
// Permission required: users.delete
router.delete('/:id',
  authenticateToken,
  requirePermission('users.delete'),
  validateParams(userValidators.userIdSchema),
  userController.remove
);

// Activate user account
// URL param: id (user ID)
// Permission required: users.activate
router.patch('/:id/activate',
  authenticateToken,
  requirePermission('users.activate'),
  validateParams(userValidators.userIdSchema),
  userController.activate
);

// Deactivate user account
// URL param: id (user ID)
// Permission required: users.deactivate
router.patch('/:id/deactivate',
  authenticateToken,
  requirePermission('users.deactivate'),
  validateParams(userValidators.userIdSchema),
  userController.deactivate
);

// Schedule automatic user deactivation
// URL param: id (user ID)
// Body: deactivation_date (ISO 8601 date string)
// Permission required: users.schedule_deactivation
router.patch('/:id/schedule-deactivation',
  authenticateToken,
  requirePermission('users.schedule_deactivation'),
  validateParams(userValidators.userIdSchema),
  validateBody(userValidators.scheduleDeactivationSchema),
  userController.scheduleDeactivation
);

// Assign role to user
// URL param: id (user ID)
// Body: role_id
// Permission required: roles.assign
router.patch('/:id/assign-role',
  authenticateToken,
  requirePermission('roles.assign'),
  validateParams(userValidators.userIdSchema),
  validateBody(userValidators.assignRoleSchema),
  userController.assignRole
);

module.exports = router;
