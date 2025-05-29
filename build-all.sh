#!/bin/bash

echo "🔧 Building updated OpenAPI MCP Server and Beatport MCP Server..."

# Build the openapi-mcp-server first
echo "📦 Building openapi-mcp-server..."
cd /Users/ivo/workspace/mcp-openapi-server
npm run build

if [ $? -ne 0 ]; then
    echo "❌ OpenAPI MCP Server build failed"
    exit 1
fi

echo "✅ OpenAPI MCP Server built successfully"

# Now build the beatport-mcp project  
echo "📦 Building beatport-mcp..."
cd /Users/ivo/workspace/beatport-mcp

# Install dependencies (this will use the local openapi-mcp-server)
npm install

if [ $? -ne 0 ]; then
    echo "❌ Beatport MCP dependencies install failed"
    exit 1
fi

# Build the project
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Beatport MCP build failed"
    exit 1
fi

echo "✅ Beatport MCP built successfully"

# Run diagnostics
echo "🧪 Running diagnostics..."
node diagnose.js

echo ""
echo "🎉 Build process complete!"
echo "Try running: npm start"
