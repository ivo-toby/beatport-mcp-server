import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { parseHeaders } from "../src/config"
// We'll import loadConfig dynamically in each test after setting up mocks

describe("parseHeaders", () => {
  it("should parse header string into a record", () => {
    const headerStr = "key1:value1,key2:value2"
    const result = parseHeaders(headerStr)
    expect(result).toEqual({
      key1: "value1",
      key2: "value2",
    })
  })

  it("should handle whitespace in header string", () => {
    const headerStr = "key1: value1 , key2 :value2"
    const result = parseHeaders(headerStr)
    expect(result).toEqual({
      key1: "value1",
      key2: "value2",
    })
  })

  it("should return empty object for undefined input", () => {
    const result = parseHeaders(undefined)
    expect(result).toEqual({})
  })

  it("should handle empty string input", () => {
    const result = parseHeaders("")
    expect(result).toEqual({})
  })

  it("should skip malformed headers", () => {
    const headerStr = "key1:value1,malformed,key2:value2"
    const result = parseHeaders(headerStr)
    expect(result).toEqual({
      key1: "value1",
      key2: "value2",
    })
  })
})

describe("loadConfig", () => {
  const originalEnv = { ...process.env }
  const originalArgv = [...process.argv]

  beforeEach(() => {
    vi.resetModules()
    process.argv = ["node", "script.js"]
    // Clear environment variables that might affect tests
    delete process.env.API_BASE_URL
    delete process.env.OPENAPI_SPEC_PATH
    delete process.env.OPENAPI_SPEC_FROM_STDIN
    delete process.env.OPENAPI_SPEC_INLINE
    delete process.env.API_HEADERS
    delete process.env.SERVER_NAME
    delete process.env.SERVER_VERSION
    delete process.env.TRANSPORT_TYPE
    delete process.env.HTTP_PORT
    delete process.env.HTTP_HOST
    delete process.env.ENDPOINT_PATH
    delete process.env.TOOLS_MODE
    delete process.env.DISABLE_ABBREVIATION

    // Reset mocks before each test
    vi.clearAllMocks()

    // Clear all mocks
    vi.doMock("yargs", () => ({}))
    vi.doMock("yargs/helpers", () => ({}))
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it("should load config from command line arguments", async () => {
    // Setup mocks before importing the module
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
          headers: "Authorization:Bearer token",
          name: "test-server",
          "server-version": "1.2.3",
          transport: "stdio",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Import the module after setting up mocks
    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config).toEqual({
      name: "test-server",
      version: "1.2.3",
      apiBaseUrl: "https://api.example.com",
      openApiSpec: "./spec.json",
      specInputMethod: "file",
      inlineSpecContent: undefined,
      headers: {
        Authorization: "Bearer token",
      },
      transportType: "stdio",
      httpPort: 3000,
      httpHost: "127.0.0.1",
      endpointPath: "/mcp",
      includeTools: undefined,
      includeTags: undefined,
      includeResources: undefined,
      includeOperations: undefined,
      toolsMode: "all",
      disableAbbreviation: undefined,
    })
  })

  it("should throw error if API base URL is missing", async () => {
    // Setup mocks before importing the module
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "openapi-spec": "./spec.json",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Import the module after setting up mocks
    const { loadConfig } = await import("../src/config")

    expect(() => loadConfig()).toThrow("API base URL is required")
  })

  it("should throw error if OpenAPI spec is missing", async () => {
    // Setup mocks before importing the module
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Import the module after setting up mocks
    const { loadConfig } = await import("../src/config")

    expect(() => loadConfig()).toThrow("OpenAPI spec is required")
  })

  it("should use environment variables as fallback", async () => {
    // Setup mocks before importing the module
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          // empty object
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Set environment variables
    process.env.API_BASE_URL = "https://env.example.com"
    process.env.OPENAPI_SPEC_PATH = "./env-spec.json"
    process.env.API_HEADERS = "X-API-Key:12345"
    process.env.SERVER_NAME = "env-server"
    process.env.SERVER_VERSION = "3.2.1"
    process.env.TRANSPORT_TYPE = "stdio"

    // Import the module after setting up mocks
    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config).toEqual({
      name: "env-server",
      version: "3.2.1",
      apiBaseUrl: "https://env.example.com",
      openApiSpec: "./env-spec.json",
      specInputMethod: "file",
      inlineSpecContent: undefined,
      headers: {
        "X-API-Key": "12345",
      },
      transportType: "stdio",
      httpPort: 3000,
      httpHost: "127.0.0.1",
      endpointPath: "/mcp",
      includeTools: undefined,
      includeTags: undefined,
      includeResources: undefined,
      includeOperations: undefined,
      toolsMode: "all",
      disableAbbreviation: undefined,
    })
  })

  it("should use default values for name and version if not provided", async () => {
    // Setup mocks before importing the module
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Import the module after setting up mocks
    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config.name).toBe("mcp-openapi-server")
    expect(config.version).toBe("1.0.0")
    expect(config.transportType).toBe("stdio")
  })

  it("should handle disableAbbreviation from command line and environment", async () => {
    // Test with command line argument
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
          "disable-abbreviation": true,
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Import the module after setting up mocks
    let { loadConfig } = await import("../src/config")
    let config = loadConfig()
    expect(config.disableAbbreviation).toBe(true)

    // Reset modules for next test
    vi.resetModules()

    // Test with environment variable (string 'true')
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    process.env.DISABLE_ABBREVIATION = "true"

    // Import the module again after resetting
    const configModule = await import("../src/config")
    loadConfig = configModule.loadConfig
    config = loadConfig()
    expect(config.disableAbbreviation).toBe(true)

    // Reset modules for next test
    vi.resetModules()

    // Test with environment variable (string 'false')
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    process.env.DISABLE_ABBREVIATION = "false"

    // Import the module again after resetting
    const configModule2 = await import("../src/config")
    loadConfig = configModule2.loadConfig
    config = loadConfig()
    expect(config.disableAbbreviation).toBeUndefined()

    // Test default value (undefined)
    vi.resetModules()
    delete process.env.DISABLE_ABBREVIATION

    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    const configModule3 = await import("../src/config")
    loadConfig = configModule3.loadConfig
    config = loadConfig()
    expect(config.disableAbbreviation).toBeUndefined()
  })

  it("should load config with URL spec", async () => {
    // Setup mocks before importing the module
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "https://api.example.com/openapi.json",
          headers: "Authorization:Bearer token",
          name: "test-server",
          "server-version": "1.2.3",
          transport: "stdio",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    // Import the module after setting up mocks
    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config).toEqual({
      name: "test-server",
      version: "1.2.3",
      apiBaseUrl: "https://api.example.com",
      openApiSpec: "https://api.example.com/openapi.json",
      specInputMethod: "url",
      inlineSpecContent: undefined,
      headers: {
        Authorization: "Bearer token",
      },
      transportType: "stdio",
      httpPort: 3000,
      httpHost: "127.0.0.1",
      endpointPath: "/mcp",
      includeTools: undefined,
      includeTags: undefined,
      includeResources: undefined,
      includeOperations: undefined,
      toolsMode: "all",
      disableAbbreviation: undefined,
    })
  })

  it("should load config with local file spec", async () => {
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config.specInputMethod).toBe("file")
    expect(config.openApiSpec).toBe("./spec.json")
  })

  it("should load config with stdin spec", async () => {
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "spec-from-stdin": true,
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config.specInputMethod).toBe("stdin")
    expect(config.openApiSpec).toBe("stdin")
  })

  it("should load config with inline spec", async () => {
    const inlineSpec =
      '{"openapi": "3.0.0", "info": {"title": "Test", "version": "1.0.0"}, "paths": {}}'

    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "spec-inline": inlineSpec,
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config.specInputMethod).toBe("inline")
    expect(config.openApiSpec).toBe("inline")
    expect(config.inlineSpecContent).toBe(inlineSpec)
  })

  it("should load config with environment variables for stdin", async () => {
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({}),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    process.env.API_BASE_URL = "https://env.example.com"
    process.env.OPENAPI_SPEC_FROM_STDIN = "true"

    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config.specInputMethod).toBe("stdin")
    expect(config.openApiSpec).toBe("stdin")
  })

  it("should load config with environment variables for inline spec", async () => {
    const inlineSpec = '{"openapi": "3.0.0"}'

    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({}),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    process.env.API_BASE_URL = "https://env.example.com"
    process.env.OPENAPI_SPEC_INLINE = inlineSpec

    const { loadConfig } = await import("../src/config")

    const config = loadConfig()
    expect(config.specInputMethod).toBe("inline")
    expect(config.inlineSpecContent).toBe(inlineSpec)
  })

  it("should throw error if no spec input method is provided", async () => {
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    const { loadConfig } = await import("../src/config")

    expect(() => loadConfig()).toThrow(
      "OpenAPI spec is required. Use one of: --openapi-spec, --spec-from-stdin, or --spec-inline",
    )
  })

  it("should throw error if multiple spec input methods are provided", async () => {
    vi.doMock("yargs", () => ({
      default: vi.fn().mockReturnValue({
        option: vi.fn().mockReturnThis(),
        help: vi.fn().mockReturnThis(),
        parseSync: vi.fn().mockReturnValue({
          "api-base-url": "https://api.example.com",
          "openapi-spec": "./spec.json",
          "spec-from-stdin": true,
        }),
      }),
    }))

    vi.doMock("yargs/helpers", () => ({
      hideBin: vi.fn((arr) => arr),
    }))

    const { loadConfig } = await import("../src/config")

    expect(() => loadConfig()).toThrow(
      "Only one OpenAPI spec input method can be specified at a time",
    )
  })
})
