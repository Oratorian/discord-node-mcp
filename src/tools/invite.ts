import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListInvitesSchema,
  CreateInviteSchema,
  DeleteInviteSchema,
  type ListInvitesInput,
  type CreateInviteInput,
  type DeleteInviteInput,
} from "../schemas/index.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { TextChannel } from "discord.js";

export function registerInviteTools(server: McpServer) {
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
}
