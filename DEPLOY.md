# Deploying Whisper Transcription to Azure Functions

## Prerequisites

1. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. Install Azure CLI:
   - Windows: Download from Microsoft's website
   - macOS: `brew install azure-cli`
   - Linux: Follow Azure's installation guide

3. Login to Azure:
   ```bash
   az login
   ```

## Local Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up local settings:
   - Copy your OpenAI API key to local.settings.json
   - Set AzureWebJobsStorage if testing storage features

3. Run locally:
   ```bash
   npm start
   ```

4. Test the function:
   ```bash
   curl -X POST http://localhost:7071/api/transcribe \
     -F "file=@path/to/audio.wav" \
     -F "language=en" \
     -F "temperature=0.2"
   ```

## Deployment Steps

1. Create Azure Function App:
   ```bash
   az group create --name whisper-rg --location eastus
   az storage account create --name whisperstorage --location eastus --resource-group whisper-rg --sku Standard_LRS
   az functionapp create --resource-group whisper-rg --consumption-plan-location eastus --runtime node --runtime-version 18 --functions-version 4 --name whisper-transcribe --storage-account whisperstorage
   ```

2. Configure application settings:
   ```bash
   az functionapp config appsettings set --name whisper-transcribe --resource-group whisper-rg --settings OPENAI_API_KEY="your-api-key"
   ```

3. Deploy the function:
   ```bash
   func azure functionapp publish whisper-transcribe
   ```

## Testing Deployed Function

1. Get the function URL:
   ```bash
   az functionapp function show --name whisper-transcribe --resource-group whisper-rg --function-name transcribe --query "invokeUrlTemplate"
   ```

2. Test with curl:
   ```bash
   curl -X POST https://whisper-transcribe.azurewebsites.net/api/transcribe?code=YOUR_FUNCTION_KEY \
     -F "file=@path/to/audio.wav" \
     -F "language=en" \
     -F "temperature=0.2"
   ```

## Important Notes

1. **FFmpeg Support**: The function uses ffmpeg for audio processing. Azure Functions on Linux consumption plan includes ffmpeg by default. If using Windows, you'll need to:
   - Use Linux consumption plan, or
   - Include ffmpeg binaries in your deployment

2. **File Size Limits**: Azure Functions has default limits:
   - Request size: 100MB
   - Execution time: 5-10 minutes (depending on plan)
   - Memory: 1.5GB

3. **Environment Variables**:
   - OPENAI_API_KEY: Your OpenAI API key
   - Other settings in local.settings.json

4. **Monitoring**:
   - View logs: `az functionapp logs tail --name whisper-transcribe --resource-group whisper-rg`
   - Monitor metrics in Azure Portal

## Troubleshooting

1. **Function not found**:
   - Ensure function.json is in the correct location
   - Check deployment logs

2. **FFmpeg errors**:
   - Verify FFmpeg installation
   - Check temp directory permissions

3. **File processing errors**:
   - Check file size limits
   - Verify file format support
   - Check storage permissions

4. **OpenAI API errors**:
   - Verify API key
   - Check request format
   - Monitor rate limits

## Cost Considerations

1. **Azure Functions**:
   - First 1 million executions free
   - Pay for execution time and memory

2. **Storage**:
   - Temporary files cleaned up after processing
   - Minimal storage costs

3. **OpenAI API**:
   - Whisper API charges per minute of audio
   - Check OpenAI pricing page for current rates
