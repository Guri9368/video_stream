import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get token from localStorage
  const token = localStorage.getItem('token');


   console.log('Token:', token ? 'EXISTS' : 'MISSING');

  useEffect(() => {
    fetchVideoDetails();
  }, [id]);

  const fetchVideoDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/videos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVideo(response.data.data);
      setEditForm({
        title: response.data.data.title,
        description: response.data.data.description || ''
      });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ title: video.title, description: video.description || '' });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/videos/${id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVideo({ ...video, ...editForm });
      setIsEditing(false);
      alert('Video updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update video');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/videos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Video deleted successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video');
      setShowDeleteConfirm(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="player-container">
        <div className="loading-spinner">Loading video...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="player-container">
        <div className="error-message">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (video.processingStatus !== 'completed') {
    return (
      <div className="player-container">
        <div className="processing-message">
          <h2>Video is still processing</h2>
          <p>Current status: {video.processingStatus}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-container">
      <div className="player-wrapper">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back
        </button>

        <div className="video-wrapper">
          <video
            controls
            autoPlay
            className="video-element"
            src={`http://localhost:5000/api/videos/stream/${video._id}`}


          >
            Your browser doesn't support video playback.
          </video>
        </div>

        <div className="video-info">
          <div className="video-header">
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="edit-input edit-title"
                placeholder="Video title"
              />
            ) : (
              <h1>{video.title}</h1>
            )}
            
            <div className="video-badges">
              {video.sensitivityStatus === 'flagged' ? (
                <span className="badge badge-warning">⚠️ Flagged</span>
              ) : (
                <span className="badge badge-safe">✓ Safe</span>
              )}
              <span className="badge badge-status">{video.processingStatus}</span>
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="edit-input edit-description"
              placeholder="Video description"
              rows="3"
            />
          ) : (
            video.description && (
              <p className="video-description">{video.description}</p>
            )
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {isEditing ? (
              <>
                <button onClick={handleSaveEdit} className="btn btn-save">
                  💾 Save Changes
                </button>
                <button onClick={handleCancelEdit} className="btn btn-cancel">
                  ✖ Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} className="btn btn-edit">
                  ✏️ Edit Video
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="btn btn-delete"
                >
                  🗑️ Delete Video
                </button>
              </>
            )}
          </div>

          <div className="video-metadata">
            <div className="meta-item">
              <span className="meta-label">Duration:</span>
              <span className="meta-value">{formatDuration(video.duration)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Size:</span>
              <span className="meta-value">{formatFileSize(video.filesize)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Resolution:</span>
              <span className="meta-value">
                {video.resolution?.width && video.resolution?.height 
                  ? `${video.resolution.width}x${video.resolution.height}`
                  : 'Unknown'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Format:</span>
              <span className="meta-value">{video.format || 'Unknown'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Uploaded:</span>
              <span className="meta-value">
                {new Date(video.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Video?</h2>
            <p>Are you sure you want to delete "{video.title}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={handleDelete} className="btn btn-delete-confirm">
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
