/**
 * Video Service
 */
import api from './api';

const videoService = {
  // Upload video
  uploadVideo: async (formData, onUploadProgress) => {
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Get all videos
  getVideos: async (params = {}) => {
    const response = await api.get('/videos', { params });
    return response.data;
  },

  // Get single video
  getVideoById: async (videoId) => {
    const response = await api.get(`/videos/${videoId}`);
    return response.data;
  },

  // Get video stream URL
  getStreamUrl: (videoId) => {
    const token = localStorage.getItem('token');
    return `${import.meta.env.VITE_API_URL}/videos/${videoId}/stream?token=${token}`;
  },

  // Update video
  updateVideo: async (videoId, data) => {
    const response = await api.patch(`/videos/${videoId}`, data);
    return response.data;
  },

  // Delete video
  deleteVideo: async (videoId) => {
    const response = await api.delete(`/videos/${videoId}`);
    return response.data;
  },

  // Get processing status
  getProcessingStatus: async (videoId) => {
    const response = await api.get(`/videos/${videoId}/status`);
    return response.data;
  },
};

export default videoService;
