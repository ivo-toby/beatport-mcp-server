#!/usr/bin/env node

/**
 * Test different Beatport authentication methods
 */

import axios from 'axios';

const CLIENT_ID = 'MTZS0g1HCT1RIyBeJFCq7N6aBRbeEDDJlDC397ht';

console.log('🧪 Testing Beatport OAuth methods...\n');

// Test 1: Try password grant without client secret
async function testPasswordGrantNoSecret() {
  console.log('1. Testing password grant without client secret...');
  
  try {
    const data = new URLSearchParams({
      client_id: CLIENT_ID,
      username: process.env.BEATPORT_USERNAME || 'test',
      password: process.env.BEATPORT_PASSWORD || 'test', 
      grant_type: 'password',
    });

    const response = await axios.post('https://api.beatport.com/v4/auth/o/token/', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    console.log('✅ Password grant (no secret) succeeded!');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Password grant (no secret) failed: ${error.response?.status} ${JSON.stringify(error.response?.data)}`);
    }
    return false;
  }
}

// Test 2: Try client credentials without secret
async function testClientCredentialsNoSecret() {
  console.log('\n2. Testing client credentials without secret...');
  
  try {
    const data = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'client_credentials',
    });

    const response = await axios.post('https://api.beatport.com/v4/auth/o/token/', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    console.log('✅ Client credentials (no secret) succeeded!');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Client credentials (no secret) failed: ${error.response?.status} ${JSON.stringify(error.response?.data)}`);
    }
    return false;
  }
}

// Test 3: Try to get client info
async function testClientInfo() {
  console.log('\n3. Testing client info endpoint...');
  
  try {
    const response = await axios.get(`https://api.beatport.com/v4/auth/o/applications/${CLIENT_ID}/`);
    console.log('✅ Client info retrieved:', response.data);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Client info failed: ${error.response?.status} ${JSON.stringify(error.response?.data)}`);
    }
    return false;
  }
}

// Test 4: Check what the authorize endpoint expects
async function testAuthorizeEndpoint() {
  console.log('\n4. Testing authorize endpoint...');
  
  try {
    // Just make a HEAD request to see what it expects
    const response = await axios.head(`https://api.beatport.com/v4/auth/o/authorize/?client_id=${CLIENT_ID}&response_type=code&redirect_uri=http://localhost:3000`);
    console.log('✅ Authorize endpoint accessible:', response.status);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Authorize endpoint: ${error.response?.status} ${JSON.stringify(error.response?.data)}`);
    }
    return false;
  }
}

async function runTests() {
  const results = [
    await testPasswordGrantNoSecret(),
    await testClientCredentialsNoSecret(), 
    await testClientInfo(),
    await testAuthorizeEndpoint()
  ];
  
  console.log('\n📊 Test Results:');
  console.log(`Password Grant (no secret): ${results[0] ? '✅' : '❌'}`);
  console.log(`Client Credentials (no secret): ${results[1] ? '✅' : '❌'}`);
  console.log(`Client Info: ${results[2] ? '✅' : '❌'}`);
  console.log(`Authorize Endpoint: ${results[3] ? '✅' : '❌'}`);
  
  if (!results[0] && !results[1]) {
    console.log('\n💡 Suggestions:');
    console.log('- The client_id might require a client_secret');
    console.log('- Try the authorization code flow instead');
    console.log('- Contact Beatport for proper API credentials');
  }
}

runTests().catch(console.error);
