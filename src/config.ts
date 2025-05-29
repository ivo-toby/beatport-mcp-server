import yargs from "yargs"
import { hideBin } from "yargs/helpers"

export interface OpenAPIMCPServerConfig {
  name: string
  version: string
  apiBaseUrl: string
  openApiSpec: string
  /** Spec input method: 'url', 'file', 'stdin', 'inline' */
  specInputMethod: "url" | "file" | "stdin" | "inline"
  /** Inline spec content when using 'inline' method */
  inlineSpecContent?: string
  headers?: Record<string, string>
  transportType: "stdio" | "http"
  httpPort?: number
  httpHost?: string
  endpointPath?: string
  /** Filter only specific tool IDs or names */
  includeTools?: string[]
  /** Filter only specific tags */
  includeTags?: string[]
  /** Filter only specific resources (path prefixes) */
  includeResources?: string[]
  /** Filter only specific HTTP methods: get,post,put,... */
  includeOperations?: string[]
  /** Tools loading mode: 'all' or 'dynamic' */
  toolsMode: "all" | "dynamic"
  disableAbbreviation?: boolean
}

/**
 * Parse header string in format 'key1:value1,key2:value2' into a record
 */
export function parseHeaders(headerStr?: string): Record<string, string> {
  const headers: Record<string, string> = {}
  if (headerStr) {
    headerStr.split(",").forEach((header) => {
      const [key, value] = header.split(":")
      if (key && value) headers[key.trim()] = value.trim()
    })
  }
  return headers
}

/**
 * Load configuration from command line arguments and environment variables
 */
export function loadConfig(): OpenAPIMCPServerConfig {
  const argv = yargs(hideBin(process.argv))
    .option("transport", {
      alias: "t",
      type: "string",
      choices: ["stdio", "http"],
      description: "Transport type to use (stdio or http)",
    })
    .option("port", {
      alias: "p",
      type: "number",
      description: "HTTP port for HTTP transport",
    })
    .option("host", {
      type: "string",
      description: "HTTP host for HTTP transport",
    })
    .option("path", {
      type: "string",
      description: "HTTP endpoint path for HTTP transport",
    })
    .option("api-base-url", {
      alias: "u",
      type: "string",
      description: "Base URL for the API",
    })
    .option("openapi-spec", {
      alias: "s",
      type: "string",
      description: "Path or URL to OpenAPI specification",
    })
    .option("spec-from-stdin", {
      type: "boolean",
      description: "Read OpenAPI spec from standard input",
    })
    .option("spec-inline", {
      type: "string",
      description: "Provide OpenAPI spec content directly as a string",
    })
    .option("headers", {
      alias: "H",
      type: "string",
      description: "API headers in format 'key1:value1,key2:value2'",
    })
    .option("name", {
      alias: "n",
      type: "string",
      description: "Server name",
    })
    .option("server-version", {
      alias: "v",
      type: "string",
      description: "Server version",
    })
    .option("tools", {
      type: "string",
      choices: ["all", "dynamic"],
      description: "Which tools to load: all or dynamic meta-tools",
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
    .parseSync()

  // Transport configuration
  // Determine transport type, ensuring only 'stdio' or 'http'
  let transportType: "stdio" | "http"
  if (argv.transport === "http" || process.env.TRANSPORT_TYPE === "http") {
    transportType = "http"
  } else {
    transportType = "stdio"
  }

  const httpPort = argv.port ?? (process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 3000)
  const httpHost = argv.host || process.env.HTTP_HOST || "127.0.0.1"
  const endpointPath = argv.path || process.env.ENDPOINT_PATH || "/mcp"

  // Determine spec input method and validate
  const specFromStdin = argv["spec-from-stdin"] || process.env.OPENAPI_SPEC_FROM_STDIN === "true"
  const specInline = argv["spec-inline"] || process.env.OPENAPI_SPEC_INLINE
  const openApiSpec = argv["openapi-spec"] || process.env.OPENAPI_SPEC_PATH

  // Count how many spec input methods are specified
  const specInputCount = [specFromStdin, !!specInline, !!openApiSpec].filter(Boolean).length

  if (specInputCount === 0) {
    throw new Error(
      "OpenAPI spec is required. Use one of: --openapi-spec, --spec-from-stdin, or --spec-inline",
    )
  }

  if (specInputCount > 1) {
    throw new Error("Only one OpenAPI spec input method can be specified at a time")
  }

  // Determine spec input method and content
  let specInputMethod: "url" | "file" | "stdin" | "inline"
  let specPath: string
  let inlineSpecContent: string | undefined

  if (specFromStdin) {
    specInputMethod = "stdin"
    specPath = "stdin"
  } else if (specInline) {
    specInputMethod = "inline"
    specPath = "inline"
    inlineSpecContent = specInline
  } else if (openApiSpec) {
    // Determine if it's a URL or file path
    if (openApiSpec.startsWith("http://") || openApiSpec.startsWith("https://")) {
      specInputMethod = "url"
    } else {
      specInputMethod = "file"
    }
    specPath = openApiSpec
  } else {
    throw new Error("OpenAPI spec is required")
  }

  // Combine CLI args and env vars, with CLI taking precedence
  const apiBaseUrl = argv["api-base-url"] || process.env.API_BASE_URL
  const disableAbbreviation =
    argv["disable-abbreviation"] ||
    (process.env.DISABLE_ABBREVIATION ? process.env.DISABLE_ABBREVIATION === "true" : false)

  if (!apiBaseUrl) {
    throw new Error("API base URL is required (--api-base-url or API_BASE_URL)")
  }

  const headers = parseHeaders(argv.headers || process.env.API_HEADERS)

  return {
    name: argv.name || process.env.SERVER_NAME || "mcp-openapi-server",
    version: argv["server-version"] || process.env.SERVER_VERSION || "1.0.0",
    apiBaseUrl,
    openApiSpec: specPath,
    specInputMethod,
    inlineSpecContent,
    headers,
    transportType,
    httpPort,
    httpHost,
    endpointPath,
    includeTools: argv.tool as string[] | undefined,
    includeTags: argv.tag as string[] | undefined,
    includeResources: argv.resource as string[] | undefined,
    includeOperations: argv.operation as string[] | undefined,
    toolsMode: (argv.tools as "all" | "dynamic") || process.env.TOOLS_MODE || "all",
    disableAbbreviation: disableAbbreviation ? true : undefined,
  }
}
