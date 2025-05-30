import { OpenAPIServer, OpenAPIMCPServerConfig } from "@ivotoby/openapi-mcp-server"
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import { BeatportAuth, BeatportCredentials } from "./beatport-auth.js"
import * as fs from "fs/promises"
import * as path from "path"
import * as url from "url"

export interface BeatportMCPConfig {
  name?: string
  version?: string
  beatportCredentials: BeatportCredentials
  transportType?: "stdio" | "http"
  httpPort?: number
  httpHost?: string
  endpointPath?: string
  includeTools?: string[]
  includeTags?: string[]
  includeResources?: string[]
  includeOperations?: string[]
  toolsMode?: "all" | "dynamic"
  disableAbbreviation?: boolean
}

/**
 * Beatport-specific MCP Server that handles authentication automatically
 */
export class BeatportMCPServer {
  private beatportAuth: BeatportAuth
  private openAPIServer?: OpenAPIServer

  constructor(private config: BeatportMCPConfig) {
    this.beatportAuth = new BeatportAuth(config.beatportCredentials)
  }

  /**
   * Start the Beatport MCP server
   */
  async start(transport: Transport): Promise<void> {
    console.error("🔑 Authenticating with Beatport...")

    try {
      // Get authentication headers
      const authHeaders = await this.beatportAuth.getAuthHeaders()
      console.error("✅ Authentication successful")
    } catch (error) {
      console.error("❌ Authentication failed:", error)
      throw error
    }

    console.error("📝 Loading Beatport OpenAPI specification...")
    let specContent: string
    try {
      specContent = await this.getBeatportOpenAPISpec()
      console.error("✅ OpenAPI spec loaded successfully")
    } catch (error) {
      console.error("❌ Failed to load OpenAPI spec:", error)
      throw error
    }

    // Re-get auth headers in case they were refreshed
    const authHeaders = await this.beatportAuth.getAuthHeaders()

    // Build OpenAPI config with dynamic auth headers
    const openAPIConfig: OpenAPIMCPServerConfig = {
      name: this.config.name || "beatport-mcp-server",
      version: this.config.version || "1.0.0",
      apiBaseUrl: "https://api.beatport.com",
      openApiSpec: "inline", // Path/identifier for inline spec
      specInputMethod: "inline",
      inlineSpecContent: specContent, // Actual spec content
      headers: authHeaders,
      transportType: this.config.transportType || "stdio",
      httpPort: this.config.httpPort,
      httpHost: this.config.httpHost,
      endpointPath: this.config.endpointPath,
      includeTools: this.config.includeTools,
      includeTags: this.config.includeTags,
      includeResources: this.config.includeResources,
      includeOperations: this.config.includeOperations,
      toolsMode: this.config.toolsMode || "all",
      disableAbbreviation: this.config.disableAbbreviation,
    }

    console.error("🚀 Creating OpenAPI MCP server...")
    // Create and start the OpenAPI server
    this.openAPIServer = new OpenAPIServer(openAPIConfig)
    console.error("✅ OpenAPI server created, starting...")
    await this.openAPIServer.start(transport)
    console.error("✅ Server started successfully")
  }

  /**
   * Get the Beatport OpenAPI specification
   */
  private async getBeatportOpenAPISpec(): Promise<string> {
    try {
      const __filename = url.fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const specPath = path.resolve(__dirname, "../specs/beatport-openapi.spec.json")

      const specContent = await fs.readFile(specPath, "utf8")
      return specContent
    } catch (error) {
      throw new Error(`Failed to load Beatport OpenAPI specification: ${error}`)
    }
  }
}
