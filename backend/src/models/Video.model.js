/**
 * Video Model
 * Stores video metadata, processing status, and sensitivity analysis results
 */
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // File Information
    originalFilename: {
      type: String,
      required: true
    },
    storedFilename: {
      type: String,
      required: true,
      unique: true
    },
    filepath: {
      type: String,
      required: true
    },
    filesize: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    format: {  // ✅ ADDED
      type: String,
      default: 'unknown'
    },
    resolution: {  // ✅ ADDED
      width: {
        type: Number,
        default: 0
      },
      height: {
        type: Number,
        default: 0
      }
    },
    videoCodec: {  // ✅ ADDED
      type: String,
      default: 'unknown'
    },
    bitrate: {  // ✅ ADDED
      type: Number,
      default: 0
    },
    fps: {  // ✅ ADDED
      type: Number,
      default: 0
    },
    
    // Processing Status
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    processingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    processingError: {
      type: String,
      default: null
    },
    processedAt: {
      type: Date
    },
    
    // Sensitivity Analysis
    sensitivityStatus: {
      type: String,
      enum: ['pending', 'safe', 'flagged'],
      default: 'pending',
      index: true
    },
    sensitivityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    sensitivityReason: {
      type: String
    },
    
    // Thumbnail
    thumbnailPath: {
      type: String
    },
    
    // Multi-tenant & Ownership
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    
    // Stats
    views: {
      type: Number,
      default: 0
    },
    
    // Metadata
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
videoSchema.index({ tenantId: 1, uploadedBy: 1 });
videoSchema.index({ tenantId: 1, sensitivityStatus: 1 });
videoSchema.index({ tenantId: 1, processingStatus: 1 });

// Virtual for video URL (can be used in frontend)
videoSchema.virtual('videoUrl').get(function() {
  return `/api/videos/${this._id}/stream`;
});

// Transform response
videoSchema.methods.toJSON = function () {
  const video = this.toObject({ virtuals: true });
  delete video.__v;
  return video;
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
