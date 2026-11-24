import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GuildIdSchema, ResponseFormatSchema } from "../schemas/common.js";
import { formatResponse, getClient } from "../services/discord.js";

const GetGuildRoleMemberCountsSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema,
}).strict();

export function registerRoleCountTools(server: McpServer) {
  server.registerTool(
    "discord_get_guild_role_member_counts",
    {
      title: "Get Guild Role Member Counts",
      description: "Get the number of members assigned to each role in a Discord server, excluding @everyone. Discord supplies the counts directly.",
      inputSchema: GetGuildRoleMemberCountsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: z.infer<typeof GetGuildRoleMemberCountsSchema>) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);
        if (!guild) throw new Error(`Guild not found: ${params.guild_id}`);

        const counts = await guild.roles.fetchMemberCounts();
        const text = formatResponse<Record<string, number>>(Object.fromEntries(counts), params.response_format, () =>
          counts.size === 0
            ? "No role member counts found."
            : counts.map((count, roleId) => `- ${roleId}: ${count}`).join("\n")
        );

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting role member counts: ${(error as Error).message}` }],
        };
      }
    }
  );
}
