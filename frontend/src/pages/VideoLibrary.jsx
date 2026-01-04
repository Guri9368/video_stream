/**
 * Video Library Page - Display all videos with filtering
 */
import Navbar from '../components/common/Navbar';
import VideoList from '../components/video/VideoList';

const VideoLibrary = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Video Library</h1>
        <VideoList />
      </div>
    </div>
  );
};

export default VideoLibrary;
