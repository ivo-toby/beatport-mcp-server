#!/usr/bin/env node

/**
 * Test script to verify the Beatport MCP server is working
 */

import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log("🧪 Testing Beatport MCP Server...")

// Start the server as a child process
const serverPath = resolve(__dirname, "../bin/mcp-server.js")
const server = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "pipe"],
  env: {
    ...process.env,
    BEATPORT_USERNAME: process.env.BEATPORT_USERNAME || "test@example.com",
    BEATPORT_PASSWORD: process.env.BEATPORT_PASSWORD || "testpass",
  },
})

let output = ""
let errorOutput = ""

server.stdout.on("data", (data) => {
  output += data.toString()
  console.log("📤 Server stdout:", data.toString().trim())
})

server.stderr.on("data", (data) => {
  errorOutput += data.toString()
  console.log("📤 Server stderr:", data.toString().trim())
})

server.on("close", (code) => {
  console.log(`\n📊 Server exited with code: ${code}`)
  console.log("📤 Total stdout:", output)
  console.log("📤 Total stderr:", errorOutput)
})

// Send a test MCP message
setTimeout(() => {
  console.log("📨 Sending test MCP initialize message...")

  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  }

  server.stdin.write(JSON.stringify(initMessage) + "\n")
}, 1000)

// Clean up after 5 seconds
setTimeout(() => {
  console.log("🛑 Stopping test...")
  server.kill()
}, 5000)
