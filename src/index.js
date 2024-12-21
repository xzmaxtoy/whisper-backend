import express from 'express';
import multer from 'multer';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { promisify } from 'util';
import path from 'path';
import axios from 'axios';
import cors from 'cors';

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// ES modules configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Add middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Utility function to get audio duration
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

// Function to split audio file into chunks
const splitAudioFile = async (inputPath, outputDir, maxChunkSize = 24) => {
  try {
    // Create output directory if it doesn't exist
    await mkdirAsync(outputDir, { recursive: true });
    
    // Get audio duration
    const duration = await getAudioDuration(inputPath);
    const chunks = Math.ceil(duration / maxChunkSize);
    const chunkPaths = [];

    // Split file into chunks
    for (let i = 0; i < chunks; i++) {
      const outputPath = path.join(outputDir, `chunk_${i}.mp3`);
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(i * maxChunkSize)
          .setDuration(maxChunkSize)
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      chunkPaths.push(outputPath);
    }

    return chunkPaths;
  } catch (error) {
    throw new Error(`Failed to split audio file: ${error.message}`);
  }
};

// Function to download file from URL
const downloadFile = async (url, outputPath) => {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

// Function to process transcription
const processTranscription = async (filePath, options, filesToCleanup) => {
  const stats = fs.statSync(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);
  
  let transcription;
  
  // Handle large files
  if (fileSizeInMB > 24) {
    const chunksDir = path.join('uploads', 'chunks');
    const chunkPaths = await splitAudioFile(filePath, chunksDir);
    filesToCleanup.push(...chunkPaths);

    // Process each chunk
    const chunkResults = await Promise.all(
      chunkPaths.map(async (chunkPath, index) => {
        const chunkOptions = {
          ...options,
          file: fs.createReadStream(chunkPath),
          // Add chunk number to prompt if exists
          prompt: options.prompt 
            ? `${options.prompt} (Part ${index + 1})`
            : `Part ${index + 1}`
        };
        const result = await openai.audio.transcriptions.create(chunkOptions);
        return result.text;
      })
    );

    // Combine results
    transcription = {
      text: chunkResults.join(' ')
    };
  } else {
    // Process single file
    const singleFileOptions = {
      ...options,
      file: fs.createReadStream(filePath)
    };
    transcription = await openai.audio.transcriptions.create(singleFileOptions);
  }

  return transcription;
};

// Function to clean up files
const cleanupFiles = async (files) => {
  for (const file of files) {
    try {
      await unlinkAsync(file);
    } catch (error) {
      console.error(`Error deleting file ${file}:`, error);
    }
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's max)
  },
  fileFilter: (req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav',
      'audio/webm', 'audio/ogg', 'audio/x-m4a', 'audio/wave',
      'audio/x-pn-wav', 'audio/vnd.wave'
    ];
    // Check file extension as well since mime types can be inconsistent
    const allowedExtensions = ['.mp3', '.mp4', '.wav', '.wave', '.webm', '.ogg', '.m4a'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcribe audio file using OpenAI Whisper API
 * @route POST /api/transcribe
 * @param {File} file - The audio file to transcribe
 * @param {string} [prompt] - Optional text to guide the model's style
 * @param {number} [temperature=0] - Sampling temperature (0-1)
 * @param {string} [language] - Language of the audio
 * @param {string} [response_format=json] - Response format (json, text, srt, verbose_json, or vtt)
 */
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  const filesToCleanup = [];
  try {
    // Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    filesToCleanup.push(req.file.path);
    
    // Prepare base options
    const baseOptions = {
      model: 'whisper-1',
      response_format: req.body.response_format || 'json'
    };

    // Add optional parameters if provided
    if (req.body.prompt) baseOptions.prompt = req.body.prompt;
    if (req.body.temperature) {
      const temp = parseFloat(req.body.temperature);
      if (temp >= 0 && temp <= 1) {
        baseOptions.temperature = temp;
      } else {
        return res.status(400).json({ error: 'Temperature must be between 0 and 1' });
      }
    }
    if (req.body.language) baseOptions.language = req.body.language;

    // Convert file to proper format if needed
    let audioPath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExtension === '.wav') {
      const convertedPath = path.join('uploads', `converted_${Date.now()}.mp3`);
      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(convertedPath);
      });
      filesToCleanup.push(convertedPath);
      audioPath = convertedPath;
    }

    const transcription = await processTranscription(audioPath, baseOptions, filesToCleanup);

    // Clean up all files
    await cleanupFiles(filesToCleanup);

    // Send response
    res.json(transcription);
  } catch (error) {
    // Clean up all files in case of error
    await cleanupFiles(filesToCleanup);

    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error.message
    });
  }
});

// Route for URL-based transcription
app.post('/api/transcribe/url', async (req, res) => {
  const filesToCleanup = [];
  try {
    // Validate URL presence
    if (!req.body.url) {
      return res.status(400).json({ error: 'No audio URL provided' });
    }

    // Download file from URL
    const downloadPath = path.join('uploads', `download_${Date.now()}.mp3`);
    await downloadFile(req.body.url, downloadPath);
    filesToCleanup.push(downloadPath);

    // Prepare base options
    const baseOptions = {
      model: 'whisper-1',
      response_format: req.body.response_format || 'json'
    };

    // Add optional parameters if provided
    if (req.body.prompt) baseOptions.prompt = req.body.prompt;
    if (req.body.temperature) {
      const temp = parseFloat(req.body.temperature);
      if (temp >= 0 && temp <= 1) {
        baseOptions.temperature = temp;
      } else {
        return res.status(400).json({ error: 'Temperature must be between 0 and 1' });
      }
    }
    if (req.body.language) baseOptions.language = req.body.language;

    const transcription = await processTranscription(downloadPath, baseOptions, filesToCleanup);

    // Clean up all files
    await cleanupFiles(filesToCleanup);

    // Send response
    res.json(transcription);
  } catch (error) {
    // Clean up all files in case of error
    await cleanupFiles(filesToCleanup);

    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 25MB.'
      });
    }
  }
  res.status(500).json({
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
