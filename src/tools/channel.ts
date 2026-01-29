import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListChannelsSchema,
  GetChannelSchema,
  CreateChannelSchema,
  DeleteChannelSchema,
  EditChannelSchema,
  SetChannelPermissionsSchema,
  RemoveChannelPermissionsSchema,
  GetChannelPermissionsSchema,
  SyncChannelPermissionsSchema,
  type ListChannelsInput,
  type GetChannelInput,
  type CreateChannelInput,
  type DeleteChannelInput,
  type EditChannelInput,
  type SetChannelPermissionsInput,
  type RemoveChannelPermissionsInput,
  type GetChannelPermissionsInput,
  type SyncChannelPermissionsInput,
} from "../schemas/index.js";
import {
  getClient,
  formatChannel,
  channelToMarkdown,
  formatResponse,
  truncateIfNeeded,
  getChannelType,
} from "../services/discord.js";
import { ChannelType, GuildChannel, PermissionsBitField, OverwriteType, SortOrderType, ForumLayoutType } from "discord.js";

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

export function registerChannelTools(server: McpServer) {
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
  - type ('text' | 'voice' | 'category' | 'forum'): Channel type (default: 'text')
  - topic (string, optional): Channel topic (text/forum channels only)
  - parent_id (string, optional): Category ID to create channel under (not for categories)
  - nsfw (boolean, optional): Whether the channel is NSFW (text/forum channels only)
  - bitrate (number, optional): Bitrate for voice channels (8000-384000)
  - user_limit (number, optional): User limit for voice channels (0 = unlimited)
  - default_reaction_emoji (string, optional): Default emoji for forum posts (emoji char or custom ID)
  - default_sort_order ('latest_activity' | 'creation_date', optional): Sort order for forum posts
  - default_forum_layout ('not_set' | 'list_view' | 'gallery_view', optional): Forum layout
  - available_tags (array, optional): Tags for forum posts (max 20)
    - name (string): Tag name (max 20 chars)
    - moderated (boolean, optional): Only mods can apply this tag
    - emoji_name (string, optional): Unicode emoji (e.g., '🎮')
    - emoji_id (string, optional): Custom emoji ID

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
          case "forum":
            channelType = ChannelType.GuildForum;
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

        // Forum channel specific options
        if (params.type === "forum") {
          if (params.topic) channelOptions.topic = params.topic;
          if (params.nsfw !== undefined) channelOptions.nsfw = params.nsfw;
          if (params.default_reaction_emoji) {
            // Check if it's a custom emoji ID (numeric) or unicode emoji
            const isCustomEmoji = /^\d+$/.test(params.default_reaction_emoji);
            channelOptions.defaultReactionEmoji = isCustomEmoji
              ? { id: params.default_reaction_emoji }
              : { name: params.default_reaction_emoji };
          }
          if (params.default_sort_order) {
            channelOptions.defaultSortOrder = params.default_sort_order === "latest_activity"
              ? SortOrderType.LatestActivity
              : SortOrderType.CreationDate;
          }
          if (params.default_forum_layout) {
            const layoutMap: Record<string, ForumLayoutType> = {
              not_set: ForumLayoutType.NotSet,
              list_view: ForumLayoutType.ListView,
              gallery_view: ForumLayoutType.GalleryView,
            };
            channelOptions.defaultForumLayout = layoutMap[params.default_forum_layout];
          }
          if (params.available_tags && params.available_tags.length > 0) {
            channelOptions.availableTags = params.available_tags.map(tag => ({
              name: tag.name,
              moderated: tag.moderated ?? false,
              emoji: tag.emoji_id
                ? { id: tag.emoji_id, name: tag.emoji_name }
                : tag.emoji_name
                  ? { id: null, name: tag.emoji_name }
                  : undefined,
            }));
          }
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
  - default_reaction_emoji (string, optional): Default emoji for forum posts (emoji char or custom ID, 'none' to remove)
  - default_sort_order ('latest_activity' | 'creation_date', optional): Sort order for forum posts
  - default_forum_layout ('not_set' | 'list_view' | 'gallery_view', optional): Forum layout
  - available_tags (array, optional): Tags for forum posts (max 20)
    WARNING: This REPLACES all existing tags! To keep existing tags, first use discord_get_channel
    to get current tags with their IDs, then include them in this array with their id field.
    - id (string): Tag ID - REQUIRED to preserve existing tags, omit only for new tags
    - name (string): Tag name (max 20 chars)
    - moderated (boolean, optional): Only mods can apply this tag
    - emoji_name (string, optional): Unicode emoji (e.g., '🎮')
    - emoji_id (string, optional): Custom emoji ID

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

        // Forum channel specific options
        if (params.default_reaction_emoji !== undefined) {
          if (params.default_reaction_emoji === 'none') {
            updates.defaultReactionEmoji = null;
          } else {
            // Check if it's a custom emoji ID (numeric) or unicode emoji
            const isCustomEmoji = /^\d+$/.test(params.default_reaction_emoji);
            updates.defaultReactionEmoji = isCustomEmoji
              ? { id: params.default_reaction_emoji }
              : { name: params.default_reaction_emoji };
          }
        }
        if (params.default_sort_order !== undefined) {
          updates.defaultSortOrder = params.default_sort_order === "latest_activity"
            ? SortOrderType.LatestActivity
            : SortOrderType.CreationDate;
        }
        if (params.default_forum_layout !== undefined) {
          const layoutMap: Record<string, ForumLayoutType> = {
            not_set: ForumLayoutType.NotSet,
            list_view: ForumLayoutType.ListView,
            gallery_view: ForumLayoutType.GalleryView,
          };
          updates.defaultForumLayout = layoutMap[params.default_forum_layout];
        }
        if (params.available_tags !== undefined) {
          updates.availableTags = params.available_tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            moderated: tag.moderated ?? false,
            emoji: tag.emoji_id
              ? { id: tag.emoji_id, name: tag.emoji_name }
              : tag.emoji_name
                ? { id: null, name: tag.emoji_name }
                : undefined,
          }));
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
}
