import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGuildTools } from "./guild.js";
import { registerChannelTools } from "./channel.js";
import { registerMessageTools } from "./message.js";
import { registerMemberTools } from "./member.js";
import { registerRoleTools } from "./role.js";
import { registerModerationTools } from "./moderation.js";
import { registerEmojiTools } from "./emoji.js";
import { registerWebhookTools } from "./webhook.js";
import { registerInviteTools } from "./invite.js";
import { registerEventTools } from "./event.js";
import { registerCommunityTools } from "./community.js";

export function registerAllTools(server: McpServer) {
  registerGuildTools(server);
  registerChannelTools(server);
  registerMessageTools(server);
  registerMemberTools(server);
  registerRoleTools(server);
  registerModerationTools(server);
  registerEmojiTools(server);
  registerWebhookTools(server);
  registerInviteTools(server);
  registerEventTools(server);
  registerCommunityTools(server);
}
