# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run the server (requires DISCORD_BOT_TOKEN env var)
DISCORD_BOT_TOKEN=your_token npm start

# Development mode - watch for changes
npm run dev

# Run with HTTP transport instead of stdio
DISCORD_BOT_TOKEN=your_token TRANSPORT=http PORT=3000 npm start
```

## Architecture Overview

This is an MCP (Model Context Protocol) server that enables LLMs to control Discord servers via a bot token. It uses the `@modelcontextprotocol/sdk` for MCP implementation and `discord.js` for Discord API interactions.

### Source Structure

- **src/index.ts** - Main entry point. Registers all MCP tools and handles server startup (stdio or HTTP transport). Each tool is defined with `server.registerTool()` containing name, description, input schema, and handler function.

- **src/services/discord.ts** - Discord client management and data formatting utilities. Contains:
  - `getClient()` / `initializeClient()` - Singleton Discord.js client initialization with required gateway intents
  - Format functions (`formatGuild`, `formatChannel`, `formatMember`, etc.) - Convert Discord.js objects to typed response objects
  - Markdown formatters (`guildToMarkdown`, `channelToMarkdown`, etc.) - Format data for human-readable output
  - `formatResponse()` - Handles JSON vs markdown output based on `response_format` parameter

- **src/schemas/index.ts** - Zod schemas for input validation. Common patterns:
  - ID schemas (snowflake validation): `GuildIdSchema`, `ChannelIdSchema`, `UserIdSchema`, etc.
  - `ResponseFormatSchema` - Enum for 'json' | 'markdown' output
  - Each tool has a corresponding schema and exported type (e.g., `SendMessageSchema` / `SendMessageInput`)

- **src/types.ts** - TypeScript interfaces for Discord entities (`DiscordChannel`, `DiscordGuild`, `DiscordMember`, etc.)

- **src/constants.ts** - Shared constants (`CHARACTER_LIMIT`, `DEFAULT_LIMIT`, `MAX_MESSAGE_LENGTH`)

### Key Patterns

- All tools support `response_format` parameter ('json' or 'markdown') for output flexibility
- Discord IDs (snowflakes) are validated as 17-20 digit numeric strings
- Destructive operations (`delete`, `kick`, `ban`) are marked with `destructiveHint: true` in tool annotations
- Output is truncated at 50,000 characters via `truncateIfNeeded()`
- The Discord client uses lazy initialization - first tool call initializes the connection

### Environment Variables

- `DISCORD_BOT_TOKEN` (required) - Discord bot token
- `TRANSPORT` - 'stdio' (default) or 'http'
- `PORT` - HTTP server port when using http transport (default: 3000)

### Required Discord Bot Permissions

The bot needs these privileged gateway intents enabled:
- Server Members Intent
- Message Content Intent

And these bot permissions depending on tool usage:
- Manage Channels, Manage Roles, Kick Members, Ban Members, Manage Messages, Read Message History, Send Messages, Add Reactions, Manage Nicknames
