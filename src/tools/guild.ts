import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListGuildsSchema,
  GetGuildSchema,
  LeaveGuildSchema,
  EditGuildSchema,
  type ListGuildsInput,
  type GetGuildInput,
  type LeaveGuildInput,
  type EditGuildInput,
} from "../schemas/index.js";
import {
  getClient,
  formatGuild,
  guildToMarkdown,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { GuildDefaultMessageNotifications, GuildVerificationLevel } from "discord.js";

export function registerGuildTools(server: McpServer) {
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

  server.registerTool(
    "discord_edit_guild",
    {
      title: "Edit Discord Server",
      description: `Edit server settings like name, verification level, and system channel.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string, optional): New server name
  - verification_level (string, optional): 'none', 'low', 'medium', 'high', 'very_high'
  - default_notifications (string, optional): 'all_messages' or 'only_mentions'
  - afk_channel_id (string, optional): AFK voice channel ID
  - afk_timeout (number, optional): AFK timeout in seconds
  - system_channel_id (string, optional): System messages channel
  - system_channel_flags (object, optional): System channel behavior

Returns:
  Updated server details`,
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

        const verificationMap: Record<string, GuildVerificationLevel> = {
          none: GuildVerificationLevel.None,
          low: GuildVerificationLevel.Low,
          medium: GuildVerificationLevel.Medium,
          high: GuildVerificationLevel.High,
          very_high: GuildVerificationLevel.VeryHigh,
        };

        const notificationMap: Record<string, GuildDefaultMessageNotifications> = {
          all_messages: GuildDefaultMessageNotifications.AllMessages,
          only_mentions: GuildDefaultMessageNotifications.OnlyMentions,
        };

        const updateData: any = {};
        if (params.name) updateData.name = params.name;
        if (params.verification_level) updateData.verificationLevel = verificationMap[params.verification_level];
        if (params.default_notifications) updateData.defaultMessageNotifications = notificationMap[params.default_notifications];
        if (params.afk_channel_id) updateData.afkChannel = params.afk_channel_id;
        if (params.afk_timeout) updateData.afkTimeout = params.afk_timeout;
        if (params.system_channel_id) updateData.systemChannel = params.system_channel_id;

        const updated = await guild.edit(updateData);

        return {
          content: [{ type: "text", text: `Updated server "${updated.name}"` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing guild: ${(error as Error).message}` }],
        };
      }
    }
  );
}
