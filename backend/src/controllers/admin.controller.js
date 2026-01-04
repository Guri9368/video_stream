/**
 * Admin Controller
 * Handles user management and administrative operations
 */
const User = require('../models/User.model');
const Video = require('../models/Video.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * List all users in tenant
 * GET /api/admin/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    role = null,
    search = ''
  } = req.query;

  // Build query (same tenant only)
  const query = {
    tenantId: req.user.tenantId
  };

  if (role) {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('-password')
    .lean();

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limitNum);

  res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        limit: limitNum
      }
    }, 'Users retrieved successfully')
  );
});

/**
 * Get user by ID
 * GET /api/admin/users/:userId
 */
const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const user = await User.findOne({
    _id: userId,
    tenantId: req.user.tenantId // Same tenant only
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Get user's video stats
  const videoStats = await Video.aggregate([
    { $match: { uploadedBy: user._id } },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: '$views' },
        safeVideos: {
          $sum: { $cond: [{ $eq: ['$sensitivityStatus', 'safe'] }, 1, 0] }
        },
        flaggedVideos: {
          $sum: { $cond: [{ $eq: ['$sensitivityStatus', 'flagged'] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      user,
      stats: videoStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        safeVideos: 0,
        flaggedVideos: 0
      }
    }, 'User details retrieved successfully')
  );
});

/**
 * Update user role
 * PATCH /api/admin/users/:userId/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const { role } = req.body;

  // Prevent admin from changing their own role
  if (userId === req.user.userId.toString()) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  const user = await User.findOne({
    _id: userId,
    tenantId: req.user.tenantId
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.role = role;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, user, `User role updated to ${role}`)
  );
});

/**
 * Toggle user active status
 * PATCH /api/admin/users/:userId/toggle-status
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Prevent admin from deactivating themselves
  if (userId === req.user.userId.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  const user = await User.findOne({
    _id: userId,
    tenantId: req.user.tenantId
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      userId: user._id,
      isActive: user.isActive
    }, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`)
  );
});

/**
 * Get system statistics (admin dashboard)
 * GET /api/admin/stats
 */
const getSystemStats = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;

  // User stats
  const userStats = await User.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  // Video stats
  const videoStats = await Video.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalSize: { $sum: '$filesize' },
        safeVideos: {
          $sum: { $cond: [{ $eq: ['$sensitivityStatus', 'safe'] }, 1, 0] }
        },
        flaggedVideos: {
          $sum: { $cond: [{ $eq: ['$sensitivityStatus', 'flagged'] }, 1, 0] }
        },
        processingVideos: {
          $sum: { $cond: [{ $eq: ['$processingStatus', 'processing'] }, 1, 0] }
        }
      }
    }
  ]);

  // Recent activity (last 10 videos)
  const recentVideos = await Video.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('uploadedBy', 'firstName lastName email')
    .select('title createdAt processingStatus sensitivityStatus');

  res.status(200).json(
    new ApiResponse(200, {
      users: {
        total: userStats.reduce((acc, curr) => acc + curr.count, 0),
        byRole: userStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      },
      videos: videoStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalSize: 0,
        safeVideos: 0,
        flaggedVideos: 0,
        processingVideos: 0
      },
      recentActivity: recentVideos
    }, 'System statistics retrieved successfully')
  );
});

/**
 * Delete user (and all their videos)
 * DELETE /api/admin/users/:userId
 */
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Prevent admin from deleting themselves
  if (userId === req.user.userId.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findOne({
    _id: userId,
    tenantId: req.user.tenantId
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete all user's videos and files
  const userVideos = await Video.find({ uploadedBy: userId });
  
  const VideoProcessorService = require('../services/video-processor.service');
  for (const video of userVideos) {
    await VideoProcessorService.deleteVideoFiles(video.filepath, video.thumbnailPath);
  }

  // Delete videos from database
  await Video.deleteMany({ uploadedBy: userId });

  // Delete user
  await User.findByIdAndDelete(userId);

  res.status(200).json(
    new ApiResponse(200, null, 'User and associated data deleted successfully')
  );
});

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  getSystemStats,
  deleteUser
};
