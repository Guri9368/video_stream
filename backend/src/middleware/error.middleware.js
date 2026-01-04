/**
 * Global Error Handling Middleware
 * Catches all errors and sends consistent error responses
 */
const ApiError = require('../utils/ApiError');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    error = new ApiError(400, 'Validation Error', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error = new ApiError(409, `${field} already exists`);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ApiError(413, 'File too large. Maximum size is 500MB');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ApiError(400, 'Unexpected file field');
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      errors: error.errors
    });
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

/**
 * Handle 404 - Not Found
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
