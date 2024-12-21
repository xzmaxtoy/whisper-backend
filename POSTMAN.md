# Testing with Postman

## Setting up the Collection

1. Open Postman
2. Create a new Collection called "Whisper Transcription API"
3. Add two requests as described below

## Request 1: File Upload Transcription

1. Create a new request:
   - Name: "Transcribe File"
   - Method: `POST`
   - URL: `http://localhost:3000/api/transcribe`

2. Configure request:
   - Go to "Body" tab
   - Select "form-data"
   - Add the following key-value pairs:
     ```
     file: [Select audio file] (Type: File)
     prompt: Your transcript prompt (Type: Text)
     temperature: 0.2 (Type: Text)
     language: en (Type: Text)
     response_format: json (Type: Text)
     ```
   - For the `file` field, click "Select Files" and choose an audio file

3. Optional parameters:
   - All parameters except `file` are optional
   - You can remove any optional parameter you don't need

## Request 2: URL-based Transcription

1. Create a new request:
   - Name: "Transcribe URL"
   - Method: `POST`
   - URL: `http://localhost:3000/api/transcribe/url`

2. Configure request:
   - Go to "Headers" tab
   - Add: `Content-Type: application/json`
   - Go to "Body" tab
   - Select "raw" and "JSON"
   - Add the following JSON:
     ```json
     {
       "url": "https://example.com/audio.mp3",
       "prompt": "Your transcript prompt",
       "temperature": 0.2,
       "language": "en",
       "response_format": "json"
     }
     ```

3. Optional parameters:
   - Only `url` is required
   - You can remove any optional parameters from the JSON

## Example Response

Both endpoints will return a JSON response in the format:
```json
{
  "text": "This is the transcribed text from the audio file."
}
```

## Error Handling

The API will return appropriate error responses:

1. 400 Bad Request:
```json
{
  "error": "No audio file provided"
}
```

2. 500 Internal Server Error:
```json
{
  "error": "Transcription failed",
  "details": "Error message details"
}
```

## Testing Tips

1. Start with small audio files (< 1MB) for quick testing
2. Test different audio formats (mp3, wav, m4a)
3. Try different language settings
4. Test with and without optional parameters
5. Test error cases:
   - Invalid file types
   - Missing required fields
   - Invalid URLs
   - Files > 25MB to test splitting functionality
