/**
 * JWT Configuration
 * Centralized JWT settings for token generation and validation
 */
module.exports = {
  secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  
  // JWT Options
  options: {
    issuer: 'video-streaming-app',
    audience: 'video-streaming-users',
  }
};
