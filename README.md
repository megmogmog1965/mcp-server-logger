# mcp-server-logger

A debugging wrapper for Model Context Protocol (MCP) servers that captures stdin/stdout/stderr and signals to a log file, allowing for easier troubleshooting and development of MCP integrations.

**Note:** This tool is designed to work only on macOS and Unix-based operating systems. Windows is not supported.

## How to build (for development)

```bash
npm install
npm run build
```

## How to run (command)

The mcp-server-logger can be run directly from the command line. It acts as a wrapper around any MCP server command, logging all stdin/stdout/stderr and signal activity to a specified log file.

```bash
npx mcp-server-logger "{log-file-path}" {command} {args...}
```

## How to run on Claude for Desktop

To use this server with Claude Desktop, you need to configure it in your Claude Desktop configuration file. This file is located at:

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

Example configuration:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "/{path-to-bin}/npx",
      "args": [
        "mcp-server-logger",
        "/{path-to-user-home}/mcp-server.log",
        "/{path-to-bin}/npx",
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "{path-to-user-home}/Desktop/"
      ]
    }
  }
}
```

This configuration registers an MCP server named "filesystem" that runs the MCP filesystem server through the debugger wrapper. The debugger captures all stdin/stdout/stderr and signals to a log file at the specified output path for easier troubleshooting and development.
