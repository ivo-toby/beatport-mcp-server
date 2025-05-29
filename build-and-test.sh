#!/bin/bash

echo "🎵 Building and testing Beatport MCP Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in the right directory. Please run from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🧪 Testing imports..."
    node test-imports.js
    
    echo ""
    echo "🚀 Now try running with credentials:"
    echo "BEATPORT_USERNAME=your@email.com BEATPORT_PASSWORD=yourpass npm start"
else
    echo "❌ Build failed!"
    exit 1
fi
