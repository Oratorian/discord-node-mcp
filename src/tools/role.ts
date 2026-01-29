import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListRolesSchema,
  AddRoleSchema,
  RemoveRoleSchema,
  CreateRoleSchema,
  DeleteRoleSchema,
  EditRoleSchema,
  SetRolePositionsSchema,
  type ListRolesInput,
  type AddRoleInput,
  type RemoveRoleInput,
  type CreateRoleInput,
  type DeleteRoleInput,
  type EditRoleInput,
  type SetRolePositionsInput,
} from "../schemas/index.js";
import {
  getClient,
  formatRole,
  roleToMarkdown,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { PermissionsBitField } from "discord.js";

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

export function registerRoleTools(server: McpServer) {
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
}
