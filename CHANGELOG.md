# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-01-29

### Fixed
- Removed debug console.error statements from onboarding tools

## [1.1.1] - 2025-01-29

### Fixed
- Forum tags emoji handling for unicode emojis

## [1.1.0] - 2025-01-29

### Added

#### New Tools
- `discord_leave_guild` - Leave a server (with confirmation)
- `discord_move_member` - Move member to a different voice channel
- `discord_get_welcome_screen` - Get welcome screen configuration
- `discord_edit_welcome_screen` - Edit welcome screen (description, channels, emojis)
- `discord_get_onboarding` - Get onboarding configuration
- `discord_edit_onboarding` - Edit existing onboarding settings
- `discord_setup_onboarding` - Setup onboarding from scratch (prompts, default channels, roles)
- `discord_get_community_settings` - View community settings (rules channel, features, etc.)
- `discord_setup_community` - Configure community channels (rules, updates, safety alerts)
- `discord_list_automod_rules` - List auto moderation rules
- `discord_get_automod_rule` - Get details of an auto mod rule
- `discord_create_automod_rule` - Create auto moderation rule
- `discord_edit_automod_rule` - Edit auto moderation rule
- `discord_delete_automod_rule` - Delete auto moderation rule

#### Forum Channel Support
- New channel type `forum` in `discord_create_channel`
- `default_reaction_emoji` - Set default emoji for forum posts
- `default_sort_order` - Set sort order (latest_activity, creation_date)
- `default_forum_layout` - Set layout (not_set, list_view, gallery_view)
- `available_tags` - Create and manage forum tags with emojis and moderation settings
- `discord_get_channel` now returns forum-specific fields (tags, layout, etc.)

#### Other Improvements
- `HOST` environment variable for HTTP transport (use `0.0.0.0` for remote access)
- `.env` file support via dotenv

### Changed
- **Major refactor**: Split monolithic `index.ts` (4000+ lines) into modular architecture
  - `src/schemas/` - Zod schemas organized by domain
  - `src/tools/` - Tool implementations organized by domain
  - `src/server.ts` - McpServer singleton
- Improved tool descriptions with clearer warnings about destructive operations

### Fixed
- Welcome screen emoji now correctly passes unicode strings (was sending object)
- Onboarding options now use `roles`/`channels` instead of `roleIds`/`channelIds`
- Added validation for onboarding options requiring at least one role or channel

## [1.0.8] - 2025-01-28

### Changed
- Modified server host configuration for HTTP transport

## [1.0.6] - 2025-01-28

### Added
- `discord_move_member` - Move member to a different voice channel
- Schema for move member operation

## [1.0.5] - 2025-01-28

### Added
- `discord_leave_guild` - Leave a server with safety confirmation

### Changed
- Updated package metadata

## [1.0.4] - 2025-01-27

### Added
- GitHub Actions CI workflow for Node.js

## [1.0.3] - 2025-01-27

### Added
- `discord_timeout_member` - Timeout/mute a member (up to 28 days)

## [1.0.2] - 2025-01-27

### Added
- `discord_list_bans` - List all banned users
- `discord_prune_members` - Remove inactive members with dry-run option

## [1.0.1] - 2025-01-27

### Added
- `discord_get_audit_log` - View audit log entries
- `discord_list_stickers` - List custom stickers
- `discord_delete_sticker` - Delete a custom sticker

## [1.0.0] - 2025-01-27

### Added
- Initial release

#### Guild/Server Management
- `discord_list_guilds` - List all servers the bot has access to
- `discord_get_guild` - Get detailed info about a specific server
- `discord_edit_guild` - Edit server settings

#### Channel Management
- `discord_list_channels` - List channels in a server
- `discord_get_channel` - Get channel details
- `discord_create_channel` - Create text/voice channels and categories
- `discord_edit_channel` - Edit channel properties
- `discord_delete_channel` - Delete a channel

#### Permission Management
- `discord_set_channel_permissions` - Set permission overrides
- `discord_remove_channel_permissions` - Remove permission overrides
- `discord_get_channel_permissions` - View permission overrides
- `discord_sync_channel_permissions` - Sync with parent category

#### Message Operations
- `discord_send_message` - Send messages
- `discord_get_messages` - Retrieve messages with pagination
- `discord_edit_message` - Edit bot's messages
- `discord_delete_message` - Delete messages
- `discord_add_reaction` - Add emoji reactions
- `discord_remove_reaction` - Remove reactions
- `discord_pin_message` - Pin a message
- `discord_unpin_message` - Unpin a message
- `discord_get_pinned_messages` - Get pinned messages

#### Member Management
- `discord_list_members` - List server members
- `discord_get_member` - Get member details
- `discord_kick_member` - Kick a member
- `discord_ban_member` - Ban a member
- `discord_unban_member` - Unban a user
- `discord_set_nickname` - Set/clear nickname

#### Role Management
- `discord_list_roles` - List all roles
- `discord_create_role` - Create a role
- `discord_edit_role` - Edit role properties
- `discord_delete_role` - Delete a role
- `discord_add_role` - Assign role to member
- `discord_remove_role` - Remove role from member
- `discord_set_role_positions` - Reorder role hierarchy

#### Emoji Management
- `discord_list_emojis` - List custom emojis
- `discord_create_emoji` - Create emoji from URL
- `discord_delete_emoji` - Delete a custom emoji

#### Invite Management
- `discord_list_invites` - List active invites
- `discord_create_invite` - Create invite
- `discord_delete_invite` - Delete an invite

#### Webhook Management
- `discord_list_webhooks` - List webhooks
- `discord_create_webhook` - Create a webhook
- `discord_edit_webhook` - Edit webhook
- `discord_delete_webhook` - Delete a webhook

#### Scheduled Events
- `discord_list_events` - List scheduled events
- `discord_create_event` - Create a scheduled event
- `discord_delete_event` - Delete a scheduled event
