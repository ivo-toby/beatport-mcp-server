#!/usr/bin/env node

// Simple test to check if we can build and run
console.log('🎵 Testing Beatport MCP Server build...');

// Try to import our modules to see what fails
async function test() {
  try {
    console.log('1. Checking if openapi-mcp-server is available...');
    const { OpenAPIServer } = await import('@ivotoby/openapi-mcp-server');
    console.log('✅ OpenAPIServer imported successfully');
    
    console.log('2. Testing basic configuration...');
    // Test basic config structure
    const config = {
      name: 'test',
      version: '1.0.0',
      apiBaseUrl: 'https://api.beatport.com',
      openApiSpec: 'inline',
      specInputMethod: 'inline',
      inlineSpecContent: '{"openapi": "3.0.0", "info": {"title": "test", "version": "1.0.0"}, "paths": {}}',
      headers: {},
      transportType: 'stdio',
      toolsMode: 'all',
    };
    
    console.log('✅ Configuration created successfully');
    
    console.log('3. Testing if we can create OpenAPIServer...');
    const server = new OpenAPIServer(config);
    console.log('✅ OpenAPIServer created successfully');
    
    console.log('🎉 All tests passed! Build should work.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
