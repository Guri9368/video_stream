/**
 * Dashboard Page - Overview of user's videos
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import videoService from '../services/video.service';
import Navbar from '../components/common/Navbar';
import Spinner from '../components/common/Spinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await videoService.getVideos({ limit: 5 });
      setRecentVideos(response.data.videos);
      
      // Calculate stats
      const videos = response.data.videos;
      setStats({
        total: response.data.pagination.totalVideos,
        safe: videos.filter(v => v.sensitivityStatus === 'safe').length,
        flagged: videos.filter(v => v.sensitivityStatus === 'flagged').length,
        processing: videos.filter(v => v.processingStatus === 'processing').length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner message="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Role: <span className="font-semibold">{user.role}</span>
            {connected && (
              <span className="ml-4 text-green-600">
                🟢 Real-time connected
              </span>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-500 text-white rounded-lg shadow-lg p-6">
              <div className="text-4xl font-bold mb-2">{stats.total}</div>
              <div className="text-blue-100">Total Videos</div>
            </div>
            
            <div className="bg-green-500 text-white rounded-lg shadow-lg p-6">
              <div className="text-4xl font-bold mb-2">{stats.safe}</div>
              <div className="text-green-100">Safe Videos</div>
            </div>
            
            <div className="bg-red-500 text-white rounded-lg shadow-lg p-6">
              <div className="text-4xl font-bold mb-2">{stats.flagged}</div>
              <div className="text-red-100">Flagged Videos</div>
            </div>
            
            <div className="bg-yellow-500 text-white rounded-lg shadow-lg p-6">
              <div className="text-4xl font-bold mb-2">{stats.processing}</div>
              <div className="text-yellow-100">Processing</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/videos"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
            >
              📚 View All Videos
            </Link>
            
            {(user.role === 'editor' || user.role === 'admin') && (
              <Link
                to="/upload"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
              >
                ⬆️ Upload Video
              </Link>
            )}
            
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                ⚙️ Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Videos</h2>
          {recentVideos.length > 0 ? (
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <Link
                  key={video._id}
                  to={`/videos/${video._id}`}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0">
                    {video.thumbnailPath ? (
                      <img
                        src={`http://localhost:5000${video.thumbnailPath}`}
                        alt={video.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        🎬
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{video.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {video.sensitivityStatus === 'safe' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Safe
                      </span>
                    )}
                    {video.sensitivityStatus === 'flagged' && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        Flagged
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No videos yet. Upload your first video!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
