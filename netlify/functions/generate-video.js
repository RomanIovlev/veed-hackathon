import { fal } from '@fal-ai/client';
import axios from 'axios';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Configure FAL API
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  });
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { text, voice = 'alloy' } = JSON.parse(event.body || '{}');

    if (!text) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Text is required' }),
      };
    }

    // Check if FAL API is configured
    if (!process.env.FAL_KEY) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'FAL API key not configured',
          message: 'Please configure FAL_KEY environment variable'
        }),
      };
    }

    console.log('Generating video with text:', text.substring(0, 100) + '...');

    // Generate TTS audio using FAL
    const ttsResult = await fal.subscribe('fal-ai/metavoice-v1', {
      input: {
        text: text,
        voice: voice
      }
    });

    if (!ttsResult?.audio_url) {
      throw new Error('Failed to generate audio from text');
    }

    console.log('✅ TTS audio generated successfully');

    // Create video project using VEED API
    const veedApiKey = process.env.VEED_API_KEY;
    if (!veedApiKey) {
      console.log('⚠️ VEED API key not found, returning audio URL only');
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          audio_url: ttsResult.audio_url,
          message: 'Audio generated successfully. Video generation requires VEED API key.'
        }),
      };
    }

    // If VEED API key is available, create a video project
    const videoProject = await createVeedProject(ttsResult.audio_url, veedApiKey);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        audio_url: ttsResult.audio_url,
        video_project: videoProject,
        message: 'Video generation initiated successfully'
      }),
    };

  } catch (error) {
    console.error('Video generation error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate video',
        message: error.message
      }),
    };
  }
};

async function createVeedProject(audioUrl, veedApiKey) {
  try {
    const response = await axios.post(
      'https://api.veed.io/v1/projects',
      {
        name: `Training Video - ${Date.now()}`,
        width: 1920,
        height: 1080,
        duration: 60,
        assets: [
          {
            type: 'audio',
            url: audioUrl
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${veedApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('VEED API error:', error);
    throw new Error(`VEED API error: ${error.message}`);
  }
}