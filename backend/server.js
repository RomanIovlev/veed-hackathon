import express from 'express';
import cors from 'cors';
import { fal } from '@fal-ai/client';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './db.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create temp-audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'temp-audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Video directory for training videos  
const videoDir = path.join(__dirname, '..', 'public', 'videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static audio files
app.use('/audio', express.static(audioDir));

// Serve static video files
app.use('/videos', express.static(videoDir));

// Configure FAL API key - check if it's properly set
const FAL_KEY = process.env.FAL_KEY;
const isApiKeyConfigured = FAL_KEY && FAL_KEY !== 'YOUR_API_KEY_HERE' && FAL_KEY.trim().length > 10;

if (isApiKeyConfigured) {
  fal.config({
    credentials: FAL_KEY
  });
  console.log('✅ FAL API key configured');
} else {
  console.log('⚠️  WARNING: FAL_KEY not configured properly');
  console.log('   Set your API key with: set FAL_KEY=your_actual_api_key_here');
}

// Configure Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here' && GEMINI_API_KEY.trim().length > 10) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('✅ Gemini API key configured');
} else {
  console.log('⚠️  Gemini API key not configured. AI text generation will fail.');
  console.log('   Get your API key from: https://aistudio.google.com/app/apikey');
  console.log('   Set GEMINI_API_KEY environment variable');
}

// =====================================
// AI ENDPOINTS (must be before other /api routes)
// =====================================

// Generate training description
app.post('/api/generate-description', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API not configured',
        message: 'Please set GEMINI_API_KEY environment variable'
      });
    }

    const { title, categories, description } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: provide title or description'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate a detailed training description for healthcare staff training.
Title: ${title || 'Healthcare Training'}
Categories: ${categories || 'General healthcare training'}
${description ? `User's input: ${description}` : ''}

Write a professional, engaging description that explains:
- What staff will learn from this training
- Key learning objectives
- Why this training is important for healthcare professionals
- How it will improve patient care

Keep it between 2-4 sentences, 50-500 characters, professional tone, suitable for eldercare/healthcare context.`;

    const result = await model.generateContent(prompt);
    const suggestion = result.response.text();

    res.json({ 
      success: true, 
      suggestion: suggestion.trim()
    });

  } catch (error) {
    console.error('Error generating description:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate description',
      message: error.message
    });
  }
});

// Generate training structure
app.post('/api/generate-structure', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API not configured',
        message: 'Please set GEMINI_API_KEY environment variable'
      });
    }

    const { title, description, categories } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: title'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate a training structure for healthcare training: "${title}"
Description: ${description || 'Healthcare training'}
Categories: ${categories || 'General healthcare'}

Create 3-5 main training topics. For each topic, provide:
- A clear, concise title (4-8 words)
- Brief description of what will be covered

Respond in JSON format:
{
  "topics": [
    {
      "title": "Topic Title Here",
      "description": "Brief description of topic content"
    }
  ]
}

Focus on practical, actionable healthcare knowledge appropriate for eldercare staff.`;

    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();
    
    response = response.replace(/```json\n?/, '').replace(/```\n?$/, '');
    
    const structure = JSON.parse(response);

    res.json({ 
      success: true, 
      ...structure
    });

  } catch (error) {
    console.error('Error generating structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate structure',
      message: error.message
    });
  }
});

// Generate topic content
app.post('/api/generate-topic-content', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API not configured',
        message: 'Please set GEMINI_API_KEY environment variable'
      });
    }

    const { topicTitle, trainingTitle, categories } = req.body;
    
    if (!topicTitle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: topicTitle'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate comprehensive content for healthcare training topic: "${topicTitle}"
Training: ${trainingTitle || 'Healthcare Training'}
Categories: ${categories || 'General healthcare'}

Create content for eldercare/healthcare staff including:
1. Detailed educational text (200-300 words)
2. Key learning points
3. Practical examples
4. A video script concept (what should be demonstrated)

Respond in JSON format:
{
  "text": "Detailed educational content here...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "video_brief": "Description of what the video should show/demonstrate"
}

Focus on practical, actionable knowledge for healthcare professionals.`;

    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();
    
    response = response.replace(/```json\n?/, '').replace(/```\n?$/, '');
    
    const content = JSON.parse(response);

    res.json({ 
      success: true, 
      ...content
    });

  } catch (error) {
    console.error('Error generating topic content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate topic content',
      message: error.message
    });
  }
});

// Generate quiz questions
app.post('/api/generate-topic-quiz', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API not configured',
        message: 'Please set GEMINI_API_KEY environment variable'
      });
    }

    const { topicTitle, topicText, trainingTitle, categories } = req.body;
    
    if (!topicTitle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: topicTitle'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Generate 3-5 multiple choice quiz questions for healthcare training topic: "${topicTitle}"
Training: ${trainingTitle || 'Healthcare Training'}
Topic content: ${topicText || 'Healthcare training content'}
Categories: ${categories || 'General healthcare'}

Create questions that test practical knowledge and understanding. Each question should have:
- Clear question text
- 4 answer options
- Correct answer indicated
- Brief explanation of why the answer is correct

Respond in JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of correct answer"
    }
  ]
}

Focus on practical scenarios healthcare staff might encounter.`;

    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();
    
    response = response.replace(/```json\n?/, '').replace(/```\n?$/, '');
    
    const quiz = JSON.parse(response);

    res.json({ 
      success: true, 
      ...quiz
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Video generation service is running',
    apiKeyConfigured: isApiKeyConfigured,
    warning: !isApiKeyConfigured ? 'FAL_KEY environment variable not set' : null
  });
});

// No longer needed - VEED Fabric 1.0 Text API handles TTS internally!

// Helper function to clean script text for video generation
function cleanScriptForTTS(text) {
  // Handle null/undefined text
  if (!text || typeof text !== 'string') {
    console.warn('⚠️  cleanScriptForTTS received invalid text:', text);
    return '';
  }

  // Remove visual cues like [VISUAL: description] since VEED will handle visuals
  let cleanText = text.replace(/\[VISUAL:[^\]]*\]/gi, '');
  
  // Remove "NARRATOR:" prefixes for cleaner speech
  cleanText = cleanText.replace(/NARRATOR:\s*/gi, '');
  
  // Clean up whitespace and formatting
  cleanText = cleanText.replace(/\n\s*\n/g, ' ').trim();
  cleanText = cleanText.replace(/\s+/g, ' ');
  
  return cleanText;
}

// Main endpoint to generate video from script and image
app.post('/generate-video', async (req, res) => {
  try {
    const { script, imageUrl, resolution = '720p' } = req.body;
    
    // DEBUG: Log the raw request body to see what we're receiving
    console.log('🔍 DEBUG - Raw request body:', {
      script: script ? `${script.substring(0, 50)}... (${script.length} chars)` : 'UNDEFINED/NULL',
      imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}... (${imageUrl.length} chars)` : 'UNDEFINED/NULL',
      resolution: resolution || 'UNDEFINED/NULL',
      bodyKeys: Object.keys(req.body)
    });

    // Validate required parameters with detailed checks
    if (!script) {
      return res.status(400).json({
        error: 'Missing script',
        message: 'Script text is required for video generation'
      });
    }

    if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
      console.log('❌ Invalid imageUrl received:', imageUrl);
      return res.status(400).json({
        error: 'Missing or invalid image',
        message: 'Valid image URL is required for video generation. Please upload an image in Step 1 (Details).'
      });
    }

    // Check if imageUrl is a fallback (means no image was uploaded)
    if (imageUrl.includes('picsum.photos')) {
      return res.status(400).json({
        error: 'No image uploaded',
        message: 'Please upload a cover image in Step 1 (Details) before generating video'
      });
    }

    // Check if API key is configured
    if (!isApiKeyConfigured) {
      console.log('❌ Video generation rejected - no API key configured');
      return res.status(401).json({
        error: 'API key not configured',
        message: 'FAL_KEY environment variable is missing or invalid',
        solution: 'Please set your FAL_KEY and restart the backend server',
        instructions: {
          step1: 'Get your API key from https://fal.ai/',
          step2: 'Set with: set FAL_KEY=your_actual_api_key_here',
          step3: 'Restart this backend server with: npm run dev',
          step4: 'Look for "✅ FAL API key configured" message'
        }
      });
    }

    console.log('Received video generation request:', {
      scriptLength: script?.length || 0,
      imageUrl: imageUrl ? imageUrl.substring(0, 100) + '...' : 'NO IMAGE',
      resolution
    });

    // Clean the script text for better video generation
    const cleanedScript = cleanScriptForTTS(script);
    console.log('Cleaned script length:', cleanedScript.length);

    // Handle base64 images by uploading to FAL storage (VEED has URL length limit)
    let processedImageUrl = imageUrl;
    
    if (imageUrl.startsWith('data:')) {
      console.log('📤 Base64 image detected - uploading to FAL storage...');
      console.log('📏 Original base64 length:', imageUrl.length);
      
      try {
        // Extract base64 data and mime type
        const [header, base64Data] = imageUrl.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        
        console.log('📷 Image type:', mimeType);
        console.log('📏 Base64 data length:', base64Data.length);
        
        // Create a Buffer from base64
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to FAL storage
        console.log('📤 Uploading buffer to FAL storage...');
        console.log('📏 Buffer size:', buffer.length, 'bytes');
        console.log('📷 MIME type:', mimeType);
        
        const uploadedFile = await fal.storage.upload(buffer, {
          contentType: mimeType,
          fileName: `training-image-${Date.now()}.jpg`
        });
        
        console.log('📁 Upload result:', uploadedFile);
        
        processedImageUrl = uploadedFile.url;
        console.log('✅ Image successfully uploaded to FAL storage');
        console.log('🔗 New image URL:', processedImageUrl);
        
      } catch (uploadError) {
        console.error('❌ Failed to upload image to FAL storage:', uploadError);
        console.error('❌ Upload error details:', uploadError.message);
        console.error('❌ Upload error stack:', uploadError.stack);
        
        // Fallback: Use a working image URL so video generation doesn't completely fail
        console.log('🔄 Using fallback image URL for video generation');
        processedImageUrl = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop';
        
        // Note: In production, you might want to fail here instead of using fallback
        // throw new Error('Failed to upload image. Please try with a smaller image file.');
      }
    } else {
      console.log('🔗 Using direct image URL (no upload needed)');
    }

    // Prepare the input for VEED API
    const veedInput = {
      image_url: processedImageUrl, // Use either original URL or uploaded FAL URL
      text: cleanedScript,
      resolution: resolution
    };
    
    // DEBUG: Print exactly what we're sending to VEED
    console.log('🔍 DEBUG - Final VEED API Input:');
    console.log('🔍 DEBUG - Image URL:', processedImageUrl ? processedImageUrl.substring(0, 100) + '...' : 'UNDEFINED');
    console.log('🔍 DEBUG - Image URL length:', processedImageUrl?.length || 0);
    console.log('🔍 DEBUG - Text:', cleanedScript || 'EMPTY');
    console.log('🔍 DEBUG - Resolution:', resolution || 'NOT SET');
    
    if (imageUrl.startsWith('data:') && !processedImageUrl.startsWith('data:')) {
      console.log('✅ Successfully converted user upload to FAL storage URL');
    } else if (!imageUrl.startsWith('data:')) {
      console.log('✅ Using direct image URL');
    }
    
    // Call VEED Fabric 1.0 Text-to-Video API
    console.log('📹 Calling VEED Text-to-Video API...');
    
    const result = await fal.subscribe("veed/fabric-1.0/text", {
      input: veedInput,
      logs: true,
      onQueueUpdate: (update) => {
        console.log('VEED API status:', update.status);
        if (update.status === "IN_PROGRESS") {
          console.log('VEED API progress:', update.logs?.map(log => log.message).join('\n'));
        }
      },
    });

    console.log('VEED API response received');
    console.log('Success:', !!result.data);
    console.log('Video URL:', result.data?.video?.url);

    // Step 3: Return the generated video
    res.json({
      success: true,
      videoUrl: result.data.video.url,
      requestId: result.requestId,
      message: 'Video generated successfully'
    });

  } catch (error) {
    console.error('🚨 VIDEO GENERATION FAILED');
    console.error('🚨 Error type:', error.constructor.name);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error status:', error.status);
    console.error('🚨 Error body:', error.body);
    console.error('🚨 Error requestId:', error.requestId);
    console.error('🚨 Full error object:', JSON.stringify(error, null, 2));
    
    // Handle specific API errors
    if (error.message.includes('credentials')) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Please check your FAL API key configuration'
      });
    }
    
    // Handle unprocessable entity error (usually data format issues)
    if (error.message.includes('422') || error.message.includes('Unprocessable Entity')) {
      let errorMessage = 'The request data is invalid for VEED API';
      
      // Check for specific error types
      if (error.body?.detail?.[0]?.type === 'url_too_long') {
        errorMessage = 'Image file is too large - VEED API has URL length limits';
      }
      
      return res.status(422).json({
        error: 'Invalid request data',
        message: errorMessage,
        details: error.body?.detail || error.message,
        suggestions: [
          'Try using a smaller image file',
          'Ensure the image is in JPG or PNG format',
          'Verify the text content is not empty',
          'Check that resolution is 720p or 480p'
        ]
      });
    }

    res.status(500).json({
      error: 'Video generation failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Endpoint to generate video with enhanced TTS (for future implementation)
app.post('/generate-video-advanced', async (req, res) => {
  try {
    const { 
      script, 
      imageUrl, 
      resolution = '720p',
      voiceId = 'default',
      speechSpeed = 1.0
    } = req.body;

    if (!script || !imageUrl) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both script and imageUrl are required'
      });
    }

    // TODO: Implement advanced TTS with voice selection and speed control
    // This could integrate with services like:
    // - ElevenLabs API
    // - OpenAI TTS
    // - Azure Cognitive Services
    // - Google Text-to-Speech

    res.status(501).json({
      message: 'Advanced TTS features not yet implemented',
      suggestion: 'Use the basic /generate-video endpoint for now'
    });

  } catch (error) {
    console.error('Advanced video generation failed:', error);
    res.status(500).json({
      error: 'Advanced video generation failed',
      message: error.message
    });
  }
});

// Get video generation status (for long-running requests)
app.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const status = await fal.queue.status("veed/fabric-1.0", {
      requestId: requestId,
      logs: true,
    });

    res.json({
      status: status.status,
      logs: status.logs,
      completed: status.status === 'COMPLETED'
    });

  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

// List all available TTS voices (placeholder for future implementation)
app.get('/voices', (req, res) => {
  res.json({
    voices: [
      { id: 'default', name: 'Default Voice', language: 'en-US' },
      { id: 'professional', name: 'Professional Voice', language: 'en-US' },
      { id: 'friendly', name: 'Friendly Voice', language: 'en-US' }
    ],
    note: 'Voice selection not yet implemented - placeholder data'
  });
});

// Test endpoint to verify image URL and text processing
app.post('/test-urls', async (req, res) => {
  try {
    const { imageUrl, script } = req.body;
    
    console.log('Testing configuration...');
    console.log('Image URL:', imageUrl);
    
    // Clean the script text
    const cleanedText = cleanScriptForTTS(script || 'Test script');
    console.log('Cleaned script:', cleanedText ? cleanedText.substring(0, 100) + '...' : 'EMPTY');
    
    // Test image URL accessibility
    const imgResponse = await axios.head(imageUrl).catch(e => ({ status: 'error', message: e.message }));
    
    res.json({
      imageUrl: {
        url: imageUrl,
        accessible: imgResponse.status !== 'error',
        status: imgResponse.status || imgResponse.message
      },
      textProcessing: {
        originalLength: script?.length || 0,
        cleanedLength: cleanedText?.length || 0,
        cleaned: cleanedText ? cleanedText.substring(0, 200) + '...' : 'EMPTY'
      },
      readyForVeed: imgResponse.status !== 'error' && cleanedText.length > 0
    });
    
  } catch (error) {
    console.error('Configuration test failed:', error);
    res.status(500).json({
      error: 'Configuration test failed',
      message: error.message
    });
  }
});

// =====================================
// DATABASE API ENDPOINTS
// =====================================

// Get all training documents
app.get('/api/trainings', async (req, res) => {
  try {
    const trainings = await db.getTrainingDocuments();
    res.json({ success: true, data: trainings });
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trainings',
      message: error.message 
    });
  }
});

// Get trainings with their assignment statistics (MUST come before /:id route)
app.get('/api/trainings/with-stats', async (req, res) => {
  try {
    const trainings = await db.getTrainingsWithStats();
    res.json({ success: true, data: trainings });
  } catch (error) {
    console.error('Error fetching trainings with stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trainings with stats',
      message: error.message 
    });
  }
});

// Get single training document
app.get('/api/trainings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const training = await db.getTrainingDocument(id);
    
    if (!training) {
      return res.status(404).json({ 
        success: false, 
        error: 'Training not found' 
      });
    }
    
    res.json({ success: true, data: training });
  } catch (error) {
    console.error('Error fetching training:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch training',
      message: error.message 
    });
  }
});

// Create new training document
app.post('/api/trainings', async (req, res) => {
  try {
    const training = await db.createTrainingDocument(req.body);
    
    // Auto-assign training to users based on selected groups
    if (training && training.assigned_to_groups && training.assigned_to_groups.length > 0) {
      await db.assignTrainingToGroups(training.id, training.assigned_to_groups);
      console.log(`✅ Training "${training.title}" assigned to groups:`, training.assigned_to_groups);
    }
    
    res.json({ success: true, data: training });
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create training',
      message: error.message 
    });
  }
});

// Update training document
app.put('/api/trainings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const training = await db.updateTrainingDocument(id, req.body);
    
    if (!training) {
      return res.status(404).json({ 
        success: false, 
        error: 'Training not found' 
      });
    }
    
    // Update training assignments based on new group selection
    if (training.assigned_to_groups && training.assigned_to_groups.length > 0) {
      await db.updateTrainingGroupAssignments(id, training.assigned_to_groups);
      console.log(`🔄 Training "${training.title}" assignments updated for groups:`, training.assigned_to_groups);
    }
    
    res.json({ success: true, data: training });
  } catch (error) {
    console.error('Error updating training:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update training',
      message: error.message 
    });
  }
});

// Create video script
app.post('/api/trainings/:id/scripts', async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const scriptData = { ...req.body, documentId };
    const script = await db.createVideoScript(scriptData);
    res.json({ success: true, data: script });
  } catch (error) {
    console.error('Error creating video script:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create video script',
      message: error.message 
    });
  }
});

// Update video script
app.put('/api/scripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const script = await db.updateVideoScript(id, req.body);
    
    if (!script) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video script not found' 
      });
    }
    
    res.json({ success: true, data: script });
  } catch (error) {
    console.error('Error updating video script:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update video script',
      message: error.message 
    });
  }
});

// Delete video scripts by document ID (for editing workflow)
app.delete('/api/trainings/:id/scripts', async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const deletedCount = await db.deleteVideoScriptsByDocumentId(documentId);
    res.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Error deleting video scripts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete video scripts',
      message: error.message 
    });
  }
});

// Delete training document (and its scripts via CASCADE)
app.delete('/api/trainings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting training document:', id);
    const deleted = await db.deleteTrainingDocument(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Training not found' 
      });
    }
    
    console.log('✅ Training deleted successfully');
    res.json({ success: true, message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete training',
      message: error.message 
    });
  }
});

// Get all users (staff members)
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

// User authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, pin } = req.body;
    
    if (!name || !pin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and PIN are required' 
      });
    }
    
    const user = await db.authenticateUser(name, pin);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid name or PIN' 
      });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

// Get trainings assigned to user's groups
app.get('/api/users/:userId/trainings', async (req, res) => {
  try {
    const { userId } = req.params;
    const trainings = await db.getUserAssignedTrainings(userId);
    res.json({ success: true, data: trainings });
  } catch (error) {
    console.error('Error fetching user trainings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user trainings',
      message: error.message 
    });
  }
});

// Get assignment statistics for dashboard
app.get('/api/stats/assignments', async (req, res) => {
  try {
    const stats = await db.getAssignmentStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch assignment stats',
      message: error.message 
    });
  }
});


// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.path} is not a valid endpoint`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Video generation backend running on port ${PORT}`);
  console.log(`📹 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Generate video: POST http://localhost:${PORT}/generate-video`);
  console.log('');
  
  if (!isApiKeyConfigured) {
    console.log('⚠️  FAL_KEY not configured! Video generation will fail.');
    console.log('   1. Get your API key from: https://fal.ai/dashboard/keys');
    console.log('   2. Add it to backend/.env file: FAL_KEY=your_key_here');
    console.log('   3. Restart this server');
  } else {
    console.log('🎯 Ready to generate videos! Your FAL API key is configured.');
  }
});