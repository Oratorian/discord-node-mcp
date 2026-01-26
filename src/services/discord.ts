import { 
  Client, 
  GatewayIntentBits, 
  TextChannel, 
  Guild, 
  GuildMember,
  Role,
  Message,
  ChannelType,
  PermissionsBitField,
  Channel,
  GuildChannel
} from "discord.js";
import { 
  DiscordChannel, 
  DiscordGuild, 
  DiscordMember, 
  DiscordRole, 
  DiscordMessage,
  ResponseFormat 
} from "../types.js";
import { CHARACTER_LIMIT } from "../constants.js";

let client: Client | null = null;
let isReady = false;

/**
 * Initialize the Discord client with bot token
 */
export async function initializeClient(): Promise<Client> {
  if (client && isReady) {
    return client;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "DISCORD_BOT_TOKEN environment variable is required. " +
      "Set it before starting the server: export DISCORD_BOT_TOKEN=your_token_here"
    );
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
    ],
  });

  return new Promise((resolve, reject) => {
    client!.once("ready", () => {
      isReady = true;
      console.error(`Discord bot logged in as ${client!.user?.tag}`);
      resolve(client!);
    });

    client!.once("error", (error) => {
      reject(new Error(`Discord client error: ${error.message}`));
    });

    client!.login(token).catch(reject);
  });
}

/**
 * Get the initialized Discord client
 */
export async function getClient(): Promise<Client> {
  if (!client || !isReady) {
    return initializeClient();
  }
  return client;
}

/**
 * Format a guild for response
 */
export function formatGuild(guild: Guild): DiscordGuild {
  return {
    id: guild.id,
    name: guild.name,
    memberCount: guild.memberCount,
    icon: guild.iconURL() ?? undefined,
    ownerId: guild.ownerId,
  };
}

/**
 * Format a channel for response
 */
export function formatChannel(channel: GuildChannel): DiscordChannel {
  const baseChannel: DiscordChannel = {
    id: channel.id,
    name: channel.name,
    type: ChannelType[channel.type],
    position: channel.position,
  };

  if (channel.parent) {
    baseChannel.parentId = channel.parent.id;
    baseChannel.parentName = channel.parent.name;
  }

  if (channel.type === ChannelType.GuildText && 'topic' in channel) {
    baseChannel.topic = (channel as TextChannel).topic ?? undefined;
  }

  return baseChannel;
}

/**
 * Format a member for response
 */
export function formatMember(member: GuildMember): DiscordMember {
  return {
    id: member.id,
    username: member.user.username,
    displayName: member.displayName,
    nickname: member.nickname ?? undefined,
    roles: member.roles.cache.map(r => r.name).filter(n => n !== "@everyone"),
    joinedAt: member.joinedAt?.toISOString(),
    isBot: member.user.bot,
  };
}

/**
 * Format a role for response
 */
export function formatRole(role: Role): DiscordRole {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    position: role.position,
    permissions: role.permissions.bitfield.toString(),
    mentionable: role.mentionable,
    hoist: role.hoist,
  };
}

/**
 * Format a message for response
 */
export function formatMessage(message: Message): DiscordMessage {
  return {
    id: message.id,
    content: message.content,
    authorId: message.author.id,
    authorName: message.author.username,
    channelId: message.channelId,
    timestamp: message.createdAt.toISOString(),
    editedTimestamp: message.editedAt?.toISOString(),
    attachments: message.attachments.map(a => a.url),
    embeds: message.embeds.length,
  };
}

/**
 * Convert channel type string to Discord.js ChannelType
 */
export function getChannelType(type: string): ChannelType | null {
  switch (type) {
    case "text": return ChannelType.GuildText;
    case "voice": return ChannelType.GuildVoice;
    case "category": return ChannelType.GuildCategory;
    default: return null;
  }
}

/**
 * Format data as markdown
 */
export function toMarkdown<T>(
  data: T | T[],
  formatter: (item: T) => string
): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return "No results found.";
    return data.map(formatter).join("\n\n---\n\n");
  }
  return formatter(data);
}

/**
 * Truncate text if too long
 */
export function truncateIfNeeded(text: string, limit: number = CHARACTER_LIMIT): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 100) + "\n\n... [Output truncated due to length]";
}

/**
 * Format response based on format preference
 */
export function formatResponse<T>(
  data: T,
  format: ResponseFormat,
  markdownFormatter: (item: T) => string
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }
  return toMarkdown(data, markdownFormatter);
}

// Markdown formatters for different types

export function guildToMarkdown(guild: DiscordGuild): string {
  return `## ${guild.name}
- **ID**: ${guild.id}
- **Members**: ${guild.memberCount}
- **Owner ID**: ${guild.ownerId}`;
}

export function channelToMarkdown(channel: DiscordChannel): string {
  let md = `### #${channel.name}
- **ID**: ${channel.id}
- **Type**: ${channel.type}`;
  if (channel.topic) md += `\n- **Topic**: ${channel.topic}`;
  if (channel.parentName) md += `\n- **Category**: ${channel.parentName}`;
  return md;
}

export function memberToMarkdown(member: DiscordMember): string {
  let md = `### ${member.displayName}
- **Username**: ${member.username}
- **ID**: ${member.id}`;
  if (member.nickname) md += `\n- **Nickname**: ${member.nickname}`;
  if (member.roles.length > 0) md += `\n- **Roles**: ${member.roles.join(", ")}`;
  if (member.joinedAt) md += `\n- **Joined**: ${new Date(member.joinedAt).toLocaleDateString()}`;
  if (member.isBot) md += `\n- **Bot**: Yes`;
  return md;
}

export function roleToMarkdown(role: DiscordRole): string {
  return `### ${role.name}
- **ID**: ${role.id}
- **Color**: #${role.color.toString(16).padStart(6, "0")}
- **Position**: ${role.position}
- **Mentionable**: ${role.mentionable ? "Yes" : "No"}
- **Hoisted**: ${role.hoist ? "Yes" : "No"}`;
}

export function messageToMarkdown(message: DiscordMessage): string {
  let md = `**${message.authorName}** (${new Date(message.timestamp).toLocaleString()})
${message.content || "[No text content]"}`;
  if (message.attachments.length > 0) {
    md += `\n📎 ${message.attachments.length} attachment(s)`;
  }
  if (message.embeds > 0) {
    md += `\n📋 ${message.embeds} embed(s)`;
  }
  return md;
}
