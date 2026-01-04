/**
 * Multer Configuration for Video Upload
 * Handles file validation, storage configuration, and file naming
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Ensure upload directories exist
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/videos';
const THUMBNAIL_PATH = process.env.THUMBNAIL_PATH || './uploads/thumbnails';

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

if (!fs.existsSync(THUMBNAIL_PATH)) {
  fs.mkdirSync(THUMBNAIL_PATH, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: video-timestamp-randomstring.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow video files
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_VIDEO_TYPES || 
    'video/mp4,video/avi,video/mov,video/mkv,video/webm').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    ), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // Default: 500MB
  }
});

module.exports = upload;
