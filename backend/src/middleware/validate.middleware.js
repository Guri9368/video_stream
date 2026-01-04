/**
 * Request Validation Middleware
 * Uses express-validator for input validation
 */
const { body, query, param, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Handles validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    throw new ApiError(400, 'Validation failed', errorMessages);
  }
  
  next();
};

/**
 * Validation Rules
 */
const validationRules = {
  // User Registration
  register: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('tenantId')
      .trim()
      .notEmpty()
      .withMessage('Tenant ID is required'),
    body('role')
      .optional()
      .isIn(['viewer', 'editor', 'admin'])
      .withMessage('Invalid role. Must be viewer, editor, or admin')
  ],

  // User Login
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Video Upload
  uploadVideo: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Video title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
  ],

  // Video Update
  updateVideo: [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],

  // List Videos Query
  listVideos: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('filter')
      .optional()
      .isIn(['all', 'safe', 'flagged', 'pending'])
      .withMessage('Invalid filter. Must be all, safe, flagged, or pending'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'title', 'views', 'duration'])
      .withMessage('Invalid sortBy field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc')
  ],

  // MongoDB ObjectId validation
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  // Update User Role (Admin)
  updateUserRole: [
    body('role')
      .isIn(['viewer', 'editor', 'admin'])
      .withMessage('Invalid role. Must be viewer, editor, or admin')
  ]
};

module.exports = {
  validationRules,
  handleValidationErrors
};
