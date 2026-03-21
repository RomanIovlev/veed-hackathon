// Diagnostic script to check backend configuration
// Run with: node diagnose.js

console.log('🔍 Backend Configuration Diagnostic');
console.log('===================================\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   FAL_KEY:', process.env.FAL_KEY ? '✅ Set (length: ' + process.env.FAL_KEY.length + ')' : '❌ Not set');
console.log('   PORT:', process.env.PORT || '3001 (default)');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development (default)');
console.log();

// Check if FAL_KEY looks valid
const falKey = process.env.FAL_KEY;
if (falKey) {
  if (falKey === 'YOUR_API_KEY_HERE') {
    console.log('❌ FAL_KEY is still set to placeholder value');
  } else if (falKey.length < 10) {
    console.log('⚠️  FAL_KEY seems too short - may be invalid');
  } else if (!falKey.includes('-') && !falKey.match(/^[a-zA-Z0-9]/)) {
    console.log('⚠️  FAL_KEY format looks suspicious');
  } else {
    console.log('✅ FAL_KEY appears to have valid format');
  }
}

// Check dependencies
console.log('2. Dependencies:');
try {
  require('@fal-ai/client');
  console.log('   @fal-ai/client: ✅ Installed');
} catch (e) {
  console.log('   @fal-ai/client: ❌ Not found - run npm install');
}

try {
  require('express');
  console.log('   express: ✅ Installed');
} catch (e) {
  console.log('   express: ❌ Not found - run npm install');
}

try {
  require('cors');
  console.log('   cors: ✅ Installed');
} catch (e) {
  console.log('   cors: ❌ Not found - run npm install');
}

console.log();

// Check if server is running
console.log('3. Server Status:');
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('   Server: ✅ Running on port 3001');
      console.log('   Health status:', result.status);
      console.log('   API Key configured:', result.apiKeyConfigured ? '✅ Yes' : '❌ No');
      if (result.warning) {
        console.log('   Warning:', result.warning);
      }
    } catch (e) {
      console.log('   Server: ⚠️  Running but returned invalid JSON');
    }
    
    console.log('\n4. Troubleshooting:');
    if (!process.env.FAL_KEY || process.env.FAL_KEY === 'YOUR_API_KEY_HERE') {
      console.log('   🔧 Get your API key from: https://fal.ai/');
      console.log('   🔧 Set it with: set FAL_KEY=your_actual_api_key_here');
      console.log('   🔧 Then restart the backend server');
    } else {
      console.log('   ✅ Configuration looks good!');
      console.log('   💡 Try generating a video in your frontend');
    }
  });
});

req.on('error', (e) => {
  console.log('   Server: ❌ Not running on port 3001');
  console.log('   Start with: npm run dev');
});

req.on('timeout', () => {
  console.log('   Server: ❌ Not responding (timeout)');
  req.destroy();
});

req.end();