# Discord MCP Server

An MCP (Model Context Protocol) server that enables LLMs to control Discord servers via a bot token. This server provides comprehensive Discord management tools including sending messages, managing members, roles, channels, permissions, and more.

## Features

### Guild/Server Management
- `discord_list_guilds` - List all servers the bot has access to
- `discord_get_guild` - Get detailed info about a specific server

### Channel Management
- `discord_list_channels` - List channels in a server (filter by type)
- `discord_get_channel` - Get channel details
- `discord_create_channel` - Create text/voice channels **and categories**
- `discord_edit_channel` - Edit channel name, topic, position, category, and more
- `discord_delete_channel` - Delete a channel or category

### Permission Management
- `discord_set_channel_permissions` - Set permission overrides for roles/members on channels
- `discord_remove_channel_permissions` - Remove permission overrides
- `discord_get_channel_permissions` - View all permission overrides on a channel
- `discord_sync_channel_permissions` - Sync channel permissions with parent category

### Message Operations
- `discord_send_message` - Send messages (with optional reply)
- `discord_get_messages` - Retrieve channel messages (with pagination)
- `discord_edit_message` - Edit bot's messages
- `discord_delete_message` - Delete messages
- `discord_add_reaction` - Add emoji reactions
- `discord_remove_reaction` - Remove bot's reactions
- `discord_pin_message` - Pin a message
- `discord_unpin_message` - Unpin a message
- `discord_get_pinned_messages` - Get all pinned messages

### Member Management
- `discord_list_members` - List server members (with pagination)
- `discord_get_member` - Get member details
- `discord_kick_member` - Kick a member
- `discord_ban_member` - Ban a member (with message deletion option)
- `discord_unban_member` - Unban a user
- `discord_set_nickname` - Set/clear member nickname

### Role Management
- `discord_list_roles` - List all server roles
- `discord_create_role` - Create a new role
- `discord_edit_role` - Edit role name, color, permissions, and settings
- `discord_delete_role` - Delete a role
- `discord_add_role` - Assign role to member
- `discord_remove_role` - Remove role from member
- `discord_set_role_positions` - Reorder role hierarchy

### Server Administration
- `discord_edit_guild` - Edit server settings (name, verification level, system channels, etc.)
- `discord_timeout_member` - Timeout/mute a member (up to 28 days)
- `discord_list_bans` - List all banned users
- `discord_prune_members` - Remove inactive members (with dry-run option)
- `discord_get_audit_log` - View audit log entries

### Emoji Management
- `discord_list_emojis` - List custom emojis
- `discord_create_emoji` - Create emoji from image URL
- `discord_delete_emoji` - Delete a custom emoji

### Sticker Management
- `discord_list_stickers` - List custom stickers
- `discord_delete_sticker` - Delete a custom sticker

### Invite Management
- `discord_list_invites` - List active invites
- `discord_create_invite` - Create channel invite
- `discord_delete_invite` - Delete an invite

### Webhook Management
- `discord_list_webhooks` - List webhooks (guild or channel)
- `discord_create_webhook` - Create a webhook
- `discord_edit_webhook` - Edit webhook name or channel
- `discord_delete_webhook` - Delete a webhook

### Scheduled Events
- `discord_list_events` - List scheduled events
- `discord_create_event` - Create a scheduled event (stage, voice, or external)
- `discord_delete_event` - Delete a scheduled event

## Setup

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token (keep this secret!)
5. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent

### 2. Invite the Bot to Your Server

1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions (choose based on features you need):

   **Core Permissions:**
   - Manage Channels
   - Manage Roles
   - Manage Messages
   - Read Message History
   - Send Messages
   - Add Reactions

   **Member Management:**
   - Kick Members
   - Ban Members
   - Manage Nicknames
   - Moderate Members (for timeouts)

   **Server Administration:**
   - Manage Guild (for server settings)
   - View Audit Log
   - Manage Emojis and Stickers
   - Manage Webhooks
   - Manage Events
   - Create Instant Invite

4. Copy the generated URL and open it to invite the bot

### 3. Install the MCP Server

**Option A: Install globally from npm**

```bash
npm install -g @mahesvara/discord-mcp-server
```

**Option B: Run directly with npx (no install required)**

```bash
npx @mahesvara/discord-mcp-server
```

## Usage

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop or Claude Code):

**Using globally installed package:**

```json
{
  "mcpServers": {
    "discord": {
      "command": "discord-mcp-server",
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

**Using npx (no install required):**

```json
{
  "mcpServers": {
    "discord": {
      "command": "npx",
      "args": ["-y", "@mahesvara/discord-mcp-server"],
      "env": {
        "DISCORD_BOT_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

### Environment Variables

The server supports loading environment variables from a `.env` file in the current directory:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
TRANSPORT=http
PORT=3000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token (required) | - |
| `TRANSPORT` | Transport mode: `stdio` or `http` | `stdio` |
| `PORT` | HTTP server port (when using http transport) | `3000` |

### HTTP Transport

For remote access, run the server with HTTP transport enabled:

**Linux/macOS:**
```bash
DISCORD_BOT_TOKEN=your_token TRANSPORT=http PORT=3000 discord-mcp-server
```

**Windows (Command Prompt):**
```cmd
set DISCORD_BOT_TOKEN=your_token && set TRANSPORT=http && set PORT=3000 && discord-mcp-server
```

**Windows (PowerShell):**
```powershell
$env:DISCORD_BOT_TOKEN="your_token"; $env:TRANSPORT="http"; $env:PORT="3000"; discord-mcp-server
```

**Or use a `.env` file** (works on all platforms):
```bash
discord-mcp-server
```

Then configure your MCP client to connect via HTTP:

```json
{
  "mcpServers": {
    "discord": {
      "type": "http",
      "url": "http://your-server-ip:3000/mcp"
    }
  }
}
```

## Tool Examples

### Create a Category

```json
{
  "tool": "discord_create_channel",
  "params": {
    "guild_id": "1234567890123456789",
    "name": "Bot Testing",
    "type": "category"
  }
}
```

### Create a Channel in a Category

```json
{
  "tool": "discord_create_channel",
  "params": {
    "guild_id": "1234567890123456789",
    "name": "bot-commands",
    "type": "text",
    "topic": "Channel for bot interactions",
    "parent_id": "CATEGORY_ID_HERE"
  }
}
```

### Set Channel Permissions

```json
{
  "tool": "discord_set_channel_permissions",
  "params": {
    "channel_id": "1234567890123456789",
    "target_id": "ROLE_ID_HERE",
    "target_type": "role",
    "allow": ["ViewChannel", "SendMessages", "ReadMessageHistory"],
    "deny": ["CreatePublicThreads"]
  }
}
```

### Common Permission Names

**View & Access:**
- `ViewChannel` - See the channel

**Messages:**
- `SendMessages`, `ReadMessageHistory`, `ManageMessages`
- `EmbedLinks`, `AttachFiles`, `AddReactions`
- `UseExternalEmojis`, `UseExternalStickers`
- `MentionEveryone`

**Threads:**
- `CreatePublicThreads`, `CreatePrivateThreads`
- `SendMessagesInThreads`, `ManageThreads`

**Voice:**
- `Connect`, `Speak`, `Stream`
- `MuteMembers`, `DeafenMembers`, `MoveMembers`
- `UseVAD`, `PrioritySpeaker`

**Management:**
- `ManageChannels`, `ManageRoles`, `ManageWebhooks`

### Send a Message

```json
{
  "tool": "discord_send_message",
  "params": {
    "channel_id": "1234567890123456789",
    "content": "Hello from the MCP server!"
  }
}
```

### Assign a Role

```json
{
  "tool": "discord_add_role",
  "params": {
    "guild_id": "1234567890123456789",
    "user_id": "9876543210987654321",
    "role_id": "1111111111111111111"
  }
}
```

## Response Formats

Most read operations support two response formats:

- **json** (default): Structured data for programmatic processing
- **markdown**: Human-readable formatted output

## Error Handling

All tools return clear error messages with suggestions when operations fail:

- Missing permissions
- Invalid IDs (guild, channel, user, role, message)
- Rate limiting
- Network issues

## Security Notes

- **Never commit your bot token** - use environment variables
- The bot can only operate in servers it's been invited to
- Destructive operations (delete, kick, ban) are marked with `destructiveHint: true`
- All inputs are validated with Zod schemas

## Required Bot Permissions

Depending on which tools you use, your bot needs these permissions:

| Tool Category | Required Permissions |
|--------------|---------------------|
| Messages | Send Messages, Read Message History, Manage Messages |
| Channels | Manage Channels |
| Permissions | Manage Roles (for channel permission overrides) |
| Members | Kick Members, Ban Members, Manage Nicknames, Moderate Members |
| Roles | Manage Roles |
| Reactions | Add Reactions |
| Server Settings | Manage Guild |
| Emojis/Stickers | Manage Emojis and Stickers |
| Invites | Create Instant Invite, Manage Guild |
| Webhooks | Manage Webhooks |
| Events | Manage Events |
| Audit Log | View Audit Log |

## Tool Examples

### Edit Role Permissions

```json
{
  "tool": "discord_edit_role",
  "params": {
    "guild_id": "1234567890123456789",
    "role_id": "1111111111111111111",
    "name": "Moderators",
    "color": 3447003,
    "permissions": ["KickMembers", "BanMembers", "ManageMessages", "ModerateMembers"]
  }
}
```

### Reorder Role Hierarchy

```json
{
  "tool": "discord_set_role_positions",
  "params": {
    "guild_id": "1234567890123456789",
    "positions": [
      { "role_id": "1111111111111111111", "position": 5 },
      { "role_id": "2222222222222222222", "position": 4 }
    ]
  }
}
```

### Timeout a Member

```json
{
  "tool": "discord_timeout_member",
  "params": {
    "guild_id": "1234567890123456789",
    "user_id": "9876543210987654321",
    "duration_minutes": 60,
    "reason": "Spamming in chat"
  }
}
```

### Create an Invite

```json
{
  "tool": "discord_create_invite",
  "params": {
    "channel_id": "1234567890123456789",
    "max_age": 86400,
    "max_uses": 10,
    "temporary": false
  }
}
```

### Create a Scheduled Event

```json
{
  "tool": "discord_create_event",
  "params": {
    "guild_id": "1234567890123456789",
    "name": "Community Game Night",
    "description": "Join us for games!",
    "scheduled_start_time": "2024-12-01T20:00:00Z",
    "entity_type": "voice",
    "channel_id": "1111111111111111111"
  }
}
```

### Role Permission Names

When editing roles, use these permission names:

**General:**
- `Administrator` - Full access (use with caution)
- `ManageGuild`, `ManageRoles`, `ManageChannels`
- `KickMembers`, `BanMembers`, `ModerateMembers`
- `ViewAuditLog`, `ViewGuildInsights`

**Messages:**
- `SendMessages`, `ManageMessages`, `ReadMessageHistory`
- `EmbedLinks`, `AttachFiles`, `AddReactions`
- `MentionEveryone`, `UseExternalEmojis`

**Voice:**
- `Connect`, `Speak`, `Stream`
- `MuteMembers`, `DeafenMembers`, `MoveMembers`

**Other:**
- `ManageWebhooks`, `ManageEmojisAndStickers`
- `ManageEvents`, `CreateEvents`

## License

MIT
