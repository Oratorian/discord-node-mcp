import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PermissionsBitField, Routes } from "discord.js";
import { GetMemberPermissionsSchema, GetRolePermissionsSchema, type PermissionScope } from "../schemas/permissions.js";
import { formatResponse, getClient } from "../services/discord.js";
import type { ResponseFormat } from "../types.js";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const permissionRoutes = {
  member: { guild: Routes.guildPermissionsMember, channel: Routes.channelPermissionsMember },
  role: { guild: Routes.guildPermissionsRole, channel: Routes.channelPermissionsRole },
};

async function getPermissions(
  scope: PermissionScope,
  subject: { type: "member" | "role"; id: string },
  responseFormat: ResponseFormat,
) {
  try {
    const client = await getClient();
    const routes = permissionRoutes[subject.type];
    const route = "channel_id" in scope
      ? routes.channel(scope.channel_id, subject.id)
      : routes.guild(scope.guild_id, subject.id);
    const query = "channel_id" in scope && scope.implicit !== undefined
      ? new URLSearchParams({ implicit: String(scope.implicit) })
      : undefined;
    const { permissions } = await client.rest.get(route, { query }) as { permissions: string };

    const result = {
      scope,
      subject,
      permissions,
      permission_names: new PermissionsBitField(BigInt(permissions)).toArray(),
    };
    const text = formatResponse(result, responseFormat, (data) => {
      const location = "channel_id" in data.scope ? `channel ${data.scope.channel_id}` : `server ${data.scope.guild_id}`;
      const names = data.permission_names.map(name => `\`${name}\``).join(", ") || "None";
      return `**Permissions for ${data.subject.type} ${data.subject.id} in ${location}**\n\n${names}\n\nBitfield \`${data.permissions}\``;
    });

    return { content: [{ type: "text" as const, text }] };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Could not get ${subject.type} permissions. ${(error as Error).message}` }],
    };
  }
}

export function registerPermissionsTools(server: McpServer) {
  server.registerTool(
    "discord_get_member_permissions",
    {
      title: "Get Discord Member Permissions",
      description: "Get Discord's computed permissions for a member in a server or channel, including the bitfield and known permission names. Channel calculations include overwrites. Discord skips implicit masking for bot members.",
      inputSchema: GetMemberPermissionsSchema,
      annotations: readOnlyAnnotations,
    },
    async ({ user_id, scope, response_format }) => getPermissions(scope, { type: "member", id: user_id }, response_format),
  );

  server.registerTool(
    "discord_get_role_permissions",
    {
      title: "Get Discord Role Permissions",
      description: "Get Discord's computed permissions for a role together with @everyone in a server or channel, including the bitfield and known permission names. Channel calculations include overwrites for these roles.",
      inputSchema: GetRolePermissionsSchema,
      annotations: readOnlyAnnotations,
    },
    async ({ role_id, scope, response_format }) => getPermissions(scope, { type: "role", id: role_id }, response_format),
  );
}
