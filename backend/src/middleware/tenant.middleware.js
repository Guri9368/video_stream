/**
 * Tenant Isolation Middleware
 */
const ApiError = require('../utils/ApiError');

/**
 * Enforce tenant isolation - users can only access their tenant's data
 */
const enforceTenantIsolation = (req, res, next) => {
  // User should already be authenticated
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  // Attach tenant filter to request for use in controllers
  req.tenantId = req.user.tenantId;
  next();
};

/**
 * Validate tenant ID in request body matches authenticated user's tenant
 */
const validateTenantId = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user || !req.user.tenantId) {
    return next(new ApiError(401, 'User authentication data missing'));
  }

  const bodyTenantId = req.body.tenantId;

  // If tenantId is provided in body, validate it matches user's tenant
  if (bodyTenantId && bodyTenantId !== req.user.tenantId) {
    // Admin exception: admins might be able to access other tenants
    if (req.user.role !== 'admin') {
      return next(new ApiError(403, 'Cannot access resources from other tenants'));
    }
  }

  // If no tenantId in body, automatically use user's tenantId
  if (!bodyTenantId) {
    req.body.tenantId = req.user.tenantId;
  }

  next();
};

module.exports = {
  enforceTenantIsolation,
  validateTenantId,
};
