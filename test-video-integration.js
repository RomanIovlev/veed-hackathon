// Test script to verify video generation integration
// Run this after starting both frontend and backend
// Usage: node test-video-integration.js

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

async function testIntegration() {
  console.log('🧪 Testing Video Generation Integration...\n');

  // Test 1: Check if backend is running
  console.log('1. Testing backend connection...');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const result = await response.json();
    
    if (response.ok && result.status === 'ok') {
      console.log('   ✅ Backend is running');
    } else {
      console.log('   ❌ Backend health check failed');
      return;
    }
  } catch (error) {
    console.log('   ❌ Backend is not accessible');
    console.log('   💡 Make sure to start the backend: cd backend && npm run dev');
    return;
  }

  // Test 2: Check if frontend is running
  console.log('\n2. Testing frontend connection...');
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      console.log('   ✅ Frontend is running');
    } else {
      console.log('   ❌ Frontend is not accessible');
    }
  } catch (error) {
    console.log('   ❌ Frontend is not accessible');
    console.log('   💡 Make sure to start the frontend: npm run dev');
  }

  // Test 3: Test video generation endpoint with sample data
  console.log('\n3. Testing video generation API...');
  
  const testData = {
    script: `[VISUAL: Welcome screen with friendly healthcare worker]
    
    NARRATOR: Welcome to our comprehensive training program. Today we'll be covering essential healthcare protocols that every team member should know.
    
    [VISUAL: Training materials and documentation]
    
    This interactive session will provide you with the knowledge and skills needed to deliver exceptional patient care while maintaining the highest safety standards.`,
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop&crop=face",
    resolution: "720p"
  };

  try {
    console.log('   📤 Sending test request...');
    const response = await fetch(`${BACKEND_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('   ✅ Video generation API is working');
      console.log('   🎬 Response:', {
        success: result.success,
        hasVideoUrl: !!result.videoUrl,
        requestId: result.requestId
      });
    } else {
      console.log('   ⚠️  API returned error (expected without FAL_KEY):', result.message);
      
      if (result.message?.includes('credentials') || result.message?.includes('API key')) {
        console.log('   💡 This is expected - set your FAL_KEY environment variable');
        console.log('   💡 Get your API key from: https://fal.ai/');
      }
    }
  } catch (error) {
    console.log('   ❌ API test failed:', error.message);
  }

  // Test 4: Frontend integration
  console.log('\n4. Frontend integration checklist:');
  console.log('   📋 Steps to test in the browser:');
  console.log('   1. Go to http://localhost:5173');
  console.log('   2. Navigate to Create Training');
  console.log('   3. Fill in training details (Step 1)');
  console.log('   4. Go to Content step (Step 2)');
  console.log('   5. Add a topic with a script');
  console.log('   6. Look for "Generate Video" button');
  console.log('   7. Click the button to test video generation');
  console.log('   8. Check Preview step for video display');

  console.log('\n🏁 Integration test completed!');
  console.log('\n📚 Quick setup reminder:');
  console.log('   1. Backend: cd backend && npm run dev');
  console.log('   2. Frontend: npm run dev');
  console.log('   3. Set FAL_KEY: export FAL_KEY=your_api_key_here');
  console.log('   4. Open browser: http://localhost:5173');
}

// Check if we can use fetch (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ or you can install node-fetch');
  console.log('💡 Alternative: Test manually in the browser');
  console.log('\n📋 Manual test steps:');
  console.log('1. Start backend: cd backend && npm run dev');
  console.log('2. Start frontend: npm run dev');
  console.log('3. Open: http://localhost:3001/health (should show {"status":"ok"})');
  console.log('4. Open: http://localhost:5173 (should show your app)');
  console.log('5. Test video generation in the Create Training flow');
} else {
  testIntegration().catch(console.error);
}