# Whisper Transcription API

Azure Function-based REST API for audio transcription using OpenAI's Whisper model.

## Features

- Audio transcription with OpenAI Whisper
- Multiple response formats
- CORS enabled for browser access
- File size validation (max 24MB)
- Support for various audio formats
- Error handling with detailed responses

## API Endpoint

```
POST https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY
```

## Request Format

Content-Type: `multipart/form-data`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | Audio file (WAV, MP3, etc.) |
| language | String | No | Language code (e.g., 'en') |
| response_format | String | No | Output format (see below) |
| prompt | String | No | Guide for transcription |

### Response Formats

1. `json` (default)
```json
{
  "text": "Your transcribed text here"
}
```

2. `text`
```
Your transcribed text here
```

3. `srt`
```
1
00:00:00,000 --> 00:00:03,000
Your transcribed text here
```

4. `vtt`
```
WEBVTT

00:00:00.000 --> 00:00:03.000
Your transcribed text here
```

5. `verbose_json`
```json
{
  "task": "transcribe",
  "language": "english",
  "duration": 3.0,
  "text": "Your transcribed text here",
  "segments": [
    {
      "id": 0,
      "seek": 0,
      "start": 0.0,
      "end": 3.0,
      "text": "Your transcribed text here",
      "tokens": [...],
      "temperature": 0.0,
      "avg_logprob": -0.5,
      "compression_ratio": 1.6,
      "no_speech_prob": 0.1
    }
  ]
}
```

## Usage Examples

### cURL
```bash
# Basic usage
curl -X POST "https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.wav"

# With all options
curl -X POST "https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.wav" \
  -F "language=en" \
  -F "response_format=verbose_json" \
  -F "prompt=Transcribe this audio"
```

### Python
```python
import requests

def transcribe_audio(file_path, language='en', response_format='json'):
    url = "https://whisper-transcribe-service.azurewebsites.net/api/transcribe"
    params = {
        "code": "YOUR_FUNCTION_KEY"
    }
    files = {
        'file': open(file_path, 'rb')
    }
    data = {
        'language': language,
        'response_format': response_format
    }
    
    response = requests.post(url, params=params, files=files, data=data)
    return response.json()
```

### JavaScript/Node.js
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function transcribeAudio(filePath, language = 'en', responseFormat = 'json') {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('language', language);
    form.append('response_format', responseFormat);

    try {
        const response = await axios.post(
            'https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY',
            form,
            {
                headers: {
                    ...form.getHeaders()
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        throw error;
    }
}
```

### Browser/React
```javascript
async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    try {
        const response = await fetch(
            'https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY',
            {
                method: 'POST',
                body: formData
            }
        );
        const data = await response.json();
        console.log('Transcription:', data.text);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- 400: Bad Request (invalid input)
- 413: File too large (>24MB)
- 415: Unsupported media type
- 500: Internal server error

Error Response Format:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": "Additional error details (if available)"
}
```

## Development

### Prerequisites
- Node.js ≥ 18
- Azure Functions Core Tools
- OpenAI API Key

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create local.settings.json:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureWebJobsStorage": "",
       "OPENAI_API_KEY": "your-api-key"
     }
   }
   ```
4. Run locally:
   ```bash
   npm start
   ```

### Deployment
Deploy to Azure Functions:
```bash
npm install --omit=dev
func azure functionapp publish whisper-transcribe-service --javascript
```

## Limitations
- Maximum file size: 24MB
- Supported audio formats: WAV, MP3, M4A, MP4, OGG, WEBM
- Rate limits based on OpenAI API quotas

## Security
- Function-level authentication using API key
- CORS enabled for browser access
- Request validation and sanitization
