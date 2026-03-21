# Training Video Generation Backend

A simple Express.js backend that integrates with the VEED API (via fal.ai) to generate training videos from scripts and images.

## Features

- Convert script text to speech (placeholder implementation)
- Generate videos using VEED Fabric 1.0 API
- RESTful API endpoints for video generation
- Support for different video resolutions (720p, 480p)
- Queue status checking for long-running requests
- CORS enabled for frontend integration

## Setup

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Set up your FAL API key:**

   ```bash
   # Option 1: Environment variable
   export FAL_KEY=424ab32d-da50-4435-b48f-14fa5ad231d4:efc4941c1753d96b96d78c6c1ad44fb3
   
   # Option 2: Create a .env file (recommended)
   echo "FAL_KEY=424ab32d-da50-4435-b48f-14fa5ad231d4:efc4941c1753d96b96d78c6c1ad44fb3" > .env
   ```

3. **Start the server:**

   ```bash
   npm run dev    # Development mode with auto-restart
   # or
   npm start      # Production mode
   ```

The server will start on <http://localhost:3001>

## API Endpoints

### Generate Video

**POST** `/generate-video`

Generate a video from script and image.

**Request Body:**

```json
{
  "script": "Your training script text here...",
  "imageUrl": "https://example.com/image.jpg",
  "resolution": "720p"
}
```

**Response:**

```json
{
  "success": true,
  "videoUrl": "https://generated-video-url.mp4",
  "requestId": "unique-request-id",
  "message": "Video generated successfully"
}
```

### Health Check

**GET** `/health`

Check if the service is running.

### Status Check

**GET** `/status/:requestId`

Check the status of a video generation request.

### List Voices

**GET** `/voices`

Get available TTS voices (placeholder for future implementation).

## Integration with Frontend

To integrate with your React frontend, you can make requests like:

```javascript
const generateVideo = async (script, imageUrl) => {
  try {
    const response = await fetch('http://localhost:3001/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script,
        imageUrl,
        resolution: '720p'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Video generated:', result.videoUrl);
      return result.videoUrl;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Video generation failed:', error);
    throw error;
  }
};
```

## Current Limitations

1. **Text-to-Speech**: Currently uses a placeholder audio file. You need to implement proper TTS integration with services like:
   - OpenAI TTS API
   - ElevenLabs API
   - Azure Cognitive Services
   - Google Text-to-Speech

2. **Voice Options**: Voice selection is not yet implemented

3. **Audio Processing**: No audio processing or enhancement features

## Recommended TTS Integration

To implement proper text-to-speech, you can:

1. **OpenAI TTS** (Recommended):

   ```bash
   npm install openai
   ```

   ```javascript
   import OpenAI from 'openai';
   
   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   
   async function convertTextToSpeech(text) {
     const mp3 = await openai.audio.speech.create({
       model: "tts-1",
       voice: "alloy",
       input: text,
     });
     // Handle the audio response...
   }
   ```

2. **ElevenLabs**:

   ```bash
   npm install elevenlabs
   ```

3. **Browser-based TTS**:
   - Implement TTS on the frontend using Web Speech API
   - Send the generated audio file to the backend

## Environment Variables

- `FAL_KEY`: Your fal.ai API key (required)
- `PORT`: Server port (default: 3001)
- `OPENAI_API_KEY`: OpenAI API key (for TTS integration)

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (missing parameters)
- `401`: Authentication failed (invalid API key)
- `500`: Server error
- `501`: Feature not implemented

## Production Deployment

For production deployment:

1. Set up proper environment variables
2. Use a process manager like PM2
3. Set up proper logging
4. Implement rate limiting
5. Add request validation and sanitization
6. Set up monitoring and health checks

## Contributing

Feel free to extend this backend with additional features like:

- Multiple TTS providers
- Audio processing and enhancement
- Video customization options
- Batch processing
- Webhook notifications
- Database integration for request tracking
