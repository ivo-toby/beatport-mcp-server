#!/bin/bash

# Beatport MCP Server - Development Setup Script

echo "🎵 Setting up Beatport MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check for credentials
if [ -z "$BEATPORT_USERNAME" ] || [ -z "$BEATPORT_PASSWORD" ]; then
    echo "⚠️  Environment variables not set"
    echo "Please set your Beatport credentials:"
    echo "export BEATPORT_USERNAME='your@email.com'"
    echo "export BEATPORT_PASSWORD='yourpassword'"
    echo ""
    echo "Then run: npm start"
else
    echo "✅ Credentials found in environment"
    echo "🚀 Ready to start! Run: npm start"
fi

echo ""
echo "🎵 Beatport MCP Server setup complete!"
