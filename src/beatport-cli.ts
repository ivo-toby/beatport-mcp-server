#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import { StreamableHttpServerTransport } from "@ivotoby/openapi-mcp-server"
import { BeatportMCPServer, BeatportMCPConfig } from "./beatport-server.js"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

/**
 * Load configuration from command line and environment
 */
function loadConfig(): BeatportMCPConfig {
  console.error("🔧 Loading configuration...")

  const argv = yargs(hideBin(process.argv))
    .option("username", {
      alias: "u",
      type: "string",
      description: "Beatport username/email",
    })
    .option("password", {
      alias: "p",
      type: "string",
      description: "Beatport password",
    })
    .option("accessToken", {
      alias: "a",
      type: "string",
      description: "Beatport Bearer access token",
    })
    .option("refreshToken", {
      alias: "r",
      type: "string",
      description: "Beatport refresh token",
    })
    .option("transport", {
      alias: "t",
      type: "string",
      choices: ["stdio", "http"],
      description: "Transport type to use (stdio or http)",
      default: "stdio",
    })
    .option("port", {
      type: "number",
      description: "HTTP port for HTTP transport",
      default: 3000,
    })
    .option("host", {
      type: "string",
      description: "HTTP host for HTTP transport",
      default: "127.0.0.1",
    })
    .option("path", {
      type: "string",
      description: "HTTP endpoint path for HTTP transport",
      default: "/mcp",
    })
    .option("name", {
      alias: "n",
      type: "string",
      description: "Server name",
      default: "beatport-mcp-server",
    })
    .option("version", {
      alias: "v",
      type: "string",
      description: "Server version",
      default: "1.0.0",
    })
    .option("tools", {
      type: "string",
      choices: ["all", "dynamic"],
      description: "Which tools to load: all or dynamic meta-tools",
      default: "all",
    })
    .option("tool", {
      type: "array",
      string: true,
      description: "Import only specified tool IDs or names",
    })
    .option("tag", {
      type: "array",
      string: true,
      description: "Import only tools with specified OpenAPI tags",
    })
    .option("resource", {
      type: "array",
      string: true,
      description: "Import only tools under specified resource path prefixes",
    })
    .option("operation", {
      type: "array",
      string: true,
      description: "Import only tools for specified HTTP methods (e.g., get, post)",
    })
    .option("disable-abbreviation", {
      type: "boolean",
      description: "Disable name optimization",
    })
    .help()
    .version(false) // Disable yargs built-in version handling
    .parseSync()

  console.error("✅ Arguments parsed successfully")

  // Get credentials from args or environment
  const username = argv.username || process.env.BEATPORT_USERNAME
  const password = argv.password || process.env.BEATPORT_PASSWORD
  const accessToken = argv.accessToken || process.env.BEATPORT_ACCESS_TOKEN
  const refreshToken = argv.refreshToken || process.env.BEATPORT_REFRESH_TOKEN

  console.error("🔍 Checking credentials...")

  // If we have an access token, we can skip username/password
  if (accessToken) {
    console.error("✅ Manual access token found")

    const config = {
      name: argv.name,
      version: argv.version,
      beatportCredentials: {
        username: username || "token-user", // Dummy username when using token
        password: password || "token-pass", // Dummy password when using token
        accessToken,
        refreshToken,
      },
      transportType: argv.transport as "stdio" | "http",
      httpPort: argv.port,
      httpHost: argv.host,
      endpointPath: argv.path,
      includeTools: argv.tool as string[] | undefined,
      includeTags: argv.tag as string[] | undefined,
      includeResources: argv.resource as string[] | undefined,
      includeOperations: argv.operation as string[] | undefined,
      toolsMode: argv.tools as "all" | "dynamic",
      disableAbbreviation: argv["disable-abbreviation"],
    }

    console.error("✅ Configuration created with manual token")
    return config
  }

  // Otherwise require username/password
  if (!username || !password) {
    console.error("Error: Beatport credentials are required.")
    console.error("Provide them via:")
    console.error("  Command line: --username your@email.com --password yourpassword")
    console.error("  Environment: BEATPORT_USERNAME=your@email.com BEATPORT_PASSWORD=yourpassword")
    console.error("  Manual token: BEATPORT_ACCESS_TOKEN=your_token_here")
    console.error("")
    console.error("💡 To get a manual token, run: node get-token.js")
    process.exit(1)
  }

  console.error("✅ Credentials found")

  const config = {
    name: argv.name,
    version: argv.version,
    beatportCredentials: {
      username,
      password,
    },
    transportType: argv.transport as "stdio" | "http",
    httpPort: argv.port,
    httpHost: argv.host,
    endpointPath: argv.path,
    includeTools: argv.tool as string[] | undefined,
    includeTags: argv.tag as string[] | undefined,
      includeResources: argv.resource as string[] | undefined,
      includeOperations: argv.operation as string[] | undefined,
      toolsMode: argv.tools as "all" | "dynamic",
      disableAbbreviation: argv["disable-abbreviation"],
    }

  console.error("✅ Configuration created successfully")
  return config
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.error("🎵 Beatport MCP Server starting...")

  try {
    const config = loadConfig()
    console.error("✅ Configuration loaded")
    console.error("   Username:", config.beatportCredentials.username.substring(0, 3) + "***")
    console.error("   Transport:", config.transportType)

    const server = new BeatportMCPServer(config)
    console.error("✅ Server instance created")

    // Choose transport based on config
    let transport: Transport
    if (config.transportType === "http") {
      transport = new StreamableHttpServerTransport(
        config.httpPort!,
        config.httpHost!,
        config.endpointPath!,
      )
      await server.start(transport)
      console.error(
        `Beatport MCP Server running on http://${config.httpHost}:${config.httpPort}${config.endpointPath}`,
      )
    } else {
      transport = new StdioServerTransport()
      console.error("✅ Starting server with stdio transport...")
      await server.start(transport)
      console.error("Beatport MCP Server running on stdio")
    }
  } catch (error) {
    console.error("Failed to start Beatport MCP server:", error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...")
  process.exit(0)
})

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...")
  process.exit(0)
})

// Start the server
main().catch((error) => {
  console.error("Unhandled error:", error)
  process.exit(1)
})
