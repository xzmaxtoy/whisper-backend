# Whisper Transcription API Examples

This guide provides complete examples of using the Whisper Transcription API in various programming languages and tools.

## cURL Examples

### 1. File Upload Transcription

```bash
# Basic file upload
curl -X POST http://localhost:3000/api/transcribe \
  -F "file=@/path/to/audio.mp3"

# Complete example with all parameters
curl -X POST http://localhost:3000/api/transcribe \
  -F "file=@/path/to/audio.mp3" \
  -F "prompt=This is a lecture about physics" \
  -F "temperature=0.2" \
  -F "language=en" \
  -F "response_format=json"
```

### 2. URL-based Transcription

```bash
# Basic URL transcription
curl -X POST http://localhost:3000/api/transcribe/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/audio.mp3"
  }'

# Complete example with all parameters
curl -X POST http://localhost:3000/api/transcribe/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/audio.mp3",
    "prompt": "This is a lecture about physics",
    "temperature": 0.2,
    "language": "en",
    "response_format": "json"
  }'
```

## Python Examples

### 1. File Upload Transcription

```python
import requests

def transcribe_file(file_path, prompt=None, temperature=None, language=None, response_format=None):
    url = 'http://localhost:3000/api/transcribe'
    
    # Prepare files and data
    files = {
        'file': open(file_path, 'rb')
    }
    
    data = {}
    if prompt:
        data['prompt'] = prompt
    if temperature is not None:
        data['temperature'] = temperature
    if language:
        data['language'] = language
    if response_format:
        data['response_format'] = response_format
    
    # Make request
    response = requests.post(url, files=files, data=data)
    return response.json()

# Example usage
result = transcribe_file(
    file_path='path/to/audio.mp3',
    prompt='This is a lecture about physics',
    temperature=0.2,
    language='en',
    response_format='json'
)
print(result['text'])
```

### 2. URL-based Transcription

```python
import requests

def transcribe_url(audio_url, prompt=None, temperature=None, language=None, response_format=None):
    url = 'http://localhost:3000/api/transcribe/url'
    
    # Prepare data
    data = {
        'url': audio_url
    }
    
    if prompt:
        data['prompt'] = prompt
    if temperature is not None:
        data['temperature'] = temperature
    if language:
        data['language'] = language
    if response_format:
        data['response_format'] = response_format
    
    # Make request
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Example usage
result = transcribe_url(
    audio_url='https://example.com/audio.mp3',
    prompt='This is a lecture about physics',
    temperature=0.2,
    language='en',
    response_format='json'
)
print(result['text'])
```

## JavaScript/Node.js Examples

### 1. File Upload Transcription

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function transcribeFile(filePath, options = {}) {
  const form = new FormData();
  
  // Add file
  form.append('file', fs.createReadStream(filePath));
  
  // Add optional parameters
  if (options.prompt) form.append('prompt', options.prompt);
  if (options.temperature !== undefined) form.append('temperature', options.temperature);
  if (options.language) form.append('language', options.language);
  if (options.response_format) form.append('response_format', options.response_format);
  
  try {
    const response = await axios.post('http://localhost:3000/api/transcribe', form, {
      headers: form.getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Transcription error:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function example() {
  try {
    const result = await transcribeFile('path/to/audio.mp3', {
      prompt: 'This is a lecture about physics',
      temperature: 0.2,
      language: 'en',
      response_format: 'json'
    });
    console.log(result.text);
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
```

### 2. URL-based Transcription

```javascript
const axios = require('axios');

async function transcribeUrl(audioUrl, options = {}) {
  const data = {
    url: audioUrl,
    ...options
  };
  
  try {
    const response = await axios.post('http://localhost:3000/api/transcribe/url', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Transcription error:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function example() {
  try {
    const result = await transcribeUrl('https://example.com/audio.mp3', {
      prompt: 'This is a lecture about physics',
      temperature: 0.2,
      language: 'en',
      response_format: 'json'
    });
    console.log(result.text);
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
```

## Browser/Frontend Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Whisper Transcription Demo</title>
</head>
<body>
    <h1>Whisper Transcription Demo</h1>
    
    <!-- File Upload Form -->
    <h2>Transcribe File</h2>
    <form id="fileForm">
        <input type="file" name="file" accept="audio/*" required><br><br>
        <input type="text" name="prompt" placeholder="Prompt (optional)"><br><br>
        <input type="number" name="temperature" step="0.1" min="0" max="1" placeholder="Temperature (0-1)"><br><br>
        <input type="text" name="language" placeholder="Language (e.g., en)"><br><br>
        <select name="response_format">
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="srt">SRT</option>
            <option value="vtt">VTT</option>
            <option value="verbose_json">Verbose JSON</option>
        </select><br><br>
        <button type="submit">Transcribe File</button>
    </form>
    
    <!-- URL Form -->
    <h2>Transcribe URL</h2>
    <form id="urlForm">
        <input type="url" name="url" required placeholder="Audio file URL"><br><br>
        <input type="text" name="prompt" placeholder="Prompt (optional)"><br><br>
        <input type="number" name="temperature" step="0.1" min="0" max="1" placeholder="Temperature (0-1)"><br><br>
        <input type="text" name="language" placeholder="Language (e.g., en)"><br><br>
        <select name="response_format">
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="srt">SRT</option>
            <option value="vtt">VTT</option>
            <option value="verbose_json">Verbose JSON</option>
        </select><br><br>
        <button type="submit">Transcribe URL</button>
    </form>
    
    <!-- Results -->
    <h2>Results</h2>
    <pre id="results"></pre>

    <script>
        // File upload form handler
        document.getElementById('fileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const response = await fetch('http://localhost:3000/api/transcribe', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                document.getElementById('results').textContent = 
                    JSON.stringify(result, null, 2);
            } catch (error) {
                document.getElementById('results').textContent = 
                    `Error: ${error.message}`;
            }
        });

        // URL form handler
        document.getElementById('urlForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('http://localhost:3000/api/transcribe/url', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                document.getElementById('results').textContent = 
                    JSON.stringify(result, null, 2);
            } catch (error) {
                document.getElementById('results').textContent = 
                    `Error: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

## Error Handling Examples

All examples should include proper error handling. Here's a typical error response:

```json
{
  "error": "Transcription failed",
  "details": "Error message details"
}
```

Common error scenarios to handle:

1. File too large (>25MB before splitting):
```json
{
  "error": "File too large. Maximum size is 25MB."
}
```

2. Invalid file type:
```json
{
  "error": "Invalid file type. Only audio files are allowed."
}
```

3. Missing required fields:
```json
{
  "error": "No audio file provided"
}
```

4. Invalid temperature value:
```json
{
  "error": "Temperature must be between 0 and 1"
}
```

## Testing Tips

1. Start with small audio files for quick testing
2. Test both successful and error cases
3. Verify file splitting works with large files
4. Test different response formats
5. Test with various audio formats (mp3, wav, m4a, etc.)
6. Test URL endpoint with both public and private URLs
7. Verify cleanup of temporary files
