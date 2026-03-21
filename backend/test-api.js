// Simple test script to verify the video generation backend is working
// Run this with: node test-api.js

const API_BASE_URL = 'http://localhost:3001';

async function testBackend() {
  console.log('🧪 Testing Video Generation Backend...\n');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    
    if (response.ok && result.status === 'ok') {
      console.log('   ✅ Health check passed');
    } else {
      console.log('   ❌ Health check failed:', result);
    }
  } catch (error) {
    console.log('   ❌ Health check failed - is the server running?', error.message);
    console.log('   💡 Start the server with: npm run dev');
    return;
  }

  // Test 2: Get voices
  console.log('\n2. Testing voices endpoint...');
  try {
    const response = await fetch(`${API_BASE_URL}/voices`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Voices endpoint working');
      console.log('   📋 Available voices:', result.voices?.length || 0);
    } else {
      console.log('   ❌ Voices endpoint failed:', result);
    }
  } catch (error) {
    console.log('   ❌ Voices endpoint failed:', error.message);
  }

  // Test 3: Video generation (with sample data)
  console.log('\n3. Testing video generation endpoint...');
  
  const testData = {
    script: "Welcome to our training program. This is a test script for video generation.",
    imageUrl: "https://picsum.photos/800/600", // Random sample image
    resolution: "720p"
  };

  try {
    console.log('   📤 Sending video generation request...');
    console.log('   📝 Script:', testData.script.substring(0, 50) + '...');
    console.log('   🖼️  Image URL:', testData.imageUrl);
    
    const response = await fetch(`${API_BASE_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('   ✅ Video generation request accepted');
      console.log('   🎬 Video URL:', result.videoUrl);
      console.log('   🆔 Request ID:', result.requestId);
    } else {
      console.log('   ⚠️  Video generation failed (expected if no API key):', result.message);
      
      if (result.message?.includes('credentials') || result.message?.includes('API key')) {
        console.log('   💡 This is normal - you need to set your FAL_KEY environment variable');
        console.log('   💡 Set your API key: export FAL_KEY=your_actual_api_key_here');
      }
    }
  } catch (error) {
    console.log('   ❌ Video generation failed:', error.message);
  }

  console.log('\n🏁 Backend test completed!');
  console.log('\n📚 Next steps:');
  console.log('   1. Get your FAL API key from https://fal.ai/');
  console.log('   2. Set environment variable: export FAL_KEY=your_api_key');
  console.log('   3. Integrate with your React frontend using client-example.js');
  console.log('   4. For better TTS, implement OpenAI integration (see tts-openai-example.js)');
}

// Run the test
testBackend().catch(console.error);