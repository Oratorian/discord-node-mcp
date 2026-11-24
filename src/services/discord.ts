import { once } from "node:events";
import {
  Client,
  Events,
  GatewayIntentBits,
  TextChannel,
  Guild,
  GuildMember,
  Role,
  Message,
  ChannelType,
  AttachmentFlags,
  PermissionsBitField,
  Channel,
  GuildChannel,
  ThreadChannel,
  type APIMessage,
} from "discord.js";
import {
  DiscordChannel,
  DiscordForumPost,
  DiscordGuild,
  DiscordMember,
  DiscordRole,
  DiscordMessage,
  DiscordAttachment,
  ResponseFormat
} from "../types.js";
import { CHARACTER_LIMIT } from "../constants.js";

let clientPromise: Promise<Client> | undefined;

/**
 * Initialize the Discord client with bot token
 */
async function initializeClient(): Promise<Client> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "DISCORD_BOT_TOKEN environment variable is required. " +
      "Set it before starting the server: export DISCORD_BOT_TOKEN=your_token_here"
    );
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
    ],
  });

  const ready = new AbortController();
  try {
    await Promise.all([
      once(client, Events.ClientReady, { signal: ready.signal }),
      client.login(token),
    ]);
    client.on(Events.Error, error => console.error(`Discord client error: ${error.message}`));
    console.error(`Discord bot logged in as ${client.user?.tag}`);
    return client;
  } catch (error) {
    await client.destroy();
    throw error;
  } finally {
    ready.abort();
  }
}

/**
 * Get the initialized Discord client
 */
export async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = initializeClient().catch(error => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
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

  // Forum channel specific fields
  if (channel.type === ChannelType.GuildForum && 'availableTags' in channel) {
    const forumChannel = channel as any;
    baseChannel.availableTags = forumChannel.availableTags?.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      moderated: tag.moderated,
      emoji: tag.emoji ? { id: tag.emoji.id, name: tag.emoji.name } : null,
    }));
    baseChannel.defaultReactionEmoji = forumChannel.defaultReactionEmoji;
    baseChannel.defaultSortOrder = forumChannel.defaultSortOrder;
    baseChannel.defaultForumLayout = forumChannel.defaultForumLayout;
  }

  return baseChannel;
}

/**
 * Format a forum post (thread) for response
 */
export function formatForumPost(thread: ThreadChannel): DiscordForumPost {
  const post: DiscordForumPost = {
    id: thread.id,
    name: thread.name,
    appliedTags: [...thread.appliedTags],
    archived: thread.archived ?? false,
    locked: thread.locked ?? false,
    pinned: thread.flags.has("Pinned"),
    messageCount: thread.messageCount ?? undefined,
    createdAt: thread.createdAt?.toISOString(),
    archiveTimestamp: thread.archivedAt?.toISOString(),
  };

  if (thread.ownerId) post.ownerId = thread.ownerId;

  if (thread.parent) {
    post.parentId = thread.parent.id;
    post.parentName = thread.parent.name;
  }

  return post;
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
  const attachmentDetails = message.attachments.map((attachment): DiscordAttachment => ({
    id: attachment.id,
    filename: attachment.name,
    url: attachment.url,
    size: attachment.size,
    contentType: attachment.contentType,
    description: attachment.description,
    isSpoiler: attachment.spoiler,
    flags: attachment.flags.bitfield,
  }));
  return {
    id: message.id,
    content: message.content,
    authorId: message.author.id,
    authorName: message.author.username,
    channelId: message.channelId,
    timestamp: message.createdAt.toISOString(),
    editedTimestamp: message.editedAt?.toISOString(),
    attachments: attachmentDetails.map(attachment => attachment.url),
    attachmentDetails: attachmentDetails.length === 0 ? undefined : attachmentDetails,
    embeds: message.embeds.length,
  };
}

export function formatApiMessage(message: APIMessage): DiscordMessage {
  const attachmentDetails = message.attachments.map((attachment): DiscordAttachment => ({
    id: attachment.id,
    filename: attachment.filename,
    url: attachment.url,
    size: attachment.size,
    contentType: attachment.content_type ?? null,
    description: attachment.description ?? null,
    isSpoiler: ((attachment.flags ?? 0) & AttachmentFlags.IsSpoiler) !== 0,
    flags: attachment.flags ?? 0,
  }));
  return {
    id: message.id,
    content: message.content,
    authorId: message.author.id,
    authorName: message.author.username,
    channelId: message.channel_id,
    timestamp: new Date(message.timestamp).toISOString(),
    editedTimestamp: message.edited_timestamp ? new Date(message.edited_timestamp).toISOString() : undefined,
    attachments: attachmentDetails.map(attachment => attachment.url),
    attachmentDetails: attachmentDetails.length === 0 ? undefined : attachmentDetails,
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
  data: T | T[],
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

export function forumPostToMarkdown(post: DiscordForumPost): string {
  let md = `### 🧵 ${post.name}
- **ID**: ${post.id}`;
  if (post.parentName) md += `\n- **Forum**: ${post.parentName}`;
  if (post.ownerId) md += `\n- **Author ID**: ${post.ownerId}`;
  if (post.appliedTags.length > 0) md += `\n- **Tags**: ${post.appliedTags.join(", ")}`;
  if (post.messageCount !== undefined) md += `\n- **Messages**: ${post.messageCount}`;
  const state: string[] = [];
  if (post.pinned) state.push("📌 Pinned");
  if (post.archived) state.push("🗄️ Archived");
  if (post.locked) state.push("🔒 Locked");
  md += `\n- **Status**: ${state.length > 0 ? state.join(", ") : "Active"}`;
  if (post.createdAt) md += `\n- **Created**: ${new Date(post.createdAt).toLocaleString()}`;
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
  for (const attachment of message.attachmentDetails ?? []) {
    md += `\n- ${attachment.filename} (ID ${attachment.id})`;
    if (attachment.isSpoiler) md += " [Spoiler]";
    if (attachment.description) md += ` - ${attachment.description}`;
  }
  if (message.embeds > 0) {
    md += `\n📋 ${message.embeds} embed(s)`;
  }
  return md;
}
