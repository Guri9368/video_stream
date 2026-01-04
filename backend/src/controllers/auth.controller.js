/**
 * Authentication Controller
 * Handles user registration, login, and profile management
 */
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, tenantId, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    tenantId,
    role: role || 'viewer' // Default to viewer if not specified
  });

  // Generate JWT token
  const token = user.generateAuthToken();

  // Remove password from response
  const userResponse = user.toJSON();

  res.status(201).json(
    new ApiResponse(201, {
      user: userResponse,
      token
    }, 'User registered successfully')
  );
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field (excluded by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Please contact admin.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  // Remove password from response
  const userResponse = user.toJSON();

  res.status(200).json(
    new ApiResponse(200, {
      user: userResponse,
      token
    }, 'Login successful')
  );
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User info already attached by auth middleware
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(
    new ApiResponse(200, user, 'User profile retrieved successfully')
  );
});

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, user, 'Profile updated successfully')
  );
});

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Password changed successfully')
  );
});

/**
 * Logout (optional - mainly handled on frontend)
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You can implement token blacklisting here if needed
  
  res.status(200).json(
    new ApiResponse(200, null, 'Logout successful')
  );
});

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout
};
