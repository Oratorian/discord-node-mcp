import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListInvitesSchema,
  CreateInviteSchema,
  DeleteInviteSchema,
  ListInviteTargetUsersSchema,
  EditInviteTargetUsersSchema,
  type ListInvitesInput,
  type CreateInviteInput,
  type DeleteInviteInput,
} from "../schemas/invite.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { Routes, type RESTGetAPIInviteTargetUsersResult, type RESTPostAPIChannelInviteResult, type TextChannel } from "discord.js";

function inviteCreatedText(code: string, url: string, maxUses: number | null, expiresAt: Date | null): string {
  return `Created invite: ${url}\nCode: ${code}\nMax uses: ${maxUses || 'Unlimited'}\nExpires: ${expiresAt?.toISOString() || 'Never'}`;
}

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
          (i) => `**${i.code}** - #${i.channel}\nUses: ${i.uses}/${i.maxUses} | Expires: ${i.expiresAt}\nCreated by: ${i.inviter}`
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
      description: `Create an invite link for a channel. Supply target_user_ids for an invite restricted to specific Discord users, and role_ids to grant roles on acceptance. Either option creates a new invite code.

Args:
  - channel_id (string): Discord channel ID
  - max_age (number): Duration in seconds (0 = never expires, max 604800 = 7 days)
  - max_uses (number): Max uses (0 = unlimited)
  - temporary (boolean): Kick members when they disconnect if not assigned a role
  - unique (boolean): Create new unique invite vs reuse existing
  - target_user_ids (string[], optional): Only these users can see and accept the invite (1-1000 IDs)
  - role_ids (string[], optional): Roles granted on acceptance. Requires Manage Roles and sufficient role hierarchy.

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

        if (params.target_user_ids || params.role_ids) {
          const invite = await client.rest.post(Routes.channelInvites(params.channel_id), {
            body: {
              max_age: params.max_age,
              max_uses: params.max_uses,
              temporary: params.temporary,
              unique: true,
              target_user_ids: params.target_user_ids && [...new Set(params.target_user_ids)],
              role_ids: params.role_ids && [...new Set(params.role_ids)],
            },
          }) as RESTPostAPIChannelInviteResult;
          const expiresAt = invite.expires_at
            ? new Date(invite.expires_at)
            : invite.created_at && invite.max_age
              ? new Date(Date.parse(invite.created_at) + invite.max_age * 1000)
              : null;

          return {
            content: [{ type: "text", text: inviteCreatedText(invite.code, `https://discord.gg/${invite.code}`, invite.max_uses, expiresAt) }],
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
          content: [{ type: "text", text: inviteCreatedText(invite.code, invite.url, invite.maxUses, invite.expiresAt) }],
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
    "discord_list_invite_target_users",
    {
      title: "List Invite Target Users",
      description: "List the Discord users allowed to accept a targeted invite. Available to the inviter or callers with Manage Server or View Audit Log.",
      inputSchema: ListInviteTargetUsersSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ invite_code, response_format }) => {
      try {
        const client = await getClient();
        const csv = await client.rest.get(Routes.inviteTargetUsers(invite_code)) as RESTGetAPIInviteTargetUsersResult;
        const [header, ...rows] = Buffer.from(csv).toString("utf8").trim().split(/\r?\n/);
        if (header !== "user_id" || rows.some(row => !/^\d{1,20}$/.test(row))) {
          throw new Error("Discord returned an unrecognized target user list");
        }

        const text = formatResponse({ invite_code, target_user_ids: rows }, response_format, data =>
          data.target_user_ids.length
            ? `Target users for invite ${data.invite_code}\n\n${data.target_user_ids.map(id => `- ${id}`).join("\n")}`
            : `No target users were returned for invite ${data.invite_code}.`
        );
        return { content: [{ type: "text", text }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing invite target users: ${(error as Error).message}` }],
        };
      }
    },
  );

  server.registerTool(
    "discord_edit_invite_target_users",
    {
      title: "Edit Invite Target Users",
      description: "Add or remove specific users on an existing targeted invite. Available to the inviter or callers with Manage Server. Removing a user affects future acceptance of the invite. Use member management to remove roles or memberships already granted.",
      inputSchema: EditInviteTargetUsersSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ invite_code, action, user_ids }) => {
      try {
        const client = await getClient();
        const route = Routes.inviteTargetUsers(invite_code);
        const ids = [...new Set(user_ids)];
        const suffix = action === "add" ? "bulk-add" : "bulk-delete";
        await client.rest.post(`${route}/${suffix}`, { body: { user_ids: ids } });

        const change = action === "add" ? "added to" : "removed from";
        return { content: [{ type: "text", text: `${ids.length} target user(s) ${change} invite ${invite_code}.` }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing invite target users: ${(error as Error).message}` }],
        };
      }
    },
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
