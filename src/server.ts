import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Initialize MCP Server as a singleton
export const server = new McpServer({
  name: "discord-mcp-server",
  version: "1.0.0",
});
