/**
 * Authentication Routes
 * Handles user authentication and profile management endpoints
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const { validationRules, handleValidationErrors } = require('../middleware/validate.middleware');

/**
 * Public routes (no authentication required)
 */

// Register new user
// POST /api/auth/register
router.post(
  '/register',
  validationRules.register,
  handleValidationErrors,
  authController.register
);

// Login user
// POST /api/auth/login
router.post(
  '/login',
  validationRules.login,
  handleValidationErrors,
  authController.login
);

/**
 * Protected routes (authentication required)
 */

// Get current user profile
// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

// Update user profile
// PATCH /api/auth/profile
router.patch(
  '/profile',
  authenticate,
  authController.updateProfile
);

// Change password
// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  authController.changePassword
);

// Logout
// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  authController.logout
);

module.exports = router;
