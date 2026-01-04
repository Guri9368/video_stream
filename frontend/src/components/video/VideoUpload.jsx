/**
 * Video Upload Component with Real-time Progress
 */
import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import videoService from '../../services/video.service';
import ErrorMessage from '../common/ErrorMessage';

const VideoUpload = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [videoId, setVideoId] = useState(null);
  
  const { socket } = useSocket();

  // Listen for processing events
  useEffect(() => {
    if (socket && videoId) {
      socket.on('processing:started', (data) => {
        if (data.videoId === videoId) {
          setProcessing(true);
          setUploading(false);
        }
      });

      socket.on('processing:progress', (data) => {
        if (data.videoId === videoId) {
          setProcessingProgress(data.percentage);
        }
      });

      socket.on('processing:complete', (data) => {
        if (data.videoId === videoId) {
          setProcessing(false);
          setProcessingProgress(100);
          setTimeout(() => {
            if (onUploadComplete) onUploadComplete();
            resetForm();
          }, 1500);
        }
      });

      socket.on('processing:error', (data) => {
        if (data.videoId === videoId) {
          setError(data.error);
          setProcessing(false);
        }
      });

      return () => {
        socket.off('processing:started');
        socket.off('processing:progress');
        socket.off('processing:complete');
        socket.off('processing:error');
      };
    }
  }, [socket, videoId, onUploadComplete]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a video file.');
        return;
      }

      // Validate file size (500MB)
      const maxSize = 500 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 500MB.');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide a file and title');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      const response = await videoService.uploadVideo(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });

      setVideoId(response.data.videoId);
      // Processing will be tracked via socket events
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setProcessingProgress(0);
    setUploading(false);
    setProcessing(false);
    setVideoId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Video</h2>

      <ErrorMessage message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Select Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading || processing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading || processing}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter video title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading || processing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter video description (optional)"
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Uploading: {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {processing && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Processing: {processingProgress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || processing || !file || !title}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload;
