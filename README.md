# Beatport MCP Server

_Please note; this is still a work in progress!!_

An MCP (Model Context Protocol) server that provides access to the Beatport API for music discovery and data retrieval.

## Features

- **Easy Authentication**: Simple username/password authentication
- **Full Beatport API**: Access to tracks, artists, labels, releases, charts, and more
- **Flexible Transport**: Supports both stdio and HTTP transports
- **Built on OpenAPI**: Leverages the official Beatport OpenAPI specification

## Installation

```bash
npm install -g @ivotoby/beatport-mcp-server
```

## Authentication

⚠️ **Important**: Beatport's API requires OAuth2 credentials that aren't publicly available. You have three options:

### Option 1: Manual Token (Recommended)

1. **Get your token**:

```bash
node get-token.js  # Shows detailed instructions
```

2. **Set the token**:

```bash
export BEATPORT_ACCESS_TOKEN="your_token_here"
beatport-mcp-server
```

### Option 2: Username/Password (Won't work currently)

```bash
export BEATPORT_USERNAME="your@email.com"
export BEATPORT_PASSWORD="yourpassword"
beatport-mcp-server
```

### Option 3: Contact Beatport

Email `engineering@beatport.com` to request OAuth2 credentials for "Beatport MCP Server"

### HTTP Transport

```bash
beatport-mcp-server --transport http --port 3000
```

## Configuration Options

- `--username, -u`: Beatport username/email (or `BEATPORT_USERNAME`)
- `--password, -p`: Beatport password (or `BEATPORT_PASSWORD`)
- `--transport, -t`: Transport type: `stdio` (default) or `http`
- `--accessToken, -a`: Bearer token (or `BEATPORT_ACCESS_TOKEN`)
- `--refreshToken, -r`: Refresh token (or `BEATPORT_REFRESH_TOKEN`)
- `--port`: HTTP port (default: 3000, for HTTP transport)
- `--host`: HTTP host (default: 127.0.0.1, for HTTP transport)
- `--path`: HTTP endpoint path (default: /mcp, for HTTP transport)
- `--name, -n`: Server name (default: beatport-mcp-server)
- `--version, -v`: Server version (default: 1.0.0)
- `--tools`: Tools mode: `all` (default) or `dynamic`
- `--tool`: Import only specified tool IDs or names
- `--tag`: Import only tools with specified OpenAPI tags
- `--resource`: Import only tools under specified resource path prefixes
- `--operation`: Import only tools for specified HTTP methods
- `--disable-abbreviation`: Disable tool name optimization

## Available Tools

The server automatically generates MCP tools from the Beatport API endpoints:

### Catalog

- `catalog-artists-list`: Search and list artists
- `catalog-artists-retrieve`: Get artist details
- `catalog-tracks-list`: Search and list tracks
- `catalog-releases-list`: Search and list releases
- `catalog-labels-list`: Search and list labels
- `catalog-genres-list`: List music genres

### Charts & Playlists

- `catalog-charts-list`: Browse charts
- `catalog-playlists-list`: Browse playlists

### Search & Discovery

- Filter by genre, label, artist, BPM, key, release date
- Pagination support
- Detailed metadata for tracks and releases

## Example Usage in Claude

Once connected to Claude Desktop, you can use commands like:

```
Search for tech house tracks released in 2024
Find all releases on Drumcode label
Get details for artist "Charlotte de Witte"
List top 10 tracks in the Techno chart
Find tracks with BPM between 120-130
```

## Authentication Notes

- Uses Beatport's OAuth2 Resource Owner Password Credentials flow
- Requires a valid Beatport account
- Tokens are automatically managed and refreshed
- No need to handle Beatport client credentials (handled internally)

## Development

```bash
git clone https://github.com/ivo-toby/beatport-mcp-server
cd beatport-mcp-server
npm install
npm run build
npm run start
```

## License

MIT License - see LICENSE file for details.

## Contributing

Issues and pull requests welcome! This project builds on the `@ivotoby/openapi-mcp-server` package.
