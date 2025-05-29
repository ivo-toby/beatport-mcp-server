#!/usr/bin/env node

// Import and run our custom Beatport CLI
import("../dist/beatport-cli.js")
  .then(() => {
    // console.log('✅ Beatport CLI loaded successfully');
  })
  .catch((error) => {
    console.error("Failed to start Beatport MCP server:", error.message)
    console.error("Stack:", error.stack)
    process.exit(1)
  })
