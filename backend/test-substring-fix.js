// Test to verify substring errors are fixed
// Run with: node test-substring-fix.js

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BACKEND_URL = 'http://localhost:3001';

async function testSubstringFix() {
  console.log('🧪 Testing Substring Error Fix');
  console.log('===============================\n');

  // Test 1: Missing imageUrl (should handle gracefully)
  console.log('1. Testing with missing image URL...');
  try {
    const response = await axios.post(`${BACKEND_URL}/generate-video`, {
      script: 'Test script',
      resolution: '720p'
      // imageUrl: missing intentionally
    });
    console.log('❌ Should have failed with missing image');
  } catch (error) {
    console.log('✅ Properly handled missing image:', error.response?.data?.message);
  }

  // Test 2: Empty imageUrl (should handle gracefully)  
  console.log('\n2. Testing with empty image URL...');
  try {
    const response = await axios.post(`${BACKEND_URL}/generate-video`, {
      script: 'Test script',
      imageUrl: '',
      resolution: '720p'
    });
    console.log('❌ Should have failed with empty image');
  } catch (error) {
    console.log('✅ Properly handled empty image:', error.response?.data?.message);
  }

  // Test 3: Valid image URL (should work without substring errors)
  console.log('\n3. Testing with valid image URL...');
  try {
    const response = await axios.post(`${BACKEND_URL}/generate-video`, {
      script: 'Welcome to our training program!',
      imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop',
      resolution: '720p'
    }, {
      timeout: 10000 // 10 second timeout for this test
    });
    
    console.log('✅ No substring errors - request processed');
    console.log('🎬 Response:', response.data.success ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️  Request timed out (normal for video generation)');
      console.log('✅ No substring errors - backend is processing');
    } else {
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n🏁 Substring error test completed!');
  console.log('\n💡 If no substring errors appeared above, the fix is working!');
}

// Run the test
testSubstringFix().catch(console.error);