# Testing Your Azure Function

## Function URL Format
```
https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY
```

## Testing Methods

### 1. Using cURL
```bash
curl -X POST "https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/audio.wav" \
  -F "language=en" \
  -F "temperature=0.2"
```

### 2. Using Postman
1. Create a new POST request
2. URL: `https://whisper-transcribe-service.azurewebsites.net/api/transcribe`
3. Add Query Parameter:
   - Key: `code`
   - Value: `YOUR_FUNCTION_KEY`
4. In Body tab:
   - Select "form-data"
   - Add fields:
     - file: Select your audio file (Type: File)
     - language: en (optional)
     - temperature: 0.2 (optional)
     - prompt: Your prompt (optional)

### 3. Using JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('file', yourAudioFile);
formData.append('language', 'en');
formData.append('temperature', '0.2');

fetch('https://whisper-transcribe-service.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Getting Your Function Key

1. Azure Portal Method:
   - Go to Azure Portal
   - Navigate to your Function App
   - Select your function
   - Click "Get Function URL"
   - Copy the code parameter from the URL

2. CLI Method:
```bash
az functionapp function keys list \
  --name whisper-transcribe-service \
  --resource-group YOUR_RESOURCE_GROUP \
  --function-name transcribe
```

## Expected Response

Success Response:
```json
{
  "text": "Your transcribed text here"
}
```

Error Response:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Common Issues

1. **401 Unauthorized**
   - Make sure you're including the function key as a query parameter
   - Verify the function key is correct

2. **400 Bad Request**
   - Check if the file is properly attached
   - Verify the file format is supported
   - Ensure form-data fields are correctly named

3. **413 Request Entity Too Large**
   - File size exceeds limit (default 100MB)
   - Try splitting large files

4. **500 Internal Server Error**
   - Check function logs in Azure Portal
   - Verify OPENAI_API_KEY is properly set
   - Check if file format is supported by Whisper API
