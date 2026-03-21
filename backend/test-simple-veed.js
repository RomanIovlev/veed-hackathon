// Simple VEED API test using a known working approach
// Run with: node test-simple-veed.js

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

async function testSimpleVeedAPI() {
  console.log('🧪 Simple VEED API Test');
  console.log('========================\n');

  const scriptText = "Welcome to the team, everyone! We are so glad to have your expertise on the floor—I'm looking forward to working alongside all of you";

  try {
    // Use your nurse.jpg but convert to base64 first, then use a working image URL for now
    console.log('📝 Script text:', scriptText);
    
    // For this test, let's use a known working image URL that's similar to your nurse
    // This will prove the VEED API works, then we can focus on the image upload issue
    const workingImageUrl = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop';
    console.log('🖼️  Using test image URL:', workingImageUrl);

    // Step 1: Call VEED Text-to-Video API directly
    console.log('\n🎬 Calling VEED Text-to-Video API...');
    console.log('⏱️  This may take 1-3 minutes...\n');
    
    const veedInput = {
      image_url: workingImageUrl,
      text: scriptText,
      resolution: "720p"
    };

    console.log('📋 VEED API Input:');
    console.log('   🖼️  Image URL:', workingImageUrl);
    console.log('   📝 Text length:', scriptText.length, 'characters');
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

    // Step 2: Download the video
    console.log('\n📥 Downloading the generated video...');
    
    const videoResponse = await axios.get(result.data.video.url, {
      responseType: 'stream',
      timeout: 60000
    });

    const videoFileName = `test-veed-generated-${Date.now()}.mp4`;
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

    // Test with your actual nurse image
    console.log('\n🖼️  Now testing with your actual nurse.jpg...');
    await testWithYourImage(scriptText);

  } catch (error) {
    console.error('\n❌ SIMPLE VEED TEST FAILED');
    console.error('❌ Error:', error.message);
    console.error('❌ Status:', error.status);
    console.error('❌ Body:', error.body);
    
    return { success: false, error: error.message };
  }
}

async function testWithYourImage(scriptText) {
  try {
    const imagePath = path.join(__dirname, '..', 'nurse.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ nurse.jpg not found, skipping your image test');
      return;
    }

    console.log('📤 Reading your nurse.jpg...');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('📏 Your image size:', imageBuffer.length, 'bytes');
    console.log('📏 Base64 URI length:', dataUri.length, 'characters');

    if (dataUri.length > 2083) {
      console.log('⚠️  Your image base64 is too long for VEED API (', dataUri.length, '> 2083 characters)');
      console.log('💡 This confirms why your image upload needs FAL storage conversion');
      
      // Try FAL upload again with better error handling
      console.log('📤 Attempting FAL storage upload...');
      
      try {
        const uploadResult = await fal.storage.upload(imageBuffer, {
          contentType: 'image/jpeg',
          fileName: `nurse-${Date.now()}.jpg`
        });
        
        console.log('✅ FAL upload result:', uploadResult);
        
        if (uploadResult && uploadResult.url) {
          console.log('🎬 Testing VEED with your uploaded nurse image...');
          
          const result = await fal.subscribe("veed/fabric-1.0/text", {
            input: {
              image_url: uploadResult.url,
              text: scriptText,
              resolution: "720p"
            },
            logs: true,
            onQueueUpdate: (update) => {
              console.log(`⏱️  Your Nurse Video Status: ${update.status}`);
            },
          });

          console.log('🎉 SUCCESS WITH YOUR NURSE IMAGE!');
          console.log('🎬 Your nurse video URL:', result.data.video.url);
          
          // Download your nurse video
          const videoResponse = await axios.get(result.data.video.url, { responseType: 'stream' });
          const videoFileName = `YOUR-NURSE-TALKING-${Date.now()}.mp4`;
          const videoPath = path.join(__dirname, '..', videoFileName);
          
          const writer = fs.createWriteStream(videoPath);
          videoResponse.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          console.log('🎊 YOUR NURSE VIDEO IS READY!');
          console.log('📁 Saved as:', videoFileName);
          
        } else {
          console.log('❌ FAL upload didn\'t return a URL:', uploadResult);
        }
        
      } catch (falError) {
        console.log('❌ FAL storage upload failed:', falError.message);
      }
      
    } else {
      console.log('✅ Your image base64 is short enough, trying direct VEED call...');
      
      const result = await fal.subscribe("veed/fabric-1.0/text", {
        input: {
          image_url: dataUri,
          text: scriptText,
          resolution: "720p"
        },
        logs: true
      });

      console.log('🎉 Direct base64 worked! Video URL:', result.data.video.url);
    }

  } catch (error) {
    console.log('❌ Your image test failed:', error.message);
  }
}

// Run the test
testSimpleVeedAPI().catch(console.error);