/**
 * Video Details Page - Watch video and see metadata
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import videoService from '../services/video.service';
import Navbar from '../components/common/Navbar';
import VideoPlayer from '../components/video/VideoPlayer';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await videoService.getVideoById(id);
      setVideo(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    setDeleting(true);
    try {
      await videoService.deleteVideo(id);
      navigate('/videos');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete video');
      setDeleting(false);
    }
  };

  if (loading) return <Spinner message="Loading video..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} onClose={() => setError('')} />

        {video && (
          <div className="max-w-5xl mx-auto">
            {/* Video Player */}
            {video.processingStatus === 'completed' ? (
              <VideoPlayer videoId={video._id} title={video.title} />
            ) : (
              <div className="bg-gray-800 text-white rounded-lg p-12 text-center">
                <p className="text-xl mb-4">
                  {video.processingStatus === 'processing'
                    ? '⏳ Video is being processed...'
                    : video.processingStatus === 'failed'
                    ? '❌ Processing failed'
                    : '⏳ Processing pending'}
                </p>
                {video.processingProgress > 0 && (
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${video.processingProgress}%` }}
                      />
                    </div>
                    <p className="mt-2">{video.processingProgress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Video Info */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{video.title}</h1>
                  <p className="text-gray-600 mt-2">
                    Uploaded by {video.uploadedBy?.firstName} {video.uploadedBy?.lastName}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {video.sensitivityStatus === 'safe' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      ✓ Safe
                    </span>
                  )}
                  {video.sensitivityStatus === 'flagged' && (
                    <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
                      ⚠ Flagged
                    </span>
                  )}
                </div>
              </div>

              {video.description && (
                <p className="text-gray-700 mb-4">{video.description}</p>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="font-semibold">{video.views}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-semibold">
                    {(video.filesize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Uploaded</p>
                  <p className="font-semibold">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Sensitivity Details */}
              {video.sensitivityReason && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Content Analysis
                  </h3>
                  <p className="text-gray-700">{video.sensitivityReason}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Sensitivity Score: {video.sensitivityScore}/100
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/videos')}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Back to Library
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Video'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetails;
