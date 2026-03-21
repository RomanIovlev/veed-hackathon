// Test VEED API with the specific iStock nurse image
// Run with: node test-with-istock-image.js

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
console.log('🔑 FAL API Key configured:', FAL_KEY ? 'YES' : 'NO');

fal.config({
  credentials: FAL_KEY
});

async function testWithIStockImage() {
  console.log('🧪 VEED API Test with iStock Nurse Image');
  console.log('========================================\n');

  const scriptText = "Welcome to the team, everyone! We are so glad to have your expertise on the floor—I'm looking forward to working alongside all of you";
  const imageUrl = "https://media.istockphoto.com/id/1285872850/photo/close-up-portrait-of-young-female-doctor-wear-smiling-and-looking-at-camera.jpg?s=612x612&w=0&k=20&c=5clbDZW4GHOgECbiTrnuASjgVLKgwWp_7u-5eXpw6Cg=";

  console.log('📝 Script text:', scriptText);
  console.log('🖼️  Image URL:', imageUrl);
  console.log('📏 Image URL length:', imageUrl.length, 'characters');

  try {
    // Step 1: Test image URL accessibility
    console.log('\n🔍 Testing image URL accessibility...');
    const imageTest = await axios.head(imageUrl);
    console.log('✅ Image URL is accessible');
    console.log('📋 Image info:', {
      status: imageTest.status,
      contentType: imageTest.headers['content-type'],
      contentLength: imageTest.headers['content-length']
    });

    // Step 2: Call VEED Text-to-Video API
    console.log('\n🎬 Calling VEED Text-to-Video API...');
    console.log('⏱️  This will take 1-3 minutes...\n');
    
    const veedInput = {
      image_url: imageUrl,
      text: scriptText,
      resolution: "720p"
    };

    console.log('📋 VEED API Input:');
    console.log('   🖼️  Image URL: ✅ iStock nurse image');
    console.log('   📝 Text: ✅ Your script (133 characters)');
    console.log('   🎥 Resolution: ✅ 720p');

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

    // Step 3: Download the video
    console.log('\n📥 Downloading your nurse talking video...');
    
    const videoResponse = await axios.get(result.data.video.url, {
      responseType: 'stream',
      timeout: 60000
    });

    const videoFileName = `NURSE-TALKING-ISTOCK-${Date.now()}.mp4`;
    const videoPath = path.join(__dirname, '..', videoFileName);
    
    const writer = fs.createWriteStream(videoPath);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('✅ Video downloaded successfully!');
    console.log('📁 Saved as:', videoFileName);
    console.log('📍 Location:', path.resolve(videoPath));

    console.log('\n🎯 ISTOCK IMAGE TEST RESULTS:');
    console.log('=============================');
    console.log('✅ iStock image URL: WORKS PERFECTLY');
    console.log('✅ VEED API call: SUCCESS');  
    console.log('✅ Video generation: SUCCESS');
    console.log('✅ Video download: SUCCESS');
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log('🎬 The iStock nurse is now talking your script!');
    console.log('\n🎊 PROOF: VEED API WORKS WITH PROPER IMAGE URLS!');

    return {
      success: true,
      videoPath,
      videoUrl: result.data.video.url,
      duration: totalTime
    };

  } catch (error) {
    console.error('\n❌ ISTOCK IMAGE TEST FAILED');
    console.error('❌ Error:', error.message);
    console.error('❌ Status:', error.status);
    
    if (error.body?.detail) {
      console.error('❌ Details:', error.body.detail);
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testWithIStockImage().then(result => {
  if (result.success) {
    console.log('\n🏆 🏆 🏆 COMPLETE SUCCESS! 🏆 🏆 🏆');
    console.log('✅ VEED API works perfectly with proper image URLs!');
    console.log('✅ Your script works perfectly!');
    console.log('✅ Video generation is 100% working!');
    console.log('\n💡 Next step: Fix the frontend image upload to provide proper URLs');
  } else {
    console.log('\n❌ Test failed - API issue detected');
  }
}).catch(console.error);