# Discord MCP Server

An MCP (Model Context Protocol) server that enables LLMs to control Discord servers via a bot token. This server provides comprehensive Discord management tools including sending messages, managing members, roles, channels, permissions, and more.

## Features

### Guild/Server Management
- `discord_list_guilds` - List all servers the bot has access to
- `discord_get_guild` - Get detailed info about a specific server
- `discord_edit_guild` - Edit server settings (name, verification level, system channels, etc.)
- `discord_leave_guild` - Leave a server

### Channel Management
- `discord_list_channels` - List channels in a server (filter by type)
- `discord_get_channel` - Get channel details (includes forum tags for forum channels)
- `discord_create_channel` - Create text/voice/forum channels and categories
- `discord_edit_channel` - Edit channel name, topic, position, category, forum tags, and more
- `discord_delete_channel` - Delete a channel or category

### Forum Channel Features
- Create forum channels with `type: "forum"`
- Set default reaction emoji, sort order, and layout
- Manage forum tags (create, edit, delete)
- Tags support custom emojis and moderation settings

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
- `discord_move_member` - Move member to a different voice channel
- `discord_timeout_member` - Timeout/mute a member (up to 28 days)

### Role Management
- `discord_list_roles` - List all server roles
- `discord_create_role` - Create a new role
- `discord_edit_role` - Edit role name, color, permissions, and settings
- `discord_delete_role` - Delete a role
- `discord_add_role` - Assign role to member
- `discord_remove_role` - Remove role from member
- `discord_set_role_positions` - Reorder role hierarchy

### Server Administration
- `discord_list_bans` - List all banned users
- `discord_prune_members` - Remove inactive members (with dry-run option)
- `discord_get_audit_log` - View audit log entries

### Community Features
- `discord_get_community_settings` - View community settings (rules channel, features, etc.)
- `discord_setup_community` - Configure community channels (rules, updates, safety alerts)

### Welcome Screen
- `discord_get_welcome_screen` - Get welcome screen configuration
- `discord_edit_welcome_screen` - Edit welcome screen (description, channels, emojis)

### Onboarding
- `discord_get_onboarding` - Get onboarding configuration
- `discord_edit_onboarding` - Edit existing onboarding settings
- `discord_setup_onboarding` - Setup onboarding from scratch (prompts, default channels, roles)

### Auto Moderation
- `discord_list_automod_rules` - List auto moderation rules
- `discord_get_automod_rule` - Get details of an auto mod rule
- `discord_create_automod_rule` - Create auto moderation rule
- `discord_edit_automod_rule` - Edit auto moderation rule
- `discord_delete_automod_rule` - Delete auto moderation rule

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

1. Go to OAuth2 -> URL Generator
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
npm install -g @mahesvara/discord-mcpserver
```

**Option B: Run directly with npx (no install required)**

```bash
npx @mahesvara/discord-mcpserver
```

## Usage

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop or Claude Code):

**Using globally installed package:**

```json
{
  "mcpServers": {
    "discord": {
      "command": "discord-mcpserver",
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
      "args": ["-y", "@mahesvara/discord-mcpserver"],
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
HOST=localhost
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token (required) | - |
| `TRANSPORT` | Transport mode: `stdio` or `http` | `stdio` |
| `PORT` | HTTP server port (when using http transport) | `3000` |
| `HOST` | HTTP server host (use `0.0.0.0` for remote access) | `localhost` |

### HTTP Transport

For remote access, run the server with HTTP transport enabled:

**Linux/macOS:**
```bash
DISCORD_BOT_TOKEN=your_token TRANSPORT=http PORT=3000 HOST=0.0.0.0 discord-mcpserver
```

**Windows (Command Prompt):**
```cmd
set DISCORD_BOT_TOKEN=your_token && set TRANSPORT=http && set PORT=3000 && set HOST=0.0.0.0 && discord-mcpserver
```

**Windows (PowerShell):**
```powershell
$env:DISCORD_BOT_TOKEN="your_token"; $env:TRANSPORT="http"; $env:PORT="3000"; $env:HOST="0.0.0.0"; discord-mcpserver
```

**Or use a `.env` file** (works on all platforms):
```bash
discord-mcpserver
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

### Create a Forum Channel with Tags

```json
{
  "tool": "discord_create_channel",
  "params": {
    "guild_id": "1234567890123456789",
    "name": "help-forum",
    "type": "forum",
    "topic": "Ask questions and get help",
    "default_reaction_emoji": "✅",
    "default_sort_order": "latest_activity",
    "default_forum_layout": "list_view",
    "available_tags": [
      { "name": "Solved", "emoji_name": "✅", "moderated": false },
      { "name": "Bug", "emoji_name": "🐛", "moderated": false },
      { "name": "Question", "emoji_name": "❓", "moderated": false },
      { "name": "Announcement", "emoji_name": "📢", "moderated": true }
    ]
  }
}
```

### Setup Server Onboarding

```json
{
  "tool": "discord_setup_onboarding",
  "params": {
    "guild_id": "1234567890123456789",
    "default_channel_ids": ["1111111111111111111"],
    "prompts": [
      {
        "type": "multiple_choice",
        "title": "What are you interested in?",
        "single_select": false,
        "required": true,
        "options": [
          { "title": "Gaming", "emoji_name": "🎮", "role_ids": ["2222222222222222222"] },
          { "title": "Tech", "emoji_name": "💻", "role_ids": ["3333333333333333333"] }
        ]
      }
    ]
  }
}
```

### Configure Community Settings

```json
{
  "tool": "discord_setup_community",
  "params": {
    "guild_id": "1234567890123456789",
    "rules_channel_id": "1111111111111111111",
    "public_updates_channel_id": "2222222222222222222",
    "description": "A friendly gaming community",
    "preferred_locale": "en-US"
  }
}
```

### Edit Welcome Screen

```json
{
  "tool": "discord_edit_welcome_screen",
  "params": {
    "guild_id": "1234567890123456789",
    "enabled": true,
    "description": "Welcome to our server!",
    "welcome_channels": [
      { "channel_id": "1111111111111111111", "description": "Read the rules", "emoji_name": "📜" },
      { "channel_id": "2222222222222222222", "description": "Introduce yourself", "emoji_name": "👋" }
    ]
  }
}
```

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
| Community/Onboarding | Manage Guild |

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
