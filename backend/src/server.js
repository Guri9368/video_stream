/**
 * Main Server File
 * Initializes Express app, middleware, routes, and Socket.IO
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db.config');
const socketService = require('./services/socket.service');
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const adminRoutes = require('./routes/admin.routes');

// Import video controller for public stream route
const videoController = require('./controllers/video.controller');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
socketService.initialize(server);

/**
 * Middleware
 */

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 auth requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

/**
 * Routes
 */

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    socketConnections: socketService.getConnectedUsersCount()
  });
});

// ✅ PUBLIC STREAM ROUTE - Must be BEFORE rate limiter and auth routes
app.get('/api/videos/stream/:id', videoController.streamVideo);

// Apply rate limiter to API routes (AFTER public stream route)
app.use('/api/', limiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded files (thumbnails)
app.use('/uploads/thumbnails', express.static(process.env.THUMBNAIL_PATH || './uploads/thumbnails'));

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Start server
 */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     🎬 VIDEO STREAMING SERVER STARTED                 ║
║                                                        ║
║     Environment: ${process.env.NODE_ENV || 'development'}                              ║
║     Port: ${PORT}                                           ║
║     API: http://localhost:${PORT}/api                      ║
║     Health: http://localhost:${PORT}/health                ║
║                                                        ║
║     WebSocket: Enabled ✅                              ║
║     Database: Connected ✅                             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
