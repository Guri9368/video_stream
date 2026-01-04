/**
 * Video Player Component with Streaming Support
 */
import { useEffect, useRef } from 'react';

const VideoPlayer = ({ videoId, title }) => {
  const videoRef = useRef(null);
  const token = localStorage.getItem('token');
  const streamUrl = `http://localhost:5000/api/videos/${videoId}/stream`;

  useEffect(() => {
    // Optional: Add analytics or event tracking
    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', () => {
        console.log('Video started playing');
      });
    }

    return () => {
      if (video) {
        video.removeEventListener('play', () => {});
      }
    };
  }, []);

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        controls
        className="w-full"
        style={{ maxHeight: '70vh' }}
      >
        <source src={streamUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {title && (
        <div className="bg-gray-800 text-white px-4 py-2">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
