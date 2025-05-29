#!/usr/bin/env node

// Quick test to see if our build works
console.log('🎵 Testing Beatport MCP Server build process...');

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname);

try {
  console.log('📍 Project root:', projectRoot);
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
  
  console.log('🔨 Building project...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  
  console.log('✅ Build successful!');
  
  console.log('🧪 Testing basic imports...');
  // Try to load the built files
  const { BeatportAuth } = await import('./dist/index.js');
  console.log('✅ BeatportAuth imported successfully');
  
  console.log('🎉 All tests passed!');
  console.log('');
  console.log('🚀 Ready to run! Use:');
  console.log('BEATPORT_USERNAME=your@email.com BEATPORT_PASSWORD=yourpass npm start');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
