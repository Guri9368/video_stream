/**
 * Video Streaming Service
 * Handles HTTP range requests for video streaming
 */
const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');

class StreamingService {
  /**
   * Stream video with range request support
   * Enables seeking and progressive loading in video players
   * 
   * @param {string} videoPath - Absolute path to video file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static streamVideo(videoPath, req, res) {
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      throw new ApiError(404, 'Video file not found');
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse Range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Validate range
      if (start >= fileSize || end >= fileSize) {
        res.status(416).send('Requested range not satisfiable');
        return;
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(videoPath, { start, end });

      // Set headers for partial content
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': this.getMimeType(videoPath),
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      };

      res.writeHead(206, headers); // 206 Partial Content
      fileStream.pipe(res);

      // Handle stream errors
      fileStream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Error streaming video');
        }
      });

    } else {
      // No range header - send entire file
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': this.getMimeType(videoPath),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000'
      };

      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
    }
  }

  /**
   * Get MIME type based on file extension
   */
  static getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Stream thumbnail image
   */
  static streamThumbnail(thumbnailPath, res) {
    if (!fs.existsSync(thumbnailPath)) {
      throw new ApiError(404, 'Thumbnail not found');
    }

    const stat = fs.statSync(thumbnailPath);
    const headers = {
      'Content-Length': stat.size,
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000'
    };

    res.writeHead(200, headers);
    fs.createReadStream(thumbnailPath).pipe(res);
  }

  /**
   * Get video chunk for download
   * @param {string} videoPath - Path to video
   * @param {number} start - Start byte
   * @param {number} end - End byte
   * @returns {ReadStream} File stream
   */
  static getVideoChunk(videoPath, start, end) {
    if (!fs.existsSync(videoPath)) {
      throw new ApiError(404, 'Video file not found');
    }

    return fs.createReadStream(videoPath, { start, end });
  }

  /**
   * Calculate video streaming bandwidth
   */
  static calculateBandwidth(fileSize, duration) {
    // Bitrate in kbps
    return Math.round((fileSize * 8) / (duration * 1024));
  }
}

module.exports = StreamingService;
