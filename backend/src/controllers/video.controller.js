/**
 * Video Controller
 * Handles video upload, listing, streaming, and management
 */
const Video = require('../models/Video.model');
const VideoProcessorService = require('../services/video-processor.service');
const SensitivityAnalysisService = require('../services/sensitivity.service');
const StreamingService = require('../services/streaming.service');
const socketService = require('../services/socket.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const path = require('path');
const fs = require('fs');

/**
 * Upload video
 * POST /api/videos/upload
 */
const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No video file uploaded');
  }

  const { title, description, tags } = req.body;
  const file = req.file;

  // Create video record in database
  const video = await Video.create({
    title,
    description,
    originalFilename: file.originalname,
    storedFilename: file.filename,
    filepath: path.resolve(file.path),
    filesize: file.size,
    mimetype: file.mimetype,
    uploadedBy: req.user.userId,
    tenantId: req.user.tenantId,
    tags: tags ? JSON.parse(tags) : [],
    processingStatus: 'pending'
  });

  // Send immediate response
  res.status(201).json(
    new ApiResponse(201, {
      videoId: video._id,
      title: video.title,
      filename: video.storedFilename,
      filesize: video.filesize,
      processingStatus: video.processingStatus,
      createdAt: video.createdAt
    }, 'Video uploaded successfully. Processing will begin shortly.')
  );

  // Start background processing (don't await)
  processVideoInBackground(video, req.user.userId);
});

/**
 * Background video processing function
 */
async function processVideoInBackground(video, userId) {
  try {
    // Emit processing started event
    socketService.emitProcessingStarted(userId, video._id);

    // Update status to processing
    video.processingStatus = 'processing';
    video.processingProgress = 0;
    await video.save();

    // Step 1: Extract metadata (20% progress)
    socketService.emitProcessingProgress(userId, video._id, 20, 'metadata_extraction');
    const metadata = await VideoProcessorService.extractMetadata(video.filepath);
    
    // Save ALL metadata fields
    video.duration = metadata.duration;
    video.filesize = metadata.size || video.filesize;
    video.format = metadata.format;
    video.resolution = {
      width: metadata.width,
      height: metadata.height
    };
    video.videoCodec = metadata.videoCodec;
    video.bitrate = metadata.bitrate;
    video.fps = metadata.fps;
    video.processingProgress = 20;
    await video.save();

    // Step 2: Generate thumbnail (40% progress)
    socketService.emitProcessingProgress(userId, video._id, 40, 'thumbnail_generation');
    const thumbnailPath = await VideoProcessorService.generateThumbnail(
      video.filepath,
      process.env.THUMBNAIL_PATH || './uploads/thumbnails',
      Math.min(metadata.duration / 2, 5)
    );

    video.thumbnailPath = thumbnailPath;
    video.processingProgress = 40;
    await video.save();

    // Step 3: Sensitivity analysis (70% progress)
    socketService.emitProcessingProgress(userId, video._id, 70, 'sensitivity_analysis');
    const sensitivityResult = await SensitivityAnalysisService.analyzeVideo(
      video.filepath,
      metadata
    );

    video.sensitivityStatus = sensitivityResult.sensitivityStatus;
    video.sensitivityScore = sensitivityResult.sensitivityScore;
    video.sensitivityReason = sensitivityResult.sensitivityReason;
    video.processingProgress = 90;
    await video.save();

    // Step 4: Complete processing
    video.processingStatus = 'completed';
    video.processingProgress = 100;
    video.processedAt = new Date();
    await video.save();

    // Emit completion event
    socketService.emitProcessingComplete(userId, {
      videoId: video._id,
      sensitivityStatus: video.sensitivityStatus,
      sensitivityScore: video.sensitivityScore,
      duration: video.duration,
      thumbnailPath: video.thumbnailPath
    });

  } catch (error) {
    console.error('Video processing error:', error);

    // Update video status to failed
    video.processingStatus = 'failed';
    video.processingError = error.message;
    await video.save();

    // Emit error event
    socketService.emitProcessingError(userId, video._id, error);
  }
}

/**
 * List videos with filtering and pagination
 * GET /api/videos
 */
const listVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    filter = 'all',
    search = '',
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = {
    tenantId: req.user.tenantId
  };

  // Role-based filtering
  if (req.user.role !== 'admin') {
    query.uploadedBy = req.user.userId;
  }

  // Sensitivity filter
  if (filter !== 'all') {
    query.sensitivityStatus = filter;
  }

  // Search in title and description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };

  // Execute query
  const videos = await Video.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .populate('uploadedBy', 'firstName lastName email')
    .lean();

  // Get total count for pagination
  const totalVideos = await Video.countDocuments(query);
  const totalPages = Math.ceil(totalVideos / limitNum);

  res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalVideos,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }, 'Videos retrieved successfully')
  );
});

/**
 * Get single video details
 * GET /api/videos/:id
 */
const getVideoById = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  const query = {
    _id: videoId,
    tenantId: req.user.tenantId
  };

  // Non-admins can only see their own videos
  if (req.user.role !== 'admin') {
    query.uploadedBy = req.user.userId;
  }

  const video = await Video.findOne(query)
    .populate('uploadedBy', 'firstName lastName email');

  if (!video) {
    throw new ApiError(404, 'Video not found or access denied');
  }

  res.status(200).json(
    new ApiResponse(200, video, 'Video retrieved successfully')
  );
});

/**
 * Stream video (PUBLIC - No auth required)
 * GET /api/videos/stream/:id
 */
const streamVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  console.log('\n=== VIDEO STREAM REQUEST ===');
  console.log('Video ID:', videoId);
  console.log('Range Header:', req.headers.range);

  // Find video without tenant/user restrictions (public streaming)
  const video = await Video.findById(videoId);

  if (!video) {
    console.log('❌ Video not found in database');
    throw new ApiError(404, 'Video not found');
  }

  console.log('✅ Video found:', video.title);
  console.log('📁 File path:', video.filepath);
  console.log('📊 Processing status:', video.processingStatus);
  console.log('💾 File size:', video.filesize, 'bytes');

  if (video.processingStatus !== 'completed') {
    console.log('❌ Video not completed. Status:', video.processingStatus);
    throw new ApiError(400, 'Video is still being processed');
  }

  // Check if file exists
  const fileExists = fs.existsSync(video.filepath);
  console.log('📂 File exists:', fileExists);

  if (!fileExists) {
    console.log('❌ Video file not found at path:', video.filepath);
    throw new ApiError(404, 'Video file not found on server');
  }

  console.log('✅ Starting video stream...');
  console.log('=========================\n');

  // Increment views count (don't await to avoid blocking stream)
  video.views += 1;
  video.save().catch(err => console.error('Error updating views:', err));

  // Stream video using streaming service
  StreamingService.streamVideo(video.filepath, req, res);
});

/**
 * Get video processing status
 * GET /api/videos/:id/status
 */
const getProcessingStatus = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  const video = await Video.findOne({
    _id: videoId,
    tenantId: req.user.tenantId
  }).select('processingStatus processingProgress processingError sensitivityStatus');

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  res.status(200).json(
    new ApiResponse(200, {
      videoId: video._id,
      processingStatus: video.processingStatus,
      processingProgress: video.processingProgress,
      processingError: video.processingError,
      sensitivityStatus: video.sensitivityStatus
    }, 'Processing status retrieved successfully')
  );
});

/**
 * Update video
 * PUT /api/videos/:id
 */
const updateVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.id;
  const { title, description, tags } = req.body;

  const query = {
    _id: videoId,
    tenantId: req.user.tenantId
  };

  // Non-admins can only update their own videos
  if (req.user.role !== 'admin') {
    query.uploadedBy = req.user.userId;
  }

  const video = await Video.findOne(query);

  if (!video) {
    throw new ApiError(404, 'Video not found or access denied');
  }

  // Update fields
  if (title) video.title = title;
  if (description !== undefined) video.description = description;
  if (tags) video.tags = tags;

  await video.save();

  res.status(200).json(
    new ApiResponse(200, video, 'Video updated successfully')
  );
});

/**
 * Delete video
 * DELETE /api/videos/:id
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.id;

  const query = {
    _id: videoId,
    tenantId: req.user.tenantId
  };

  // Non-admins can only delete their own videos
  if (req.user.role !== 'admin') {
    query.uploadedBy = req.user.userId;
  }

  const video = await Video.findOne(query);

  if (!video) {
    throw new ApiError(404, 'Video not found or access denied');
  }

  // Delete physical files
  try {
    if (fs.existsSync(video.filepath)) {
      fs.unlinkSync(video.filepath);
      console.log('✅ Deleted video file:', video.filepath);
    }
    if (video.thumbnailPath && fs.existsSync(video.thumbnailPath)) {
      fs.unlinkSync(video.thumbnailPath);
      console.log('✅ Deleted thumbnail:', video.thumbnailPath);
    }
  } catch (error) {
    console.error('Error deleting files:', error);
  }

  // Delete database record
  await Video.findByIdAndDelete(videoId);

  res.status(200).json(
    new ApiResponse(200, null, 'Video deleted successfully')
  );
});

module.exports = {
  uploadVideo,
  listVideos,
  getVideoById,
  streamVideo,
  getProcessingStatus,
  updateVideo,
  deleteVideo,
};
