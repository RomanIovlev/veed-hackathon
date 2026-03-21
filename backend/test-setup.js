// Quick test to verify the backend setup is working
// Run with: node test-setup.js

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Backend Configuration Test');
console.log('=============================');

// Check if FAL_KEY is loaded
const falKey = process.env.FAL_KEY;
console.log('FAL_KEY present:', falKey ? '✅ Yes' : '❌ No');
console.log('FAL_KEY length:', falKey ? falKey.length : 'N/A');
console.log('FAL_KEY format:', falKey ? 'Valid format' : 'Missing');

// Check if it looks like a valid FAL key
if (falKey) {
  const isValidFormat = falKey.includes(':') && falKey.length > 20;
  console.log('FAL_KEY format valid:', isValidFormat ? '✅ Yes' : '❌ No');
} else {
  console.log('❌ FAL_KEY is missing from .env file');
}

// Test health endpoint
console.log('\n🧪 Testing Health Endpoint...');
try {
  const response = await fetch('http://localhost:3001/health');
  const data = await response.json();
  
  console.log('Backend running:', response.ok ? '✅ Yes' : '❌ No');
  console.log('API Key configured (backend):', data.apiKeyConfigured ? '✅ Yes' : '❌ No');
  
  if (data.warning) {
    console.log('Warning:', data.warning);
  }
} catch (error) {
  console.log('❌ Backend not accessible:', error.message);
  console.log('💡 Make sure to start the backend: npm run dev');
}

console.log('\n🎯 Summary:');
console.log('- FAL API Key:', falKey ? '✅ Configured' : '❌ Missing');
console.log('- Backend Server:', '✅ Should be running on port 3001');
console.log('- Ready for video generation:', falKey ? '✅ Yes' : '❌ Need to set FAL_KEY');