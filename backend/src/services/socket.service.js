/**
 * Socket.IO Service
 * Manages real-time WebSocket connections and events
 * Handles authentication and room-based communication
 */
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  /**
   * Initialize Socket.IO server
   * @param {http.Server} server - HTTP server instance
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Socket.IO middleware for authentication
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, jwtConfig.secret);
        socket.userId = decoded.userId;
        socket.tenantId = decoded.tenantId;
        socket.role = decoded.role;

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection event handlers
    this.io.on('connection', (socket) => {
      console.log(`✅ Socket connected: ${socket.id} (User: ${socket.userId})`);

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);

      // Join user to their tenant room for targeted broadcasts
      socket.join(`tenant:${socket.tenantId}`);
      socket.join(`user:${socket.userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    console.log('✅ Socket.IO initialized');
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Emit event to specific room (e.g., tenant)
   */
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Video upload progress event
   */
  emitUploadProgress(userId, videoId, progress) {
    this.emitToUser(userId, 'upload:progress', {
      videoId,
      percentage: progress.percentage,
      bytesUploaded: progress.bytesUploaded,
      totalBytes: progress.totalBytes
    });
  }

  /**
   * Video processing started event
   */
  emitProcessingStarted(userId, videoId) {
    this.emitToUser(userId, 'processing:started', {
      videoId,
      status: 'processing',
      timestamp: new Date()
    });
  }

  /**
   * Video processing progress event
   */
  emitProcessingProgress(userId, videoId, percentage, stage) {
    this.emitToUser(userId, 'processing:progress', {
      videoId,
      percentage,
      stage, // 'metadata', 'thumbnail', 'sensitivity_analysis'
      timestamp: new Date()
    });
  }

  /**
   * Video processing completed event
   */
  emitProcessingComplete(userId, videoData) {
    this.emitToUser(userId, 'processing:complete', {
      videoId: videoData.videoId,
      status: 'completed',
      sensitivityStatus: videoData.sensitivityStatus,
      sensitivityScore: videoData.sensitivityScore,
      duration: videoData.duration,
      thumbnailPath: videoData.thumbnailPath,
      timestamp: new Date()
    });
  }

  /**
   * Video processing error event
   */
  emitProcessingError(userId, videoId, error) {
    this.emitToUser(userId, 'processing:error', {
      videoId,
      error: error.message || 'Processing failed',
      timestamp: new Date()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

// Export singleton instance
module.exports = new SocketService();
