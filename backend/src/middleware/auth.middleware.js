/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to request object
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const jwtConfig = require('../config/jwt.config');

const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  // Get token from header
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // If not in header, check query params (for video streaming via <video> tag)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Find user and check if still active
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(401, 'Invalid token. User not found.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated. Please contact admin.');
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired. Please login again.');
    }
    throw error;
  }
});

module.exports = authenticate;
