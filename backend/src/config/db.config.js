/**
 * MongoDB Database Configuration
 * Handles connection to MongoDB with error handling and connection events
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`\n✅ MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection FAILED:', error.message);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
