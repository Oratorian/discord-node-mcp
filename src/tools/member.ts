import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListMembersSchema,
  GetMemberSchema,
  MoveMemberSchema,
  SetNicknameSchema,
  type ListMembersInput,
  type GetMemberInput,
  type MoveMemberInput,
  type SetNicknameInput,
} from "../schemas/index.js";
import {
  getClient,
  formatMember,
  memberToMarkdown,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { Collection, GuildMember } from "discord.js";
import { DiscordMember } from "../types.js";

export function registerMemberTools(server: McpServer) {
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
          memberToMarkdown
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
    "discord_move_member",
    {
      title: "Move Member to Voice Channel",
      description: `Move a member to a different voice channel or disconnect them from voice.

The member must currently be connected to a voice channel to be moved.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to move
  - channel_id (string | null): Target voice channel ID, or null to disconnect

Returns:
  Confirmation of move or disconnect`,
      inputSchema: MoveMemberSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: MoveMemberInput) => {
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

        if (!member.voice.channel) {
          return {
            isError: true,
            content: [{ type: "text", text: `User ${params.user_id} is not connected to a voice channel` }],
          };
        }

        const previousChannel = member.voice.channel.name;

        if (params.channel_id === null) {
          await member.voice.disconnect();
          return {
            content: [{ type: "text", text: `Disconnected user ${member.user.tag} from voice channel "${previousChannel}"` }],
          };
        }

        const targetChannel = guild.channels.cache.get(params.channel_id);
        if (!targetChannel || !targetChannel.isVoiceBased()) {
          return {
            isError: true,
            content: [{ type: "text", text: `Voice channel not found: ${params.channel_id}` }],
          };
        }

        await member.voice.setChannel(targetChannel);

        return {
          content: [{ type: "text", text: `Moved user ${member.user.tag} from "${previousChannel}" to "${targetChannel.name}"` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error moving member: ${(error as Error).message}` }],
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
}
