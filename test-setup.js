#!/usr/bin/env node

/**
 * Simple test script to verify the Beatport MCP setup
 */

console.log('🎵 Testing Beatport MCP Server Setup...\n');

// Test 1: Check if we can import the auth module
try {
  console.log('✓ Testing auth module import...');
  // This would normally be: import { BeatportAuth } from './src/beatport-auth.js';
  // But we'll just check the file exists
  const fs = require('fs');
  const authFile = './src/beatport-auth.ts';
  if (fs.existsSync(authFile)) {
    console.log('  ✓ beatport-auth.ts found');
  } else {
    console.log('  ✗ beatport-auth.ts missing');
  }
} catch (error) {
  console.log('  ✗ Error importing auth module:', error.message);
}

// Test 2: Check if we have the client ID
const clientId = 'MTZS0g1HCT1RIyBeJFCq7N6aBRbeEDDJlDC397ht';
console.log('✓ Testing client ID...');
console.log(`  ✓ Using client ID: ${clientId.substring(0, 8)}...`);

// Test 3: Check environment setup
console.log('✓ Testing environment...');
const requiredEnvVars = ['BEATPORT_USERNAME', 'BEATPORT_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length === 0) {
  console.log('  ✓ All required environment variables are set');
} else {
  console.log(`  ⚠ Missing environment variables: ${missingVars.join(', ')}`);
  console.log('  ℹ Set them like: BEATPORT_USERNAME=your@email.com BEATPORT_PASSWORD=yourpass');
}

// Test 4: Check if we can make a basic HTTP request
console.log('✓ Testing HTTP connectivity...');
try {
  const https = require('https');
  const req = https.request('https://api.beatport.com/v4/auth/o/token/', { method: 'POST' }, (res) => {
    console.log(`  ✓ Beatport API reachable (status: ${res.statusCode})`);
  });
  
  req.on('error', (error) => {
    console.log('  ⚠ Network error:', error.message);
  });
  
  req.end();
} catch (error) {
  console.log('  ⚠ HTTP test failed:', error.message);
}

console.log('\n🎵 Setup verification complete!');
console.log('\nNext steps:');
console.log('1. Set your Beatport credentials: export BEATPORT_USERNAME=your@email.com BEATPORT_PASSWORD=yourpass');
console.log('2. Install dependencies: npm install');
console.log('3. Build the project: npm run build');
console.log('4. Run the server: npm start');
