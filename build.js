import * as esbuild from "esbuild";

console.log('Building Beatport MCP Server...');
// Build multiple entry points
const builds = [
  {
    entryPoints: ["./src/index.ts"],
    outfile: "./dist/index.js",
  },
  {
    entryPoints: ["./src/beatport-cli.ts"],
    outfile: "./dist/beatport-cli.js",
  },
];

for (const build of builds) {
  await esbuild.build({
    ...build,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    external: [
      "@modelcontextprotocol/sdk",
      "@modelcontextprotocol/sdk/server/index.js",
      "@modelcontextprotocol/sdk/server/stdio.js",
      "@modelcontextprotocol/sdk/server/transport.js",
      "@modelcontextprotocol/sdk/types.js",
      "@modelcontextprotocol/sdk/shared/transport.js",
      "@ivotoby/openapi-mcp-server",
    ],
    banner: {
      js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
    },
  });
}
