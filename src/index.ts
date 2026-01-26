#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { ChannelType, GuildChannel, Collection, GuildMember, Message, PermissionsBitField, OverwriteType, TextChannel, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, TextBasedChannel } from "discord.js";

import {
  getClient,
  formatGuild,
  formatChannel,
  formatMember,
  formatRole,
  formatMessage,
  formatResponse,
  getChannelType,
  guildToMarkdown,
  channelToMarkdown,
  memberToMarkdown,
  roleToMarkdown,
  messageToMarkdown,
  truncateIfNeeded,
} from "./services/discord.js";

import {
  ListGuildsSchema,
  GetGuildSchema,
  LeaveGuildSchema,
  ListChannelsSchema,
  GetChannelSchema,
  SendMessageSchema,
  GetMessagesSchema,
  DeleteMessageSchema,
  EditMessageSchema,
  ListMembersSchema,
  GetMemberSchema,
  ListRolesSchema,
  AddRoleSchema,
  RemoveRoleSchema,
  CreateChannelSchema,
  DeleteChannelSchema,
  EditChannelSchema,
  SetChannelPermissionsSchema,
  RemoveChannelPermissionsSchema,
  GetChannelPermissionsSchema,
  SyncChannelPermissionsSchema,
  KickMemberSchema,
  BanMemberSchema,
  UnbanMemberSchema,
  CreateRoleSchema,
  DeleteRoleSchema,
  EditRoleSchema,
  SetRolePositionsSchema,
  SetNicknameSchema,
  AddReactionSchema,
  RemoveReactionSchema,
  PinMessageSchema,
  UnpinMessageSchema,
  GetPinnedMessagesSchema,
  EditGuildSchema,
  TimeoutMemberSchema,
  ListEmojisSchema,
  CreateEmojiSchema,
  DeleteEmojiSchema,
  ListInvitesSchema,
  CreateInviteSchema,
  DeleteInviteSchema,
  ListWebhooksSchema,
  CreateWebhookSchema,
  DeleteWebhookSchema,
  EditWebhookSchema,
  GetAuditLogSchema,
  PruneMembersSchema,
  ListStickersSchema,
  DeleteStickerSchema,
  ListEventsSchema,
  CreateEventSchema,
  DeleteEventSchema,
  ListBansSchema,
  type ListGuildsInput,
  type GetGuildInput,
  type LeaveGuildInput,
  type ListChannelsInput,
  type GetChannelInput,
  type SendMessageInput,
  type GetMessagesInput,
  type DeleteMessageInput,
  type EditMessageInput,
  type ListMembersInput,
  type GetMemberInput,
  type ListRolesInput,
  type AddRoleInput,
  type RemoveRoleInput,
  type CreateChannelInput,
  type DeleteChannelInput,
  type EditChannelInput,
  type SetChannelPermissionsInput,
  type RemoveChannelPermissionsInput,
  type GetChannelPermissionsInput,
  type SyncChannelPermissionsInput,
  type KickMemberInput,
  type BanMemberInput,
  type UnbanMemberInput,
  type CreateRoleInput,
  type DeleteRoleInput,
  type EditRoleInput,
  type SetRolePositionsInput,
  type SetNicknameInput,
  type AddReactionInput,
  type RemoveReactionInput,
  type PinMessageInput,
  type UnpinMessageInput,
  type GetPinnedMessagesInput,
  type EditGuildInput,
  type TimeoutMemberInput,
  type ListEmojisInput,
  type CreateEmojiInput,
  type DeleteEmojiInput,
  type ListInvitesInput,
  type CreateInviteInput,
  type DeleteInviteInput,
  type ListWebhooksInput,
  type CreateWebhookInput,
  type DeleteWebhookInput,
  type EditWebhookInput,
  type GetAuditLogInput,
  type PruneMembersInput,
  type ListStickersInput,
  type DeleteStickerInput,
  type ListEventsInput,
  type CreateEventInput,
  type DeleteEventInput,
  type ListBansInput,
} from "./schemas/index.js";

import { ResponseFormat, DiscordMember, DiscordMessage } from "./types.js";

// Initialize MCP Server
const server = new McpServer({
  name: "discord-mcp-server",
  version: "1.0.0",
});

// ============================================================================
// GUILD TOOLS
// ============================================================================

server.registerTool(
  "discord_list_guilds",
  {
    title: "List Discord Servers",
    description: `List all Discord servers (guilds) the bot has access to.

Returns server names, IDs, member counts, and owner information.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of guilds with id, name, memberCount, icon, ownerId`,
    inputSchema: ListGuildsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListGuildsInput) => {
    try {
      const client = await getClient();
      const guilds = client.guilds.cache.map(formatGuild);

      const text = formatResponse(
        guilds,
        params.response_format,
        (items) => items.map(guildToMarkdown).join("\n\n")
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(text) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing guilds: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_get_guild",
  {
    title: "Get Discord Server Info",
    description: `Get detailed information about a specific Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Server details including name, member count, owner, and icon`,
    inputSchema: GetGuildSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetGuildInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}. Use discord_list_guilds to see available servers.` }],
        };
      }

      const formatted = formatGuild(guild);
      const text = formatResponse(formatted, params.response_format, guildToMarkdown);

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting guild: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_leave_guild",
  {
    title: "Leave Discord Server",
    description: `Leave a Discord server (guild). The bot will no longer have access to this server.

WARNING: This is a destructive action. The bot will need to be re-invited to rejoin.

Args:
  - guild_id (string): Discord server/guild ID to leave
  - confirm (boolean): Must be set to true to confirm leaving

Returns:
  Confirmation message with server details`,
    inputSchema: LeaveGuildSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: LeaveGuildInput) => {
    try {
      if (!params.confirm) {
        return {
          isError: true,
          content: [{ type: "text", text: "You must set 'confirm: true' to leave a server. This action cannot be undone - the bot will need to be re-invited to rejoin." }],
        };
      }

      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}. Use discord_list_guilds to see available servers.` }],
        };
      }

      const guildName = guild.name;
      const memberCount = guild.memberCount;
      const ownerId = guild.ownerId;

      await guild.leave();

      return {
        content: [{ type: "text", text: `Successfully left server "${guildName}" (ID: ${params.guild_id}, Members: ${memberCount}, Owner: ${ownerId}). The bot will need to be re-invited to rejoin.` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error leaving guild: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// CHANNEL TOOLS
// ============================================================================

server.registerTool(
  "discord_list_channels",
  {
    title: "List Discord Channels",
    description: `List channels in a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - type ('text' | 'voice' | 'category' | 'all'): Filter by channel type (default: 'all')
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of channels with id, name, type, topic, and category info`,
    inputSchema: ListChannelsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListChannelsInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      // Get all channels as array to avoid type predicate issues
      const allChannels = Array.from(guild.channels.cache.values());
      
      // Filter out threads and apply type filter
      let filteredChannels = allChannels.filter(c => !c.isThread());

      if (params.type !== "all") {
        const targetType = getChannelType(params.type);
        if (targetType !== null) {
          filteredChannels = filteredChannels.filter(c => c.type === targetType);
        }
      }

      const formatted = filteredChannels.map(c => formatChannel(c as GuildChannel));
      const text = formatResponse(
        formatted,
        params.response_format,
        (items) => items.map(channelToMarkdown).join("\n\n")
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(text) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing channels: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_get_channel",
  {
    title: "Get Discord Channel Info",
    description: `Get detailed information about a specific channel.

Args:
  - channel_id (string): Discord channel ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Channel details including name, type, topic, and category`,
    inputSchema: GetChannelSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetChannelInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !(channel instanceof GuildChannel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found: ${params.channel_id}` }],
        };
      }

      const formatted = formatChannel(channel as GuildChannel);
      const text = formatResponse(formatted, params.response_format, channelToMarkdown);

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting channel: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_create_channel",
  {
    title: "Create Discord Channel",
    description: `Create a new channel or category in a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Channel name
  - type ('text' | 'voice' | 'category'): Channel type (default: 'text')
  - topic (string, optional): Channel topic (text channels only)
  - parent_id (string, optional): Category ID to create channel under (not for categories)
  - nsfw (boolean, optional): Whether the channel is NSFW (text channels only)
  - bitrate (number, optional): Bitrate for voice channels (8000-384000)
  - user_limit (number, optional): User limit for voice channels (0 = unlimited)

Returns:
  The created channel's details`,
    inputSchema: CreateChannelSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: CreateChannelInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      let channelType: ChannelType;
      switch (params.type) {
        case "voice":
          channelType = ChannelType.GuildVoice;
          break;
        case "category":
          channelType = ChannelType.GuildCategory;
          break;
        default:
          channelType = ChannelType.GuildText;
      }

      const channelOptions: any = {
        name: params.name,
        type: channelType,
      };

      // Only add these for non-category channels
      if (params.type !== "category") {
        if (params.parent_id) channelOptions.parent = params.parent_id;
      }

      // Text channel specific options
      if (params.type === "text" || !params.type) {
        if (params.topic) channelOptions.topic = params.topic;
        if (params.nsfw !== undefined) channelOptions.nsfw = params.nsfw;
      }

      // Voice channel specific options
      if (params.type === "voice") {
        if (params.bitrate) channelOptions.bitrate = params.bitrate;
        if (params.user_limit !== undefined) channelOptions.userLimit = params.user_limit;
      }

      const channel = await guild.channels.create(channelOptions);

      const typeLabel = params.type === "category" ? "category" : "channel";
      const prefix = params.type === "category" ? "📁" : "#";
      
      return {
        content: [{ type: "text", text: `Created ${typeLabel} ${prefix}${channel.name} (ID: ${channel.id})` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating channel: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_channel",
  {
    title: "Delete Discord Channel",
    description: `Delete a channel from a Discord server. This action is permanent!

Args:
  - channel_id (string): Discord channel ID to delete

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteChannelSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: DeleteChannelInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('delete' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found: ${params.channel_id}` }],
        };
      }

      const name = 'name' in channel ? channel.name : params.channel_id;
      await channel.delete();

      return {
        content: [{ type: "text", text: `Deleted channel: ${name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting channel: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_edit_channel",
  {
    title: "Edit Discord Channel",
    description: `Edit a channel's properties including name, topic, category, position, and more.

Args:
  - channel_id (string): Discord channel ID
  - name (string, optional): New channel name
  - topic (string, optional): New channel topic
  - parent_id (string, optional): Move to a different category (or 'none' to remove from category)
  - position (number, optional): New position of the channel
  - nsfw (boolean, optional): Whether the channel is NSFW
  - bitrate (number, optional): Bitrate for voice channels (8000-384000)
  - user_limit (number, optional): User limit for voice channels

Returns:
  Updated channel details`,
    inputSchema: EditChannelSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: EditChannelInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('edit' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found: ${params.channel_id}` }],
        };
      }

      const updates: any = {};
      if (params.name) updates.name = params.name;
      if (params.topic !== undefined) updates.topic = params.topic;
      if (params.position !== undefined) updates.position = params.position;
      if (params.nsfw !== undefined) updates.nsfw = params.nsfw;
      if (params.bitrate !== undefined) updates.bitrate = params.bitrate;
      if (params.user_limit !== undefined) updates.userLimit = params.user_limit;
      if (params.parent_id !== undefined) {
        updates.parent = params.parent_id === 'none' ? null : params.parent_id;
      }

      await (channel as any).edit(updates);

      return {
        content: [{ type: "text", text: `Updated channel ${params.channel_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error editing channel: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// PERMISSION TOOLS
// ============================================================================

// Helper function to convert permission strings to bitfield
function parsePermissions(permissions: string[]): bigint {
  let bits = BigInt(0);
  for (const perm of permissions) {
    const flag = PermissionsBitField.Flags[perm as keyof typeof PermissionsBitField.Flags];
    if (flag) {
      bits |= flag;
    }
  }
  return bits;
}

// List of common permission names for reference
const PERMISSION_LIST = [
  'ViewChannel', 'ManageChannels', 'ManageRoles', 'CreateInstantInvite',
  'SendMessages', 'SendMessagesInThreads', 'CreatePublicThreads', 'CreatePrivateThreads',
  'EmbedLinks', 'AttachFiles', 'AddReactions', 'UseExternalEmojis', 'UseExternalStickers',
  'MentionEveryone', 'ManageMessages', 'ManageThreads', 'ReadMessageHistory',
  'SendTTSMessages', 'UseApplicationCommands',
  'Connect', 'Speak', 'Stream', 'UseEmbeddedActivities', 'UseSoundboard',
  'UseExternalSounds', 'UseVAD', 'PrioritySpeaker', 'MuteMembers', 'DeafenMembers', 'MoveMembers',
  'ManageEvents', 'ManageWebhooks'
];

server.registerTool(
  "discord_set_channel_permissions",
  {
    title: "Set Channel Permissions",
    description: `Set permission overrides for a role or member on a channel.

Common permission names:
- View: ViewChannel
- Messages: SendMessages, ReadMessageHistory, ManageMessages, EmbedLinks, AttachFiles, AddReactions
- Voice: Connect, Speak, Stream, MuteMembers, DeafenMembers, MoveMembers
- Threads: CreatePublicThreads, CreatePrivateThreads, SendMessagesInThreads
- Management: ManageChannels, ManageRoles, ManageWebhooks

Args:
  - channel_id (string): Discord channel ID
  - target_id (string): Role or User ID to set permissions for
  - target_type ('role' | 'member'): Whether target is a role or member
  - allow (string[], optional): Permissions to allow (e.g., ['ViewChannel', 'SendMessages'])
  - deny (string[], optional): Permissions to deny (e.g., ['SendMessages'])

Returns:
  Confirmation of permission changes`,
    inputSchema: SetChannelPermissionsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: SetChannelPermissionsInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('permissionOverwrites' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found or doesn't support permissions: ${params.channel_id}` }],
        };
      }

      const guildChannel = channel as GuildChannel;
      
      // Build permission overwrite object with individual permission keys
      const permissionOverwrite: Record<string, boolean | null> = {};
      
      // Set allowed permissions to true
      if (params.allow) {
        for (const perm of params.allow) {
          permissionOverwrite[perm] = true;
        }
      }
      
      // Set denied permissions to false
      if (params.deny) {
        for (const perm of params.deny) {
          permissionOverwrite[perm] = false;
        }
      }

      await guildChannel.permissionOverwrites.edit(params.target_id, permissionOverwrite, {
        type: params.target_type === 'role' ? OverwriteType.Role : OverwriteType.Member,
      });

      const allowList = params.allow?.join(', ') || 'none';
      const denyList = params.deny?.join(', ') || 'none';

      return {
        content: [{ type: "text", text: `Updated permissions for ${params.target_type} ${params.target_id} on channel ${params.channel_id}\nAllowed: ${allowList}\nDenied: ${denyList}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error setting permissions: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_remove_channel_permissions",
  {
    title: "Remove Channel Permission Overrides",
    description: `Remove all permission overrides for a role or member on a channel.

Args:
  - channel_id (string): Discord channel ID
  - target_id (string): Role or User ID to remove permission overrides for

Returns:
  Confirmation of removal`,
    inputSchema: RemoveChannelPermissionsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: RemoveChannelPermissionsInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('permissionOverwrites' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found or doesn't support permissions: ${params.channel_id}` }],
        };
      }

      const guildChannel = channel as GuildChannel;
      await guildChannel.permissionOverwrites.delete(params.target_id);

      return {
        content: [{ type: "text", text: `Removed permission overrides for ${params.target_id} on channel ${params.channel_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error removing permissions: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_get_channel_permissions",
  {
    title: "Get Channel Permissions",
    description: `Get all permission overrides for a channel.

Args:
  - channel_id (string): Discord channel ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of permission overrides with allow/deny for each role/member`,
    inputSchema: GetChannelPermissionsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetChannelPermissionsInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('permissionOverwrites' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found or doesn't support permissions: ${params.channel_id}` }],
        };
      }

      const guildChannel = channel as GuildChannel;
      const overwrites = guildChannel.permissionOverwrites.cache;

      const formatted = overwrites.map(ow => {
        const allowedPerms = new PermissionsBitField(ow.allow).toArray();
        const deniedPerms = new PermissionsBitField(ow.deny).toArray();
        return {
          id: ow.id,
          type: ow.type === OverwriteType.Role ? 'role' : 'member',
          allow: allowedPerms,
          deny: deniedPerms,
        };
      });

      if (params.response_format === 'json') {
        return {
          content: [{ type: "text", text: JSON.stringify(Array.from(formatted.values()), null, 2) }],
        };
      }

      // Markdown format
      const lines = Array.from(formatted.values()).map(ow => {
        const allowStr = ow.allow.length > 0 ? ow.allow.join(', ') : 'none';
        const denyStr = ow.deny.length > 0 ? ow.deny.join(', ') : 'none';
        return `### ${ow.type}: ${ow.id}\n- **Allow**: ${allowStr}\n- **Deny**: ${denyStr}`;
      });

      const text = lines.length > 0 ? lines.join('\n\n') : 'No permission overrides on this channel.';

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting permissions: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_sync_channel_permissions",
  {
    title: "Sync Channel Permissions with Category",
    description: `Sync a channel's permissions with its parent category.

Args:
  - channel_id (string): Discord channel ID

Returns:
  Confirmation of sync`,
    inputSchema: SyncChannelPermissionsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: SyncChannelPermissionsInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('lockPermissions' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found or doesn't support permission sync: ${params.channel_id}` }],
        };
      }

      await (channel as any).lockPermissions();

      return {
        content: [{ type: "text", text: `Synced permissions for channel ${params.channel_id} with its parent category` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error syncing permissions: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_send_message",
  {
    title: "Send Discord Message",
    description: `Send a message to a Discord channel.

Args:
  - channel_id (string): Discord channel ID
  - content (string): Message content (max 2000 characters)
  - reply_to (string, optional): Message ID to reply to

Returns:
  The sent message details including ID`,
    inputSchema: SendMessageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: SendMessageInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('send' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const options: any = { content: params.content };
      if (params.reply_to) {
        options.reply = { messageReference: params.reply_to };
      }

      const message = await (channel as any).send(options);

      return {
        content: [{ type: "text", text: `Message sent (ID: ${message.id})` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error sending message: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_get_messages",
  {
    title: "Get Discord Messages",
    description: `Retrieve messages from a Discord channel.

Args:
  - channel_id (string): Discord channel ID
  - limit (number): Number of messages to retrieve (1-100, default: 20)
  - before (string, optional): Get messages before this message ID
  - after (string, optional): Get messages after this message ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of messages with content, author, timestamp, attachments`,
    inputSchema: GetMessagesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetMessagesInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const options: any = { limit: params.limit };
      if (params.before) options.before = params.before;
      if (params.after) options.after = params.after;

      const messages = await (channel as any).messages.fetch(options);
      const formatted = messages.map((m: Message) => formatMessage(m));

      const text = formatResponse(
        Array.from(formatted.values()) as DiscordMessage[],
        params.response_format,
        (items: DiscordMessage[]) => items.map(messageToMarkdown).join("\n\n---\n\n")
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(text) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting messages: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_message",
  {
    title: "Delete Discord Message",
    description: `Delete a message from a Discord channel.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to delete

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteMessageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: DeleteMessageInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const message = await (channel as any).messages.fetch(params.message_id);
      await message.delete();

      return {
        content: [{ type: "text", text: `Deleted message ${params.message_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting message: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_edit_message",
  {
    title: "Edit Discord Message",
    description: `Edit a message sent by the bot.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to edit
  - content (string): New message content (max 2000 characters)

Returns:
  Confirmation of edit`,
    inputSchema: EditMessageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: EditMessageInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const message = await (channel as any).messages.fetch(params.message_id);
      await message.edit(params.content);

      return {
        content: [{ type: "text", text: `Edited message ${params.message_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error editing message: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_add_reaction",
  {
    title: "Add Reaction to Message",
    description: `Add an emoji reaction to a message.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to react to
  - emoji (string): Emoji to react with (e.g., '👍' or custom emoji format)

Returns:
  Confirmation of reaction added`,
    inputSchema: AddReactionSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: AddReactionInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const message = await (channel as any).messages.fetch(params.message_id);
      await message.react(params.emoji);

      return {
        content: [{ type: "text", text: `Added reaction ${params.emoji} to message ${params.message_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error adding reaction: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_remove_reaction",
  {
    title: "Remove Reaction from Message",
    description: `Remove the bot's emoji reaction from a message.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID
  - emoji (string): Emoji to remove

Returns:
  Confirmation of reaction removed`,
    inputSchema: RemoveReactionSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: RemoveReactionInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const message = await (channel as any).messages.fetch(params.message_id);
      const reaction = message.reactions.cache.get(params.emoji);
      if (reaction) {
        await reaction.users.remove(client.user!.id);
      }

      return {
        content: [{ type: "text", text: `Removed reaction ${params.emoji} from message ${params.message_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error removing reaction: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_pin_message",
  {
    title: "Pin Discord Message",
    description: `Pin a message in a channel.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to pin

Returns:
  Confirmation of message pinned`,
    inputSchema: PinMessageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: PinMessageInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const message = await (channel as any).messages.fetch(params.message_id);
      await message.pin();

      return {
        content: [{ type: "text", text: `Pinned message ${params.message_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error pinning message: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_unpin_message",
  {
    title: "Unpin Discord Message",
    description: `Unpin a message in a channel.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to unpin

Returns:
  Confirmation of message unpinned`,
    inputSchema: UnpinMessageSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: UnpinMessageInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const message = await (channel as any).messages.fetch(params.message_id);
      await message.unpin();

      return {
        content: [{ type: "text", text: `Unpinned message ${params.message_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error unpinning message: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_get_pinned_messages",
  {
    title: "Get Pinned Messages",
    description: `Get all pinned messages in a channel.

Args:
  - channel_id (string): Discord channel ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of pinned messages`,
    inputSchema: GetPinnedMessagesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetPinnedMessagesInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('messages' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
        };
      }

      const messages = await (channel as any).messages.fetchPinned();
      const formatted = messages.map((m: Message) => formatMessage(m));

      const text = formatResponse(
        Array.from(formatted.values()) as DiscordMessage[],
        params.response_format,
        (items: DiscordMessage[]) => items.length > 0 
          ? items.map(messageToMarkdown).join("\n\n---\n\n")
          : "No pinned messages in this channel."
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(text) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting pinned messages: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// MEMBER TOOLS
// ============================================================================

server.registerTool(
  "discord_list_members",
  {
    title: "List Discord Members",
    description: `List members in a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - limit (number): Maximum number of members (1-100, default: 20)
  - after (string, optional): Get members after this user ID (for pagination)
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of members with username, nickname, roles, join date`,
    inputSchema: ListMembersSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListMembersInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const options: { limit: number; after?: string } = { limit: params.limit };
      if (params.after) options.after = params.after;

      // The fetch API returns a Collection when given limit, use 'as unknown as' to handle the union type
      const membersResult = (await guild.members.fetch(options)) as unknown as Collection<string, GuildMember>;
      
      // Convert Collection to array
      const membersArray = Array.from(membersResult.values());
      const formatted = membersArray.map((m) => formatMember(m));

      const text = formatResponse(
        formatted,
        params.response_format,
        (items: DiscordMember[]) => items.map(memberToMarkdown).join("\n\n")
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(text) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing members: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_get_member",
  {
    title: "Get Discord Member",
    description: `Get detailed information about a specific member.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Member details including username, nickname, roles, join date`,
    inputSchema: GetMemberSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetMemberInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const member = await guild.members.fetch(params.user_id);
      const formatted = formatMember(member);
      const text = formatResponse(formatted, params.response_format, memberToMarkdown);

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting member: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_kick_member",
  {
    title: "Kick Discord Member",
    description: `Kick a member from a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to kick
  - reason (string, optional): Reason for kick (visible in audit log)

Returns:
  Confirmation of kick`,
    inputSchema: KickMemberSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: KickMemberInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const member = await guild.members.fetch(params.user_id);
      await member.kick(params.reason);

      return {
        content: [{ type: "text", text: `Kicked user ${params.user_id} from ${guild.name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error kicking member: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_ban_member",
  {
    title: "Ban Discord Member",
    description: `Ban a member from a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to ban
  - reason (string, optional): Reason for ban (visible in audit log)
  - delete_message_days (number): Days of messages to delete (0-7, default: 0)

Returns:
  Confirmation of ban`,
    inputSchema: BanMemberSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: BanMemberInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      await guild.members.ban(params.user_id, {
        reason: params.reason,
        deleteMessageSeconds: params.delete_message_days * 86400,
      });

      return {
        content: [{ type: "text", text: `Banned user ${params.user_id} from ${guild.name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error banning member: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_unban_member",
  {
    title: "Unban Discord Member",
    description: `Remove a ban from a user.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to unban

Returns:
  Confirmation of unban`,
    inputSchema: UnbanMemberSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: UnbanMemberInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      await guild.members.unban(params.user_id);

      return {
        content: [{ type: "text", text: `Unbanned user ${params.user_id} from ${guild.name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error unbanning member: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_set_nickname",
  {
    title: "Set Member Nickname",
    description: `Set or clear a member's nickname.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID
  - nickname (string, optional): New nickname (empty/null to reset)

Returns:
  Confirmation of nickname change`,
    inputSchema: SetNicknameSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: SetNicknameInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const member = await guild.members.fetch(params.user_id);
      await member.setNickname(params.nickname ?? null);

      const action = params.nickname ? `set to "${params.nickname}"` : "reset";
      return {
        content: [{ type: "text", text: `Nickname ${action} for user ${params.user_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error setting nickname: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// ROLE TOOLS
// ============================================================================

server.registerTool(
  "discord_list_roles",
  {
    title: "List Discord Roles",
    description: `List all roles in a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of roles with name, color, position, permissions`,
    inputSchema: ListRolesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListRolesInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const roles = guild.roles.cache
        .filter(r => r.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .map(formatRole);

      const text = formatResponse(
        Array.from(roles.values()),
        params.response_format,
        (items) => items.map(roleToMarkdown).join("\n\n")
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(text) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing roles: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_add_role",
  {
    title: "Add Role to Member",
    description: `Add a role to a Discord member.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID
  - role_id (string): Discord role ID to add

Returns:
  Confirmation of role added`,
    inputSchema: AddRoleSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: AddRoleInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const member = await guild.members.fetch(params.user_id);
      const role = guild.roles.cache.get(params.role_id);

      if (!role) {
        return {
          isError: true,
          content: [{ type: "text", text: `Role not found: ${params.role_id}` }],
        };
      }

      await member.roles.add(role);

      return {
        content: [{ type: "text", text: `Added role "${role.name}" to user ${params.user_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error adding role: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_remove_role",
  {
    title: "Remove Role from Member",
    description: `Remove a role from a Discord member.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID
  - role_id (string): Discord role ID to remove

Returns:
  Confirmation of role removed`,
    inputSchema: RemoveRoleSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: RemoveRoleInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const member = await guild.members.fetch(params.user_id);
      const role = guild.roles.cache.get(params.role_id);

      if (!role) {
        return {
          isError: true,
          content: [{ type: "text", text: `Role not found: ${params.role_id}` }],
        };
      }

      await member.roles.remove(role);

      return {
        content: [{ type: "text", text: `Removed role "${role.name}" from user ${params.user_id}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error removing role: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_create_role",
  {
    title: "Create Discord Role",
    description: `Create a new role in a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Role name
  - color (number, optional): Role color as decimal integer (e.g., 16711680 for red)
  - mentionable (boolean): Whether the role can be mentioned (default: false)
  - hoist (boolean): Whether to display role members separately (default: false)

Returns:
  The created role's details`,
    inputSchema: CreateRoleSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: CreateRoleInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const role = await guild.roles.create({
        name: params.name,
        color: params.color,
        mentionable: params.mentionable,
        hoist: params.hoist,
      });

      return {
        content: [{ type: "text", text: `Created role "${role.name}" (ID: ${role.id})` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating role: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_role",
  {
    title: "Delete Discord Role",
    description: `Delete a role from a Discord server. This action is permanent!

Args:
  - guild_id (string): Discord server/guild ID
  - role_id (string): Discord role ID to delete

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteRoleSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: DeleteRoleInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const role = guild.roles.cache.get(params.role_id);
      if (!role) {
        return {
          isError: true,
          content: [{ type: "text", text: `Role not found: ${params.role_id}` }],
        };
      }

      const name = role.name;
      await role.delete();

      return {
        content: [{ type: "text", text: `Deleted role: ${name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting role: ${(error as Error).message}` }],
      };
    }
  }
);

// Full list of role permissions for reference
const ROLE_PERMISSION_LIST = [
  // General Server Permissions
  'Administrator', 'ViewAuditLog', 'ViewGuildInsights', 'ManageGuild', 'ManageRoles',
  'ManageChannels', 'KickMembers', 'BanMembers', 'CreateInstantInvite', 'ChangeNickname',
  'ManageNicknames', 'ManageEmojisAndStickers', 'ManageWebhooks', 'ManageGuildExpressions',
  'ViewCreatorMonetizationAnalytics', 'ModerateMembers',
  // Text Channel Permissions
  'ViewChannel', 'SendMessages', 'SendTTSMessages', 'ManageMessages', 'EmbedLinks',
  'AttachFiles', 'ReadMessageHistory', 'MentionEveryone', 'UseExternalEmojis',
  'AddReactions', 'UseApplicationCommands', 'ManageThreads', 'CreatePublicThreads',
  'CreatePrivateThreads', 'UseExternalStickers', 'SendMessagesInThreads', 'SendVoiceMessages',
  'SendPolls', 'UseExternalApps',
  // Voice Channel Permissions
  'Connect', 'Speak', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'UseVAD',
  'PrioritySpeaker', 'Stream', 'UseSoundboard', 'UseExternalSounds', 'UseEmbeddedActivities',
  // Stage Channel Permissions
  'RequestToSpeak',
  // Events Permissions
  'ManageEvents', 'CreateEvents'
];

server.registerTool(
  "discord_edit_role",
  {
    title: "Edit Discord Role",
    description: `Edit a role's properties including name, color, and permissions.

Common permission names:
- Admin: Administrator (grants all permissions)
- General: ManageGuild, ManageRoles, ManageChannels, KickMembers, BanMembers, ModerateMembers
- Messages: SendMessages, ManageMessages, EmbedLinks, AttachFiles, ReadMessageHistory, MentionEveryone
- Voice: Connect, Speak, MuteMembers, DeafenMembers, MoveMembers, Stream
- Other: ManageEmojisAndStickers, ManageWebhooks, ManageEvents, ViewAuditLog

Args:
  - guild_id (string): Discord server/guild ID
  - role_id (string): Discord role ID to edit
  - name (string, optional): New role name
  - color (number, optional): Role color as decimal integer (e.g., 16711680 for red)
  - mentionable (boolean, optional): Whether the role can be mentioned
  - hoist (boolean, optional): Whether to display role members separately
  - permissions (string[], optional): Permissions to grant (replaces existing). Examples: ['SendMessages', 'ViewChannel']

Returns:
  Updated role details`,
    inputSchema: EditRoleSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: EditRoleInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const role = guild.roles.cache.get(params.role_id);
      if (!role) {
        return {
          isError: true,
          content: [{ type: "text", text: `Role not found: ${params.role_id}` }],
        };
      }

      // Build the edit options
      const editOptions: {
        name?: string;
        color?: number;
        mentionable?: boolean;
        hoist?: boolean;
        permissions?: bigint;
      } = {};

      if (params.name !== undefined) editOptions.name = params.name;
      if (params.color !== undefined) editOptions.color = params.color;
      if (params.mentionable !== undefined) editOptions.mentionable = params.mentionable;
      if (params.hoist !== undefined) editOptions.hoist = params.hoist;

      // Handle permissions if provided
      if (params.permissions !== undefined) {
        const permissionBits = new PermissionsBitField();
        for (const perm of params.permissions) {
          try {
            permissionBits.add(perm as keyof typeof PermissionsBitField.Flags);
          } catch {
            return {
              isError: true,
              content: [{ type: "text", text: `Invalid permission: ${perm}. Valid permissions include: ${ROLE_PERMISSION_LIST.slice(0, 10).join(', ')}, ...` }],
            };
          }
        }
        editOptions.permissions = permissionBits.bitfield;
      }

      const updatedRole = await role.edit(editOptions);

      const changes: string[] = [];
      if (params.name !== undefined) changes.push(`name: "${updatedRole.name}"`);
      if (params.color !== undefined) changes.push(`color: ${updatedRole.hexColor}`);
      if (params.mentionable !== undefined) changes.push(`mentionable: ${updatedRole.mentionable}`);
      if (params.hoist !== undefined) changes.push(`hoist: ${updatedRole.hoist}`);
      if (params.permissions !== undefined) changes.push(`permissions updated`);

      return {
        content: [{ type: "text", text: `Updated role "${updatedRole.name}" (ID: ${updatedRole.id})\nChanges: ${changes.join(', ')}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error editing role: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_set_role_positions",
  {
    title: "Set Role Positions",
    description: `Reorder role hierarchy by setting role positions.

Higher position = more authority in the hierarchy. The @everyone role is always at position 0.
Roles can only manage other roles below them in the hierarchy.

IMPORTANT: The bot can only move roles that are below its own highest role in the hierarchy.

Args:
  - guild_id (string): Discord server/guild ID
  - positions (array): Array of objects with:
    - role_id (string): Discord role ID
    - position (number): New position for the role (higher = more authority)

Returns:
  Confirmation of position changes`,
    inputSchema: SetRolePositionsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: SetRolePositionsInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      // Validate all roles exist before making changes
      for (const pos of params.positions) {
        const role = guild.roles.cache.get(pos.role_id);
        if (!role) {
          return {
            isError: true,
            content: [{ type: "text", text: `Role not found: ${pos.role_id}` }],
          };
        }
      }

      // Format positions for Discord API
      const positionUpdates = params.positions.map(pos => ({
        role: pos.role_id,
        position: pos.position,
      }));

      await guild.roles.setPositions(positionUpdates);

      // Build response with updated positions
      const updatedRoles = params.positions.map(pos => {
        const role = guild.roles.cache.get(pos.role_id);
        return `"${role?.name}" → position ${pos.position}`;
      });

      return {
        content: [{ type: "text", text: `Updated role positions:\n${updatedRoles.join('\n')}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error setting role positions: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// GUILD MANAGEMENT TOOLS
// ============================================================================

server.registerTool(
  "discord_edit_guild",
  {
    title: "Edit Guild Settings",
    description: `Edit server settings like name, verification level, and system channels.

Verification Levels: 0=None, 1=Low (verified email), 2=Medium (5 min member), 3=High (10 min member), 4=Very High (verified phone)
Content Filter: 0=Disabled, 1=Members without roles, 2=All members
Notifications: 0=All messages, 1=Only mentions

Args:
  - guild_id (string): Discord server/guild ID
  - name (string, optional): New server name
  - description (string, optional): Server description (Community servers only)
  - afk_channel_id (string, optional): AFK voice channel ID
  - afk_timeout (number, optional): AFK timeout in seconds (60, 300, 900, 1800, 3600)
  - system_channel_id (string, optional): System message channel ID
  - rules_channel_id (string, optional): Rules channel ID (Community only)
  - public_updates_channel_id (string, optional): Public updates channel ID (Community only)
  - verification_level (number, optional): 0-4
  - explicit_content_filter (number, optional): 0-2
  - default_message_notifications (number, optional): 0-1

Returns:
  Updated guild settings`,
    inputSchema: EditGuildSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: EditGuildInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const editOptions: Record<string, unknown> = {};
      if (params.name !== undefined) editOptions.name = params.name;
      if (params.description !== undefined) editOptions.description = params.description;
      if (params.afk_channel_id !== undefined) editOptions.afkChannel = params.afk_channel_id;
      if (params.afk_timeout !== undefined) editOptions.afkTimeout = params.afk_timeout;
      if (params.system_channel_id !== undefined) editOptions.systemChannel = params.system_channel_id;
      if (params.rules_channel_id !== undefined) editOptions.rulesChannel = params.rules_channel_id;
      if (params.public_updates_channel_id !== undefined) editOptions.publicUpdatesChannel = params.public_updates_channel_id;
      if (params.verification_level !== undefined) editOptions.verificationLevel = params.verification_level;
      if (params.explicit_content_filter !== undefined) editOptions.explicitContentFilter = params.explicit_content_filter;
      if (params.default_message_notifications !== undefined) editOptions.defaultMessageNotifications = params.default_message_notifications;

      await guild.edit(editOptions);

      return {
        content: [{ type: "text", text: `Updated guild settings for "${guild.name}"` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error editing guild: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// MEMBER MODERATION TOOLS
// ============================================================================

server.registerTool(
  "discord_timeout_member",
  {
    title: "Timeout Member",
    description: `Timeout (mute) a member for a specified duration. They cannot send messages, react, or join voice.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to timeout
  - duration_minutes (number): Timeout duration in minutes (0 to remove, max 40320 = 28 days)
  - reason (string, optional): Reason for timeout (visible in audit log)

Returns:
  Confirmation of timeout`,
    inputSchema: TimeoutMemberSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: TimeoutMemberInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const member = await guild.members.fetch(params.user_id).catch(() => null);
      if (!member) {
        return {
          isError: true,
          content: [{ type: "text", text: `Member not found: ${params.user_id}` }],
        };
      }

      if (params.duration_minutes === 0) {
        await member.timeout(null, params.reason);
        return {
          content: [{ type: "text", text: `Removed timeout from ${member.user.username}` }],
        };
      }

      const timeoutMs = params.duration_minutes * 60 * 1000;
      await member.timeout(timeoutMs, params.reason);

      return {
        content: [{ type: "text", text: `Timed out ${member.user.username} for ${params.duration_minutes} minutes` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error timing out member: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_list_bans",
  {
    title: "List Bans",
    description: `List all banned users in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - limit (number): Number of bans to return (1-1000, default 100)
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of banned users with reasons`,
    inputSchema: ListBansSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListBansInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const bans = await guild.bans.fetch({ limit: params.limit });
      const banList = bans.map(ban => ({
        userId: ban.user.id,
        username: ban.user.username,
        reason: ban.reason || 'No reason provided',
      }));

      const result = formatResponse(
        banList,
        params.response_format,
        (items) => items.map(b => `**${b.username}** (${b.userId})\nReason: ${b.reason}`).join('\n\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing bans: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// EMOJI TOOLS
// ============================================================================

server.registerTool(
  "discord_list_emojis",
  {
    title: "List Emojis",
    description: `List all custom emojis in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of emojis with name, ID, and whether animated`,
    inputSchema: ListEmojisSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListEmojisInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const emojis = guild.emojis.cache.map(emoji => ({
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated,
        available: emoji.available,
        managed: emoji.managed,
        requireColons: emoji.requiresColons,
        roles: emoji.roles.cache.map(r => r.name),
        url: emoji.url,
      }));

      const result = formatResponse(
        emojis,
        params.response_format,
        (items) => items.map(e => `${e.animated ? '(animated) ' : ''}**${e.name}** - ID: ${e.id}`).join('\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing emojis: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_create_emoji",
  {
    title: "Create Emoji",
    description: `Create a custom emoji in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Emoji name (2-32 chars, alphanumeric and underscores)
  - image_url (string): URL of image (PNG, JPG, GIF under 256KB)
  - roles (string[], optional): Role IDs that can use this emoji

Returns:
  Created emoji details`,
    inputSchema: CreateEmojiSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: CreateEmojiInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const emoji = await guild.emojis.create({
        attachment: params.image_url,
        name: params.name,
        roles: params.roles,
      });

      return {
        content: [{ type: "text", text: `Created emoji :${emoji.name}: (ID: ${emoji.id})` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating emoji: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_emoji",
  {
    title: "Delete Emoji",
    description: `Delete a custom emoji from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - emoji_id (string): Discord emoji ID

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteEmojiSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: DeleteEmojiInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const emoji = guild.emojis.cache.get(params.emoji_id);
      if (!emoji) {
        return {
          isError: true,
          content: [{ type: "text", text: `Emoji not found: ${params.emoji_id}` }],
        };
      }

      const name = emoji.name;
      await emoji.delete();

      return {
        content: [{ type: "text", text: `Deleted emoji :${name}:` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting emoji: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// INVITE TOOLS
// ============================================================================

server.registerTool(
  "discord_list_invites",
  {
    title: "List Invites",
    description: `List all active invites in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of invites with code, uses, max uses, expiration`,
    inputSchema: ListInvitesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListInvitesInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const invites = await guild.invites.fetch();
      const inviteList = invites.map(invite => ({
        code: invite.code,
        url: invite.url,
        channel: invite.channel?.name || 'Unknown',
        channelId: invite.channel?.id,
        inviter: invite.inviter?.username || 'Unknown',
        uses: invite.uses,
        maxUses: invite.maxUses || 'Unlimited',
        maxAge: invite.maxAge === 0 ? 'Never' : `${invite.maxAge} seconds`,
        temporary: invite.temporary,
        createdAt: invite.createdAt?.toISOString(),
        expiresAt: invite.expiresAt?.toISOString() || 'Never',
      }));

      const result = formatResponse(
        inviteList,
        params.response_format,
        (items) => items.map(i =>
          `**${i.code}** - #${i.channel}\nUses: ${i.uses}/${i.maxUses} | Expires: ${i.expiresAt}\nCreated by: ${i.inviter}`
        ).join('\n\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing invites: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_create_invite",
  {
    title: "Create Invite",
    description: `Create an invite link for a channel.

Args:
  - channel_id (string): Discord channel ID
  - max_age (number): Duration in seconds (0 = never expires, max 604800 = 7 days)
  - max_uses (number): Max uses (0 = unlimited)
  - temporary (boolean): Kick members when they disconnect if not assigned a role
  - unique (boolean): Create new unique invite vs reuse existing

Returns:
  Created invite URL`,
    inputSchema: CreateInviteSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: CreateInviteInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('createInvite' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found or cannot create invites: ${params.channel_id}` }],
        };
      }

      const textChannel = channel as TextChannel;
      const invite = await textChannel.createInvite({
        maxAge: params.max_age,
        maxUses: params.max_uses,
        temporary: params.temporary,
        unique: params.unique,
      });

      return {
        content: [{ type: "text", text: `Created invite: ${invite.url}\nCode: ${invite.code}\nMax uses: ${invite.maxUses || 'Unlimited'}\nExpires: ${invite.expiresAt?.toISOString() || 'Never'}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating invite: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_invite",
  {
    title: "Delete Invite",
    description: `Delete an invite by its code.

Args:
  - invite_code (string): The invite code to delete

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteInviteSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: DeleteInviteInput) => {
    try {
      const client = await getClient();
      const invite = await client.fetchInvite(params.invite_code).catch(() => null);

      if (!invite) {
        return {
          isError: true,
          content: [{ type: "text", text: `Invite not found: ${params.invite_code}` }],
        };
      }

      await invite.delete();

      return {
        content: [{ type: "text", text: `Deleted invite: ${params.invite_code}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting invite: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// WEBHOOK TOOLS
// ============================================================================

server.registerTool(
  "discord_list_webhooks",
  {
    title: "List Webhooks",
    description: `List webhooks in a guild or channel.

Args:
  - guild_id (string, optional): List all webhooks in the server
  - channel_id (string, optional): List webhooks for a specific channel
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of webhooks with name, channel, and URL`,
    inputSchema: ListWebhooksSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListWebhooksInput) => {
    try {
      const client = await getClient();
      let webhooks;

      if (params.channel_id) {
        const channel = client.channels.cache.get(params.channel_id);
        if (!channel || !('fetchWebhooks' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Channel not found or doesn't support webhooks: ${params.channel_id}` }],
          };
        }
        webhooks = await (channel as TextChannel).fetchWebhooks();
      } else if (params.guild_id) {
        const guild = client.guilds.cache.get(params.guild_id);
        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }
        webhooks = await guild.fetchWebhooks();
      } else {
        return {
          isError: true,
          content: [{ type: "text", text: `Must provide either guild_id or channel_id` }],
        };
      }

      const webhookList = webhooks.map(wh => ({
        id: wh.id,
        name: wh.name,
        channel: wh.channel?.id,
        url: wh.url,
        owner: wh.owner?.username || 'Unknown',
        avatar: wh.avatarURL(),
      }));

      const result = formatResponse(
        webhookList,
        params.response_format,
        (items) => items.map(w => `**${w.name}** (ID: ${w.id})\nChannel: <#${w.channel}>\nOwner: ${w.owner}`).join('\n\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing webhooks: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_create_webhook",
  {
    title: "Create Webhook",
    description: `Create a webhook in a channel.

Args:
  - channel_id (string): Discord channel ID
  - name (string): Webhook name
  - avatar_url (string, optional): Avatar image URL

Returns:
  Created webhook details including URL`,
    inputSchema: CreateWebhookSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: CreateWebhookInput) => {
    try {
      const client = await getClient();
      const channel = client.channels.cache.get(params.channel_id);

      if (!channel || !('createWebhook' in channel)) {
        return {
          isError: true,
          content: [{ type: "text", text: `Channel not found or doesn't support webhooks: ${params.channel_id}` }],
        };
      }

      const webhook = await (channel as TextChannel).createWebhook({
        name: params.name,
        avatar: params.avatar_url,
      });

      return {
        content: [{ type: "text", text: `Created webhook "${webhook.name}" (ID: ${webhook.id})\nURL: ${webhook.url}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating webhook: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_edit_webhook",
  {
    title: "Edit Webhook",
    description: `Edit an existing webhook.

Args:
  - webhook_id (string): Discord webhook ID
  - name (string, optional): New webhook name
  - channel_id (string, optional): Move webhook to different channel

Returns:
  Updated webhook details`,
    inputSchema: EditWebhookSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: EditWebhookInput) => {
    try {
      const client = await getClient();
      const webhook = await client.fetchWebhook(params.webhook_id).catch(() => null);

      if (!webhook) {
        return {
          isError: true,
          content: [{ type: "text", text: `Webhook not found: ${params.webhook_id}` }],
        };
      }

      const editOptions: { name?: string; channel?: string } = {};
      if (params.name !== undefined) editOptions.name = params.name;
      if (params.channel_id !== undefined) editOptions.channel = params.channel_id;

      await webhook.edit(editOptions);

      return {
        content: [{ type: "text", text: `Updated webhook "${webhook.name}" (ID: ${webhook.id})` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error editing webhook: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_webhook",
  {
    title: "Delete Webhook",
    description: `Delete a webhook.

Args:
  - webhook_id (string): Discord webhook ID

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteWebhookSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: DeleteWebhookInput) => {
    try {
      const client = await getClient();
      const webhook = await client.fetchWebhook(params.webhook_id).catch(() => null);

      if (!webhook) {
        return {
          isError: true,
          content: [{ type: "text", text: `Webhook not found: ${params.webhook_id}` }],
        };
      }

      const name = webhook.name;
      await webhook.delete();

      return {
        content: [{ type: "text", text: `Deleted webhook: ${name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting webhook: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// AUDIT LOG TOOL
// ============================================================================

server.registerTool(
  "discord_get_audit_log",
  {
    title: "Get Audit Log",
    description: `Get the audit log for a server. Shows who did what actions.

Common action types:
1=GuildUpdate, 10=ChannelCreate, 11=ChannelUpdate, 12=ChannelDelete,
20=MemberKick, 22=MemberBanAdd, 23=MemberBanRemove, 24=MemberUpdate, 25=MemberRoleUpdate,
30=RoleCreate, 31=RoleUpdate, 32=RoleDelete,
72=MessageDelete, 73=MessageBulkDelete

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string, optional): Filter by user who performed action
  - action_type (number, optional): Filter by action type
  - limit (number): Number of entries (1-100, default 20)
  - response_format ('json' | 'markdown'): Output format

Returns:
  Audit log entries with action, user, target, and changes`,
    inputSchema: GetAuditLogSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetAuditLogInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const fetchOptions: { limit: number; user?: string; type?: number } = {
        limit: params.limit,
      };
      if (params.user_id) fetchOptions.user = params.user_id;
      if (params.action_type !== undefined) fetchOptions.type = params.action_type;

      const auditLogs = await guild.fetchAuditLogs(fetchOptions);
      const entries = auditLogs.entries.map(entry => ({
        id: entry.id,
        action: entry.action,
        actionType: entry.actionType,
        executor: entry.executor?.username || 'Unknown',
        executorId: entry.executor?.id,
        target: entry.target?.toString() || 'Unknown',
        reason: entry.reason || 'No reason',
        createdAt: entry.createdAt.toISOString(),
        changes: entry.changes.map(c => ({
          key: c.key,
          old: c.old,
          new: c.new,
        })),
      }));

      const result = formatResponse(
        entries,
        params.response_format,
        (items) => items.map(e =>
          `**Action ${e.action}** by ${e.executor}\nTarget: ${e.target}\nReason: ${e.reason}\nTime: ${e.createdAt}`
        ).join('\n\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching audit log: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// PRUNE MEMBERS TOOL
// ============================================================================

server.registerTool(
  "discord_prune_members",
  {
    title: "Prune Members",
    description: `Remove inactive members from the server.

Args:
  - guild_id (string): Discord server/guild ID
  - days (number): Days of inactivity required (1-30)
  - include_roles (string[], optional): Role IDs to include in prune (by default only members without roles)
  - dry_run (boolean): If true, returns count without actually pruning (default true)

Returns:
  Number of members pruned (or would be pruned if dry_run)`,
    inputSchema: PruneMembersSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: PruneMembersInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      if (params.dry_run) {
        const count = await guild.members.prune({
          days: params.days,
          roles: params.include_roles,
          dry: true,
        });

        return {
          content: [{ type: "text", text: `Dry run: ${count} members would be pruned (inactive for ${params.days}+ days)` }],
        };
      }

      const pruned = await guild.members.prune({
        days: params.days,
        roles: params.include_roles,
        dry: false,
      });

      return {
        content: [{ type: "text", text: `Pruned ${pruned} members (inactive for ${params.days}+ days)` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error pruning members: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// STICKER TOOLS
// ============================================================================

server.registerTool(
  "discord_list_stickers",
  {
    title: "List Stickers",
    description: `List all custom stickers in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of stickers with name, description, and format`,
    inputSchema: ListStickersSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListStickersInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const stickers = await guild.stickers.fetch();
      const stickerList = stickers.map(sticker => ({
        id: sticker.id,
        name: sticker.name,
        description: sticker.description,
        tags: sticker.tags,
        format: sticker.format,
        available: sticker.available,
        url: sticker.url,
      }));

      const result = formatResponse(
        stickerList,
        params.response_format,
        (items) => items.map(s => `**${s.name}** (ID: ${s.id})\nDescription: ${s.description || 'None'}\nTags: ${s.tags || 'None'}`).join('\n\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing stickers: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_sticker",
  {
    title: "Delete Sticker",
    description: `Delete a custom sticker from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - sticker_id (string): Discord sticker ID

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteStickerSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: DeleteStickerInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const sticker = await guild.stickers.fetch(params.sticker_id).catch(() => null);
      if (!sticker) {
        return {
          isError: true,
          content: [{ type: "text", text: `Sticker not found: ${params.sticker_id}` }],
        };
      }

      const name = sticker.name;
      await sticker.delete();

      return {
        content: [{ type: "text", text: `Deleted sticker: ${name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting sticker: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// SCHEDULED EVENT TOOLS
// ============================================================================

server.registerTool(
  "discord_list_events",
  {
    title: "List Scheduled Events",
    description: `List all scheduled events in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of events with name, time, location, and status`,
    inputSchema: ListEventsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: ListEventsInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const events = await guild.scheduledEvents.fetch();
      const eventList = events.map(event => ({
        id: event.id,
        name: event.name,
        description: event.description,
        status: event.status,
        entityType: event.entityType,
        channel: event.channel?.name,
        channelId: event.channelId,
        location: event.entityMetadata?.location,
        scheduledStartTime: event.scheduledStartAt?.toISOString(),
        scheduledEndTime: event.scheduledEndAt?.toISOString(),
        userCount: event.userCount,
        creator: event.creator?.username,
      }));

      const result = formatResponse(
        eventList,
        params.response_format,
        (items) => items.map(e =>
          `**${e.name}** (ID: ${e.id})\nStatus: ${e.status}\nStart: ${e.scheduledStartTime}\nLocation: ${e.location || e.channel || 'TBD'}\nAttending: ${e.userCount || 0}`
        ).join('\n\n')
      );

      return {
        content: [{ type: "text", text: truncateIfNeeded(result) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing events: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_create_event",
  {
    title: "Create Scheduled Event",
    description: `Create a scheduled event in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Event name
  - description (string, optional): Event description
  - scheduled_start_time (string): ISO8601 timestamp for start
  - scheduled_end_time (string, optional): ISO8601 timestamp for end
  - entity_type ('stage' | 'voice' | 'external'): Type of event
  - channel_id (string, optional): Channel ID for stage/voice events
  - location (string, optional): Location for external events

Returns:
  Created event details`,
    inputSchema: CreateEventSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: CreateEventInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const entityTypeMap: Record<string, GuildScheduledEventEntityType> = {
        stage: GuildScheduledEventEntityType.StageInstance,
        voice: GuildScheduledEventEntityType.Voice,
        external: GuildScheduledEventEntityType.External,
      };

      const createOptions: {
        name: string;
        description?: string;
        scheduledStartTime: Date;
        scheduledEndTime?: Date;
        privacyLevel: GuildScheduledEventPrivacyLevel;
        entityType: GuildScheduledEventEntityType;
        channel?: string;
        entityMetadata?: { location: string };
      } = {
        name: params.name,
        scheduledStartTime: new Date(params.scheduled_start_time),
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: entityTypeMap[params.entity_type],
      };

      if (params.description) createOptions.description = params.description;
      if (params.scheduled_end_time) createOptions.scheduledEndTime = new Date(params.scheduled_end_time);
      if (params.channel_id) createOptions.channel = params.channel_id;
      if (params.location) createOptions.entityMetadata = { location: params.location };

      const event = await guild.scheduledEvents.create(createOptions);

      return {
        content: [{ type: "text", text: `Created event "${event.name}" (ID: ${event.id})\nStart: ${event.scheduledStartAt?.toISOString()}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error creating event: ${(error as Error).message}` }],
      };
    }
  }
);

server.registerTool(
  "discord_delete_event",
  {
    title: "Delete Scheduled Event",
    description: `Delete a scheduled event from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - event_id (string): Discord scheduled event ID

Returns:
  Confirmation of deletion`,
    inputSchema: DeleteEventSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: DeleteEventInput) => {
    try {
      const client = await getClient();
      const guild = client.guilds.cache.get(params.guild_id);

      if (!guild) {
        return {
          isError: true,
          content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
        };
      }

      const event = await guild.scheduledEvents.fetch(params.event_id).catch(() => null);
      if (!event) {
        return {
          isError: true,
          content: [{ type: "text", text: `Event not found: ${params.event_id}` }],
        };
      }

      const name = event.name;
      await event.delete();

      return {
        content: [{ type: "text", text: `Deleted event: ${name}` }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error deleting event: ${(error as Error).message}` }],
      };
    }
  }
);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Discord MCP server running on stdio");
}

async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`Discord MCP server running on http://localhost:${port}/mcp`);
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
