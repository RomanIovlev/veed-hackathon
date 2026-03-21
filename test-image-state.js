// Simple test to check image state issues
// This simulates what the frontend should send

const testImageData = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const testRequest = {
  script: 'Welcome to our training program!',
  imageUrl: testImageData,
  resolution: '720p'
};

console.log('🧪 Testing image state simulation:');
console.log('Script length:', testRequest.script?.length || 0);
console.log('Image exists:', !!testRequest.imageUrl);
console.log('Image type:', testRequest.imageUrl?.startsWith('data:') ? 'Base64' : 'URL');
console.log('Image length:', testRequest.imageUrl?.length || 0);

// Simulate the frontend request
async function testImageRequest() {
  try {
    const response = await fetch('http://localhost:3001/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Request successful');
    } else {
      console.log('❌ Request failed:', result.message);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

console.log('\n📤 Sending test request to backend...');
testImageRequest();