/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if user has required role to access a route
 */
const ApiError = require('../utils/ApiError');

/**
 * Check if user has one of the allowed roles
 * @param {Array<string>} allowedRoles - Array of roles that can access the route
 * @returns {Function} Express middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403, 
        `Access denied. Required role: ${allowedRoles.join(' or ')}`
      );
    }

    next();
  };
};

/**
 * Check if user can access/modify a specific resource
 * For editor role: can only access their own resources
 * For admin role: can access all resources
 */
const checkResourceOwnership = (resourceUserIdField = 'uploadedBy') => {
  return (req, res, next) => {
    const { role, userId, tenantId } = req.user;

    // Admin has access to all resources in their tenant
    if (role === 'admin') {
      return next();
    }

    // For editor/viewer: check ownership
    // This will be validated in the controller when fetching the resource
    req.checkOwnership = true;
    req.ownerField = resourceUserIdField;

    next();
  };
};

module.exports = {
  checkRole,
  checkResourceOwnership
};
