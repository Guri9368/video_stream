/**
 * Upload Video Page
 */
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import VideoUpload from '../components/video/VideoUpload';

const UploadVideo = () => {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    navigate('/videos');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <VideoUpload onUploadComplete={handleUploadComplete} />
      </div>
    </div>
  );
};

export default UploadVideo;
