/**
 * Video Routes
 */
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const authenticate = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/rbac.middleware');
const { enforceTenantIsolation, validateTenantId } = require('../middleware/tenant.middleware');
const { validationRules, handleValidationErrors } = require('../middleware/validate.middleware');
const upload = require('../config/multer.config');

/**
 * Video upload route
 * Middleware order is critical!
 */
router.post(
  '/upload',
  authenticate,                   // Step 1: Verify JWT and set req.user
  checkRole(['editor', 'admin']), // Step 2: Check user role
  enforceTenantIsolation,         // Step 3: Set tenant context
  upload.single('video'),         // Step 4: Handle file upload
  videoController.uploadVideo     // Step 5: Controller logic
);

// ✅ STREAM ROUTE REMOVED - Now handled in server.js as public route

// Apply authentication to all other routes
router.use(authenticate);
router.use(enforceTenantIsolation);

// List videos
router.get('/', videoController.listVideos);

// Get processing status
router.get('/:id/status', videoController.getProcessingStatus);

// Get video details
router.get('/:id', videoController.getVideoById);

// Update video
router.put('/:id', checkRole(['editor', 'admin']), videoController.updateVideo);

// Delete video
router.delete('/:id', checkRole(['editor', 'admin']), videoController.deleteVideo);

module.exports = router;
