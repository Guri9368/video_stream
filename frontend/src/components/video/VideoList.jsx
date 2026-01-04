/**
 * Video List Component with Filtering
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import videoService from '../../services/video.service';
import VideoCard from './VideoCard';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';

const VideoList = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, [filter, search]);

  const fetchVideos = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await videoService.getVideos({
        page,
        limit: 12,
        filter,
        search,
      });

      setVideos(response.data.videos);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Videos</option>
            <option value="safe">Safe Only</option>
            <option value="flagged">Flagged Only</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Loading */}
      {loading && <Spinner message="Loading videos..." />}

      {/* Video Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard 
              key={video._id} 
              video={video} 
              onVideoClick={handleVideoClick}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && videos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No videos found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => fetchVideos(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchVideos(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoList;
