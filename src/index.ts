#!/usr/bin/env node
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { createServer } from "./server.js";
import { MAX_MESSAGE_UPLOAD_BASE64_LENGTH, MAX_PROFILE_IMAGE_BASE64_LENGTH } from "./constants.js";

async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Discord MCP server running on stdio");
}

async function runHTTP(): Promise<void> {
  const app = express();
  const maxEncodedUpload = Math.max(MAX_MESSAGE_UPLOAD_BASE64_LENGTH, 2 * MAX_PROFILE_IMAGE_BASE64_LENGTH);
  app.use(express.json({ limit: maxEncodedUpload + 512 * 1024 }));

  app.post("/mcp", async (req, res, next) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => void server.close());
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      next(error);
    }
  });

  const port = parseInt(process.env.PORT || "3000");
  const host = process.env.HOST || "localhost";
  app.listen(port, host, () => {
    console.error(`Discord MCP server running on http://${host}:${port}/mcp`);
  });
}

// Choose transport based on environment
const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
