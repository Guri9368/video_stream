/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 * Eliminates the need for try-catch in every controller
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;
