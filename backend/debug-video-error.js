// Debug script for video generation issues
// Run with: node debug-video-error.js

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BACKEND_URL = 'http://localhost:3001';

async function debugVideoGeneration() {
  console.log('🔍 Debugging Video Generation Error');
  console.log('=====================================\n');

  // Test data
  const testData = {
    script: 'Welcome to our training program. This is a test script.',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop',
    resolution: '720p'
  };

  console.log('1. Testing backend health...');
  try {
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is healthy');
    console.log('✅ API Key configured:', healthResponse.data.apiKeyConfigured);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return;
  }

  console.log('\n2. Testing configuration...');
  try {
    const configTest = await axios.post(`${BACKEND_URL}/test-urls`, {
      imageUrl: testData.imageUrl,
      script: testData.script
    });
    
    console.log('Image URL accessible:', configTest.data.imageUrl.accessible ? '✅' : '❌');
    console.log('Text processing successful:', configTest.data.textProcessing.cleanedLength > 0 ? '✅' : '❌');
    console.log('Original script length:', configTest.data.textProcessing.originalLength);
    console.log('Cleaned script length:', configTest.data.textProcessing.cleanedLength);
    console.log('Ready for VEED:', configTest.data.readyForVeed ? '✅' : '❌');
    
    if (!configTest.data.readyForVeed) {
      console.log('\n❌ Configuration not ready for VEED API');
      console.log('Image status:', configTest.data.imageUrl.status);
      return;
    }
    
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message);
    return;
  }

  console.log('\n3. Testing video generation...');
  try {
    console.log('📤 Sending video generation request...');
    
    const startTime = Date.now();
    const response = await axios.post(`${BACKEND_URL}/generate-video`, testData, {
      timeout: 120000 // 2 minutes timeout
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Video generation succeeded! (${duration}ms)`);
    console.log('🎬 Video URL:', response.data.videoUrl);
    console.log('📝 Request ID:', response.data.requestId);
    
  } catch (error) {
    console.log('❌ Video generation failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error || error.message);
    console.log('Message:', error.response?.data?.message);
    console.log('Details:', error.response?.data?.details);
    
    if (error.response?.data?.suggestions) {
      console.log('\n💡 Suggestions:');
      error.response.data.suggestions.forEach(suggestion => {
        console.log(`   - ${suggestion}`);
      });
    }
  }

  console.log('\n🏁 Debug completed!');
}

// Run the debug
debugVideoGeneration().catch(console.error);