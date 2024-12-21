const Busboy = require('busboy');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');

const unlinkAsync = promisify(fs.unlink);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validate response format
const validResponseFormats = ['json', 'text', 'srt', 'vtt', 'verbose_json'];

// Function to process transcription
const processTranscription = async (filePath, options) => {
  const stats = fs.statSync(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);
  
  if (fileSizeInMB > 24) {
    throw new Error('File too large. Please use a file smaller than 24MB.');
  }

  // Validate response format
  if (options.response_format && !validResponseFormats.includes(options.response_format)) {
    throw new Error(`Invalid response format. Must be one of: ${validResponseFormats.join(', ')}`);
  }

  return await openai.audio.transcriptions.create({
    ...options,
    file: fs.createReadStream(filePath)
  });
};

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers
    };
    return;
  }

  return new Promise((resolve, reject) => {
    const tempFiles = [];

    if (!req.headers['content-type']) {
      context.res = {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: { 
          error: 'Bad Request',
          message: 'Content-Type header is required'
        }
      };
      return resolve();
    }

    const busboy = Busboy({ headers: req.headers });
    let filePromise = null;
    const fields = {};

    // Handle file upload
    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      context.log(`Processing file: ${filename}, type: ${mimeType}`);
      
      // Accept any audio file - Whisper API will handle validation
      const tempPath = path.join(os.tmpdir(), `whisper_${Date.now()}_${filename}`);
      tempFiles.push(tempPath);
      
      filePromise = new Promise((resolveFile, rejectFile) => {
        const writeStream = fs.createWriteStream(tempPath);
        file.pipe(writeStream);
        
        writeStream.on('finish', () => resolveFile(tempPath));
        writeStream.on('error', rejectFile);
      });
    });

    // Handle form fields
    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
      context.log(`Field ${fieldname}:`, value);
    });

    // Handle parsing complete
    busboy.on('finish', async () => {
      try {
        if (!filePromise) {
          context.res = {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: {
              error: 'Bad Request',
              message: 'No audio file provided'
            }
          };
          return resolve();
        }

        const audioPath = await filePromise;
        context.log('File saved to:', audioPath);

        // Prepare options for Whisper API
        const options = {
          model: 'whisper-1',
          response_format: fields.response_format || 'json'
        };

        if (fields.language) {
          options.language = fields.language;
          context.log('Language specified:', fields.language);
        }

        if (fields.prompt) {
          options.prompt = fields.prompt;
          context.log('Prompt specified:', fields.prompt);
        }

        // Process transcription
        const transcription = await processTranscription(audioPath, options);
        context.log('Transcription successful');

        // Clean up temp files
        for (const file of tempFiles) {
          try {
            await unlinkAsync(file);
            context.log('Cleaned up file:', file);
          } catch (error) {
            context.log.error(`Error deleting temp file ${file}:`, error);
          }
        }

        // Set appropriate Content-Type based on response format
        let contentType = 'application/json';
        if (options.response_format === 'text') {
          contentType = 'text/plain';
        } else if (options.response_format === 'srt') {
          contentType = 'application/x-subrip';
        } else if (options.response_format === 'vtt') {
          contentType = 'text/vtt';
        }

        context.res = {
          status: 200,
          headers: { 
            ...headers, 
            'Content-Type': contentType
          },
          body: transcription
        };
        resolve();
      } catch (error) {
        // Clean up temp files in case of error
        for (const file of tempFiles) {
          try {
            await unlinkAsync(file);
            context.log('Cleaned up file:', file);
          } catch (err) {
            context.log.error(`Error deleting temp file ${file}:`, err);
          }
        }

        context.log.error('Error processing request:', error);
        context.res = {
          status: error.message.includes('too large') ? 413 : 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: {
            error: error.message.includes('too large') ? 'Payload Too Large' : 'Internal Server Error',
            message: error.message,
            details: error.stack
          }
        };
        resolve();
      }
    });

    // Handle parsing error
    busboy.on('error', error => {
      context.log.error('Error parsing form data:', error);
      context.res = {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: { 
          error: 'Bad Request',
          message: 'Error parsing form data',
          details: error.message
        }
      };
      resolve();
    });

    // Start processing the request
    const bodyBuffer = Buffer.from(req.body);
    busboy.end(bodyBuffer);
  });
};
