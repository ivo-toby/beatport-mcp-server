#!/usr/bin/env node

import fs from "fs"
import path from "path"
import https from "https"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Direct test of Beatport MCP Server without building
 * This helps us debug configuration issues
 */

console.log("🎵 Testing Beatport MCP Server configuration...")

// Test environment setup
function checkEnvironment() {
  console.log("\n1. Checking environment...")
  const username = process.env.BEATPORT_USERNAME
  const password = process.env.BEATPORT_PASSWORD

  if (!username || !password) {
    console.log("⚠️  Missing credentials. Set them like:")
    console.log('export BEATPORT_USERNAME="your@email.com"')
    console.log('export BEATPORT_PASSWORD="yourpassword"')
    return false
  }

  console.log("✅ Credentials found")
  console.log(`   Username: ${username.substring(0, 3)}***`)
  return true
}

// Test OpenAPI spec loading
function checkOpenAPISpec() {
  console.log("\n2. Checking OpenAPI spec...")

  const specPath = path.resolve(__dirname, "../specs/beatport-openapi.spec.json")

  if (!fs.existsSync(specPath)) {
    console.log("❌ OpenAPI spec not found at:", specPath)
    return false
  }

  try {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"))
    console.log("✅ OpenAPI spec loaded successfully")
    console.log(`   Title: ${spec.info?.title}`)
    console.log(`   Version: ${spec.info?.version}`)
    console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
    return true
  } catch (error) {
    console.log("❌ Failed to parse OpenAPI spec:", error.message)
    return false
  }
}

// Test package dependencies
async function checkDependencies() {
  console.log("\n3. Checking dependencies...")

  // Test importing the fixed openapi-mcp-server
  try {
    const { OpenAPIServer, OpenAPIMCPServerConfig } = await import("@ivotoby/openapi-mcp-server")
    if (typeof OpenAPIServer === "function") {
      console.log("✅ OpenAPIServer class found")
    } else {
      console.log("❌ OpenAPIServer is not a constructor")
      return false
    }
  } catch (error) {
    console.log("❌ Failed to import OpenAPIServer class")
    console.log("   Error:", error.message)
    console.log("   Try: npm install")
    return false
  }

  try {
    await import("axios")
    console.log("✅ axios found")
  } catch (error) {
    console.log("❌ axios not found")
    return false
  }

  return true
}

// Test Beatport API connectivity
function testBeatportAPI() {
  console.log("\n4. Testing Beatport API connectivity...")

  return new Promise((resolve) => {
    const req = https.request(
      "https://api.beatport.com/v4/auth/o/token/",
      {
        method: "HEAD",
        timeout: 5000,
      },
      (res) => {
        console.log(`✅ Beatport API reachable (status: ${res.statusCode})`)
        resolve(true)
      },
    )

    req.on("error", (error) => {
      console.log("⚠️  Network error:", error.message)
      resolve(false)
    })

    req.on("timeout", () => {
      console.log("⚠️  Request timeout")
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// Main test function
async function runTests() {
  const hasCredentials = checkEnvironment()
  const hasSpec = checkOpenAPISpec()
  const hasDeps = await checkDependencies()
  const apiReachable = await testBeatportAPI()

  console.log("\n📊 Test Results:")
  console.log(`   Credentials: ${hasCredentials ? "✅" : "❌"}`)
  console.log(`   OpenAPI Spec: ${hasSpec ? "✅" : "❌"}`)
  console.log(`   Dependencies: ${hasDeps ? "✅" : "❌"}`)
  console.log(`   API Connectivity: ${apiReachable ? "✅" : "⚠️ "}`)

  if (hasCredentials && hasSpec && hasDeps) {
    console.log("\n🎉 Ready to build and run!")
    console.log("\nNext steps:")
    console.log("1. npm run build")
    console.log("2. npm start")
  } else {
    console.log("\n❌ Some issues need to be resolved first.")
  }
}

runTests().catch(console.error)
