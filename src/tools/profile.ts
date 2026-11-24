import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UpdateBotGuildProfileSchema, UpdateBotProfileSchema } from "../schemas/profile.js";
import { getClient } from "../services/discord.js";
import { resolveProfileImage } from "../services/profile-image.js";

const profileUpdateAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: true,
};

export function registerProfileTools(server: McpServer) {
  server.registerTool(
    "discord_update_bot_profile",
    {
      title: "Update the Bot's Global Profile",
      description: "Update the authenticated bot's global avatar or banner. Provide at least one field. Omitted fields keep their current value. Pass null to clear an image.",
      inputSchema: UpdateBotProfileSchema,
      annotations: profileUpdateAnnotations,
    },
    async (params: z.infer<typeof UpdateBotProfileSchema>) => {
      try {
        if (params.avatar === undefined && params.banner === undefined) {
          throw new Error("Provide at least one of avatar or banner");
        }
        const [avatar, banner] = await Promise.all([
          resolveProfileImage(params.avatar),
          resolveProfileImage(params.banner),
        ]);
        const client = await getClient();
        if (!client.user) throw new Error("Discord bot profile is unavailable");
        const user = await client.user.edit({ avatar, banner });

        return {
          content: [{ type: "text", text: JSON.stringify({
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarURL() ?? null,
            bannerUrl: user.bannerURL() ?? null,
          }, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error updating bot profile: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_update_bot_guild_profile",
    {
      title: "Update the Bot's Server Profile",
      description: "Update the authenticated bot's nickname, avatar, or banner in one server. Provide at least one profile field. Pass null to clear a field. Changing the nickname requires Change Nickname in that server.",
      inputSchema: UpdateBotGuildProfileSchema,
      annotations: profileUpdateAnnotations,
    },
    async (params: z.infer<typeof UpdateBotGuildProfileSchema>) => {
      try {
        if (params.nickname === undefined && params.avatar === undefined && params.banner === undefined) {
          throw new Error("Provide at least one of nickname, avatar, or banner");
        }
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);
        if (!guild) throw new Error(`Guild not found: ${params.guild_id}`);

        const [avatar, banner] = await Promise.all([
          resolveProfileImage(params.avatar),
          resolveProfileImage(params.banner),
        ]);
        const member = await guild.members.editMe({ nick: params.nickname, avatar, banner });

        return {
          content: [{ type: "text", text: JSON.stringify({
            guildId: guild.id,
            userId: member.id,
            nickname: member.nickname,
            avatarUrl: member.avatarURL(),
            bannerUrl: member.bannerURL(),
          }, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error updating bot server profile: ${(error as Error).message}` }],
        };
      }
    }
  );
}
