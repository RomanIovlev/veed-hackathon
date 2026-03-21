// Enhanced Text-to-Speech implementation using OpenAI TTS API
// Replace the placeholder TTS function in server.js with this implementation

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create directory for temporary audio files
const audioDir = path.join(__dirname, 'temp-audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

/**
 * Convert text to speech using OpenAI TTS API
 * @param {string} text - The text to convert to speech
 * @param {string} voice - Voice to use ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
 * @param {string} model - Model to use ('tts-1' or 'tts-1-hd')
 * @param {number} speed - Speed of speech (0.25 to 4.0)
 * @returns {Promise<string>} - URL of the generated audio file
 */
export async function convertTextToSpeechAdvanced(
  text, 
  voice = 'alloy', 
  model = 'tts-1', 
  speed = 1.0
) {
  try {
    console.log(`Converting text to speech with voice: ${voice}, model: ${model}, speed: ${speed}`);
    
    // Clean up the script text - remove visual cues for cleaner audio
    const cleanText = cleanScriptForTTS(text);
    
    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: cleanText,
      speed: speed,
    });

    // Generate unique filename
    const filename = `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
    const filepath = path.join(audioDir, filename);

    // Convert the response to buffer and save
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(filepath, buffer);

    // For production, you'd upload this to a CDN or file storage service
    // For now, we'll serve it locally
    const audioUrl = `http://localhost:3001/audio/${filename}`;
    
    console.log(`Audio file saved: ${filepath}`);
    return audioUrl;

  } catch (error) {
    console.error('OpenAI TTS conversion failed:', error);
    throw new Error(`Text-to-speech conversion failed: ${error.message}`);
  }
}

/**
 * Clean script text for better TTS output
 * @param {string} text - Original script text
 * @returns {string} - Cleaned text suitable for TTS
 */
function cleanScriptForTTS(text) {
  // Remove visual cues like [VISUAL: description]
  let cleanText = text.replace(/\[VISUAL:[^\]]*\]/gi, '');
  
  // Remove extra whitespace and newlines
  cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();
  
  // Replace "NARRATOR:" with natural speech
  cleanText = cleanText.replace(/NARRATOR:\s*/gi, '');
  
  // Add appropriate pauses with periods
  cleanText = cleanText.replace(/\n/g, '. ');
  
  return cleanText;
}

// Alternative implementation using ElevenLabs (commented out)
/*
import ElevenLabs from 'elevenlabs-node';

const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function convertTextToSpeechElevenLabs(text, voiceId = 'default') {
  try {
    const cleanText = cleanScriptForTTS(text);
    
    const audioStream = await elevenlabs.textToSpeech({
      voiceId: voiceId,
      text: cleanText,
      modelId: 'eleven_monolingual_v1',
    });

    const filename = `speech_${Date.now()}.mp3`;
    const filepath = path.join(audioDir, filename);
    
    // Save the audio stream
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filepath);
      audioStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return `http://localhost:3001/audio/${filename}`;
    
  } catch (error) {
    console.error('ElevenLabs TTS conversion failed:', error);
    throw new Error(`Text-to-speech conversion failed: ${error.message}`);
  }
}
*/

// Voice options for different use cases
export const TTS_VOICES = {
  openai: {
    alloy: { name: 'Alloy', description: 'Neutral, balanced voice' },
    echo: { name: 'Echo', description: 'Deep, resonant voice' },
    fable: { name: 'Fable', description: 'Warm, storytelling voice' },
    onyx: { name: 'Onyx', description: 'Deep, authoritative voice' },
    nova: { name: 'Nova', description: 'Young, energetic voice' },
    shimmer: { name: 'Shimmer', description: 'Soft, gentle voice' }
  }
};

// Example usage in server.js:
/*
import { convertTextToSpeechAdvanced } from './tts-openai-example.js';

// Replace the convertTextToSpeech function with:
async function convertTextToSpeech(text, options = {}) {
  const {
    voice = 'alloy',
    model = 'tts-1',
    speed = 1.0
  } = options;
  
  return await convertTextToSpeechAdvanced(text, voice, model, speed);
}
*/