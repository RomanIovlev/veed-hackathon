// Quick test specifically for your nurse.jpg image
// Run with: node test-nurse-video.js

import axios from 'axios';
import fs from 'fs';

const BACKEND_URL = 'http://localhost:3003';

async function testNurseVideo() {
  console.log('🏥 Testing Video Generation with YOUR Nurse Image');
  console.log('================================================\n');

  // Read your nurse.jpg file
  const nursePath = './nurse.jpg';
  
  if (!fs.existsSync(nursePath)) {
    console.log('❌ nurse.jpg not found in current directory');
    return;
  }

  const imageBuffer = fs.readFileSync(nursePath);
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64Image}`;
  
  console.log('📷 Your nurse.jpg loaded');
  console.log('📏 File size:', imageBuffer.length, 'bytes');
  console.log('📏 Base64 length:', dataUri.length, 'characters');
  
  const scriptText = "Welcome to the team, everyone! We are so glad to have your expertise on the floor—I'm looking forward to working alongside all of you";

  try {
    console.log('\n🎬 Sending your nurse image for video generation...');
    console.log('⏱️  This will take 2-3 minutes...');
    
    const response = await axios.post(`${BACKEND_URL}/generate-video`, {
      script: scriptText,
      imageUrl: dataUri,  // Your actual nurse image
      resolution: '720p'
    }, {
      timeout: 180000 // 3 minute timeout
    });

    if (response.data.success) {
      console.log('🎉 SUCCESS! Your nurse video has been generated!');
      console.log('🎬 Video URL:', response.data.videoUrl);
      
      // Download the video
      console.log('\n📥 Downloading your nurse video...');
      const videoResponse = await axios.get(response.data.videoUrl, { responseType: 'stream' });
      
      const videoFile = `YOUR-NURSE-TALKING-${Date.now()}.mp4`;
      const writer = fs.createWriteStream(videoFile);
      videoResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log('✅ Your nurse video saved as:', videoFile);
      console.log('🎊 SUCCESS! Your healthcare worker is now talking in the video!');
      
    } else {
      console.log('❌ Video generation failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Request failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('💡 Check that both image and script are provided');
    } else if (error.response?.status === 401) {
      console.log('💡 API key issue - check backend configuration');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend not running - start with: node fixed-server.js');
    }
  }
}

console.log('🏥 Testing with your specific nurse.jpg and text...');
testNurseVideo();