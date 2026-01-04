/**
 * Video Processing Service
 * Handles FFmpeg video processing, metadata extraction, and thumbnail generation
 */
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Set FFmpeg paths if specified in environment
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

class VideoProcessorService {
  /**
   * Extract video metadata (duration, resolution, codec)
   * @param {string} videoPath - Absolute path to video file
   * @returns {Promise<Object>} Video metadata
   */
  static async extractMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(new Error(`Failed to extract metadata: ${err.message}`));
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        
        if (!videoStream) {
          return reject(new Error('No video stream found in file'));
        }

        // Extract format name (e.g., "mov,mp4,m4a,3gp,3g2,mj2" -> "mp4")
        const formatName = metadata.format.format_name 
          ? metadata.format.format_name.split(',')[0] 
          : 'unknown';

        resolve({
          duration: Math.round(metadata.format.duration || 0),
          size: metadata.format.size || 0,
          bitrate: metadata.format.bit_rate || 0,
          format: formatName,
          videoCodec: videoStream.codec_name || 'unknown',
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: eval(videoStream.r_frame_rate) || 0 // Convert "30/1" to 30
        });
      });
    });
  }

  /**
   * Generate thumbnail from video
   * @param {string} videoPath - Path to video file
   * @param {string} outputPath - Path where thumbnail should be saved
   * @param {number} timeInSeconds - Time position for thumbnail (default: 1 second)
   * @returns {Promise<string>} Path to generated thumbnail
   */
  static async generateThumbnail(videoPath, outputPath, timeInSeconds = 1) {
    return new Promise((resolve, reject) => {
      const thumbnailFilename = `thumb-${Date.now()}.jpg`;
      const thumbnailPath = path.join(outputPath, thumbnailFilename);

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeInSeconds],
          filename: thumbnailFilename,
          folder: outputPath,
          size: '320x240'
        })
        .on('end', () => {
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          reject(new Error(`Thumbnail generation failed: ${err.message}`));
        });
    });
  }

  /**
   * Process video with progress tracking
   * Converts video to standard format and reports progress
   * @param {string} inputPath - Input video path
   * @param {string} outputPath - Output video path
   * @param {Function} onProgress - Progress callback (percentage)
   * @returns {Promise<Object>} Processing result
   */
  static async processVideo(inputPath, outputPath, onProgress = null) {
    return new Promise((resolve, reject) => {
      let duration = 0;

      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264') // Standard H.264 codec
        .audioCodec('aac') // Standard AAC audio
        .format('mp4') // MP4 container
        .on('codecData', (data) => {
          // Get total duration for progress calculation
          duration = parseFloat(data.duration.replace(/:/g, ''));
        })
        .on('progress', (progress) => {
          if (onProgress && duration > 0) {
            // Calculate percentage based on timemark
            const timeInSeconds = parseFloat(progress.timemark.replace(/:/g, ''));
            const percentage = Math.min(Math.round((timeInSeconds / duration) * 100), 99);
            onProgress(percentage);
          }
        })
        .on('end', () => {
          resolve({
            success: true,
            outputPath: outputPath
          });
        })
        .on('error', (err) => {
          // Clean up output file if exists
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
          reject(new Error(`Video processing failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Validate video file integrity
   * @param {string} videoPath - Path to video file
   * @returns {Promise<boolean>} True if valid
   */
  static async validateVideo(videoPath) {
    try {
      await this.extractMetadata(videoPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get video file info (size, format)
   * @param {string} videoPath - Path to video file
   * @returns {Object} File information
   */
  static getFileInfo(videoPath) {
    const stats = fs.statSync(videoPath);
    const ext = path.extname(videoPath).toLowerCase();
    
    return {
      size: stats.size,
      sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
      extension: ext,
      exists: fs.existsSync(videoPath)
    };
  }

  /**
   * Delete video and associated files
   * @param {string} videoPath - Path to video file
   * @param {string} thumbnailPath - Path to thumbnail (optional)
   */
  static async deleteVideoFiles(videoPath, thumbnailPath = null) {
    try {
      // Delete video file
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }

      // Delete thumbnail if exists
      if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      return true;
    } catch (error) {
      console.error('Error deleting video files:', error);
      return false;
    }
  }
}

module.exports = VideoProcessorService;
