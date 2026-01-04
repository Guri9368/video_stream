/**
 * Admin Routes
 * Handles administrative operations and user management
 * All routes require admin role
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');
const { enforceTenantIsolation } = require('../middleware/tenant.middleware');
const { validationRules, handleValidationErrors } = require('../middleware/validate.middleware');

/**
 * All admin routes require authentication, admin role, and tenant isolation
 */
router.use(authenticate);
router.use(checkRole(['admin']));
router.use(enforceTenantIsolation);

/**
 * System statistics
 */
router.get(
  '/stats',
  adminController.getSystemStats
);

/**
 * User management
 */

// List all users
router.get(
  '/users',
  adminController.listUsers
);

// Get user by ID
router.get(
  '/users/:userId',
  validationRules.mongoId,
  handleValidationErrors,
  adminController.getUserById
);

// Update user role
router.patch(
  '/users/:userId/role',
  validationRules.mongoId,
  validationRules.updateUserRole,
  handleValidationErrors,
  adminController.updateUserRole
);

// Toggle user active status
router.patch(
  '/users/:userId/toggle-status',
  validationRules.mongoId,
  handleValidationErrors,
  adminController.toggleUserStatus
);

// Delete user
router.delete(
  '/users/:userId',
  validationRules.mongoId,
  handleValidationErrors,
  adminController.deleteUser
);

module.exports = router;
