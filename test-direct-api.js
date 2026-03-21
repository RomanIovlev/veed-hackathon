// Direct VEED API test with your nurse.jpg image
// Run with: node test-direct-api.js

import { fal } from '@fal-ai/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'backend/.env' });

// Configure FAL API
const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('❌ FAL_KEY not found in backend/.env');
  process.exit(1);
}

fal.config({
  credentials: FAL_KEY
});

async function testDirectVeedAPI() {
  console.log('🧪 Direct VEED API Test');
  console.log('=======================\n');

  const scriptText = "Welcome to the team, everyone! We are so glad to have your expertise on the floor—I'm looking forward to working alongside all of you";
  const imagePath = './nurse.jpg';

  console.log('📝 Script text:', scriptText);
  console.log('🖼️  Image file:', imagePath);

  try {
    // Step 1: Check if image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log('✅ Image file found');

    // Step 2: Read the image file and upload to FAL storage
    console.log('\n📤 Uploading image to FAL storage...');
    
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('📏 Image file size:', imageBuffer.length, 'bytes');

    const uploadedFile = await fal.storage.upload(imageBuffer, {
      contentType: 'image/jpeg',
      fileName: `nurse-test-${Date.now()}.jpg`
    });

    console.log('✅ Image uploaded to FAL storage');
    console.log('🔗 Uploaded image URL:', uploadedFile.url);

    // Step 3: Call VEED Text-to-Video API
    console.log('\n🎬 Calling VEED Text-to-Video API...');
    
    const veedInput = {
      image_url: uploadedFile.url,
      text: scriptText,
      resolution: "720p"
    };

    console.log('📋 VEED Input:', {
      image_url: veedInput.image_url,
      text: veedInput.text.substring(0, 50) + '...',
      resolution: veedInput.resolution
    });

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
    console.log(`\n🎉 Video generation completed in ${totalTime} seconds!`);
    console.log('🎬 Generated video URL:', result.data.video.url);

    // Step 4: Download the generated video
    console.log('\n📥 Downloading generated video...');
    
    const videoResponse = await axios.get(result.data.video.url, {
      responseType: 'stream'
    });

    const videoFileName = `nurse-generated-${Date.now()}.mp4`;
    const videoPath = path.join('.', videoFileName);
    
    const writer = fs.createWriteStream(videoPath);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('✅ Video saved locally as:', videoFileName);
    console.log('📁 Full path:', path.resolve(videoPath));

    // Step 5: Summary
    console.log('\n🎯 Test Results Summary:');
    console.log('======================');
    console.log('✅ Image upload: SUCCESS');
    console.log('✅ VEED API call: SUCCESS');  
    console.log('✅ Video generation: SUCCESS');
    console.log('✅ Video download: SUCCESS');
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log('🎬 Your nurse video is ready!');

    return {
      success: true,
      videoPath,
      videoUrl: result.data.video.url,
      duration: totalTime
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('credentials')) {
      console.log('💡 Check your FAL_KEY in backend/.env');
    } else if (error.message.includes('not found')) {
      console.log('💡 Make sure nurse.jpg is in the current directory');
    } else {
      console.log('💡 Error details:', error);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
console.log('🚀 Starting direct VEED API test with your nurse.jpg...\n');
testDirectVeedAPI().then(result => {
  if (result.success) {
    console.log('\n🎉 SUCCESS! The VEED API works perfectly with your image and text!');
    console.log('📺 You can now watch your generated video:', result.videoPath);
  } else {
    console.log('\n❌ Test failed. Please check the error above.');
  }
}).catch(console.error);