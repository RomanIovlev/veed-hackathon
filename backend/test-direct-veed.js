// Direct VEED API test with your nurse.jpg image
// Run with: node test-direct-veed.js

import { fal } from '@fal-ai/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure FAL API
const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('❌ FAL_KEY not found in .env');
  process.exit(1);
}

fal.config({
  credentials: FAL_KEY
});

async function testDirectVeedAPI() {
  console.log('🧪 Direct VEED API Test with Your Nurse Image');
  console.log('=============================================\n');

  const scriptText = "Welcome to the team, everyone! We are so glad to have your expertise on the floor—I'm looking forward to working alongside all of you";
  const imagePath = path.join(__dirname, '..', 'nurse.jpg');

  console.log('📝 Script text:', scriptText);
  console.log('🖼️  Image file:', imagePath);

  try {
    // Step 1: Check if image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const imageStats = fs.statSync(imagePath);
    console.log('✅ Image file found');
    console.log('📏 Image file size:', imageStats.size, 'bytes');

    // Step 2: Read the image file and upload to FAL storage
    console.log('\n📤 Uploading your nurse image to FAL storage...');
    
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('📦 Buffer created, size:', imageBuffer.length, 'bytes');

    const uploadedFile = await fal.storage.upload(imageBuffer, {
      contentType: 'image/jpeg',
      fileName: `nurse-direct-test-${Date.now()}.jpg`
    });

    console.log('✅ Your image successfully uploaded to FAL storage');
    console.log('🔗 Uploaded image URL:', uploadedFile.url);

    // Step 3: Call VEED Text-to-Video API
    console.log('\n🎬 Calling VEED Text-to-Video API...');
    console.log('⏱️  This will take 1-3 minutes...\n');
    
    const veedInput = {
      image_url: uploadedFile.url,
      text: scriptText,
      resolution: "720p"
    };

    console.log('📋 VEED API Input:');
    console.log('   🖼️  Image URL:', uploadedFile.url);
    console.log('   📝 Text:', scriptText);
    console.log('   🎥 Resolution: 720p');

    const startTime = Date.now();
    
    const result = await fal.subscribe("veed/fabric-1.0/text", {
      input: veedInput,
      logs: true,
      onQueueUpdate: (update) => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`⏱️  [${elapsed}s] VEED Status: ${update.status}`);
        
        if (update.status === "IN_PROGRESS" && update.logs?.length > 0) {
          update.logs.forEach(log => console.log(`   📝 ${log.message}`));
        }
      },
    });

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n🎉 VIDEO GENERATION SUCCESSFUL!`);
    console.log(`⏱️  Completed in ${totalTime} seconds`);
    console.log('🎬 Generated video URL:', result.data.video.url);

    // Step 4: Download the generated video
    console.log('\n📥 Downloading your generated video...');
    
    const videoResponse = await axios.get(result.data.video.url, {
      responseType: 'stream',
      timeout: 60000 // 60 second timeout
    });

    const videoFileName = `nurse-talking-video-${Date.now()}.mp4`;
    const videoPath = path.join(__dirname, '..', videoFileName);
    
    const writer = fs.createWriteStream(videoPath);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('✅ Video saved successfully!');
    console.log('📁 Saved as:', videoFileName);
    console.log('📍 Full path:', path.resolve(videoPath));

    // Step 5: Summary
    console.log('\n🎯 DIRECT API TEST RESULTS:');
    console.log('===========================');
    console.log('✅ Image upload: SUCCESS');
    console.log('✅ VEED API call: SUCCESS');  
    console.log('✅ Video generation: SUCCESS');
    console.log('✅ Video download: SUCCESS');
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log('🎬 Your nurse is now talking in the video!');
    console.log('\n🎊 VEED API WORKS PERFECTLY WITH YOUR DATA!');

    return {
      success: true,
      videoPath,
      videoUrl: result.data.video.url,
      duration: totalTime
    };

  } catch (error) {
    console.error('\n❌ DIRECT API TEST FAILED');
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('credentials') || error.message.includes('unauthorized')) {
      console.log('💡 API Key issue - check your FAL_KEY in .env');
    } else if (error.message.includes('not found')) {
      console.log('💡 Make sure ../nurse.jpg exists');
    } else if (error.response?.status) {
      console.log('💡 HTTP Status:', error.response.status);
      console.log('💡 Response:', error.response.data);
    } else {
      console.log('💡 Full error:', error);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
console.log('🚀 Starting direct VEED API test with your nurse image...');
console.log('🔑 Using FAL API key:', FAL_KEY ? 'CONFIGURED' : 'MISSING');
console.log('');

testDirectVeedAPI().then(result => {
  if (result.success) {
    console.log('\n🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
    console.log('The VEED API works PERFECTLY with your nurse image and text!');
    console.log('📺 Your talking nurse video is ready to watch!');
    console.log('\n💡 This proves the API integration is working.');
    console.log('💡 The issue was in the frontend/backend data passing.');
  } else {
    console.log('\n❌ Direct API test failed.');
    console.log('💡 This suggests an issue with the API setup or image format.');
  }
}).catch(error => {
  console.error('\n💥 Test crashed:', error.message);
});