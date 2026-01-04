/**
 * Video Card Component - Display video in grid/list
 */
import { useNavigate } from 'react-router-dom';

const VideoCard = ({ video, onVideoClick }) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Ready' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
    };

    const config = statusConfig[video.processingStatus] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getSensitivityBadge = () => {
    if (video.sensitivityStatus === 'safe') {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          ✓ Safe
        </span>
      );
    } else if (video.sensitivityStatus === 'flagged') {
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          ⚠ Flagged
        </span>
      );
    }
    return null;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (video.processingStatus === 'completed') {
      if (onVideoClick) {
        onVideoClick(video._id);
      } else {
        navigate(`/video/${video._id}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
      {/* Thumbnail */}
      <div 
        className="relative h-48 bg-gray-200 cursor-pointer"
        onClick={handleClick}
      >
        {video.thumbnailPath ? (
          <img
            src={`http://localhost:5000${video.thumbnailPath}`}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-6xl">🎬</span>
          </div>
        )}
        
        {/* Duration Badge */}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Processing Overlay */}
        {video.processingStatus === 'processing' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-xs">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
          {video.title}
        </h3>
        
        {video.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            {new Date(video.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs text-gray-500">
            👁 {video.views || 0} views
          </span>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-3">
          {getStatusBadge()}
          {getSensitivityBadge()}
        </div>

        {/* Actions */}
        <button
          onClick={handleClick}
          disabled={video.processingStatus !== 'completed'}
          className={`w-full text-center py-2 rounded-lg transition font-medium ${
            video.processingStatus === 'completed'
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {video.processingStatus === 'completed' ? 'Watch Video' : 'Processing...'}
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
