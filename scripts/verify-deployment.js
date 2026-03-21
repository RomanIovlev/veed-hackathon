#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * Tests that all Netlify Functions are working correctly after deployment.
 * 
 * Usage:
 *   node scripts/verify-deployment.js [BASE_URL]
 *   
 * Example:
 *   node scripts/verify-deployment.js https://your-site.netlify.app
 */

import https from 'https';
import http from 'http';

const BASE_URL = process.argv[2] || 'http://localhost:8888';
const isHttps = BASE_URL.startsWith('https://');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = isHttps ? https : http;
    const request = client.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: response.statusCode,
            data: jsonData,
            success: response.statusCode >= 200 && response.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            data: data,
            success: response.statusCode >= 200 && response.statusCode < 300,
            parseError: true
          });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(endpoint, description) {
  const url = `${BASE_URL}/.netlify/functions/${endpoint}`;
  
  try {
    console.log(`🔍 Testing ${description}...`);
    const result = await makeRequest(url);
    
    if (result.success) {
      console.log(`✅ ${description} - OK (${result.status})`);
      return true;
    } else {
      console.log(`❌ ${description} - Failed (${result.status})`);
      if (result.parseError) {
        console.log(`   Raw response: ${result.data.substring(0, 200)}...`);
      } else {
        console.log(`   Error: ${result.data.error || result.data.message || 'Unknown error'}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

async function verifyDeployment() {
  console.log(`🚀 Verifying deployment at: ${BASE_URL}`);
  console.log('=' .repeat(50));
  
  const tests = [
    ['health', 'Health Check'],
    ['trainings', 'Training Documents API'],
    ['users', 'Users API'],
    ['voices', 'Voice Options API'],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [endpoint, description] of tests) {
    const success = await testEndpoint(endpoint, description);
    if (success) passed++;
    console.log(); // Add spacing
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your deployment is working correctly.');
    
    console.log('\n📝 Next steps:');
    console.log('1. Test the web interface by visiting the main URL');
    console.log('2. Try creating a training document');
    console.log('3. Test video generation (requires FAL_KEY)');
    
  } else {
    console.log('⚠️  Some tests failed. Check the following:');
    console.log('1. Environment variables are set correctly');
    console.log('2. Database connection is working');
    console.log('3. All functions deployed successfully');
    
    process.exit(1);
  }
}

// Handle various URL formats
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
}

if (process.argv[2]) {
  const normalizedUrl = normalizeUrl(process.argv[2]);
  process.argv[2] = normalizedUrl;
}

verifyDeployment().catch(console.error);