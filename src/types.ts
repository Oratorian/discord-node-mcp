// Type definitions for Discord MCP Server

export interface DiscordChannel {
  id: string;
  name: string;
  type: string;
  topic?: string;
  position?: number;
  parentId?: string;
  parentName?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  memberCount: number;
  icon?: string;
  ownerId: string;
}

export interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  nickname?: string;
  roles: string[];
  joinedAt?: string;
  isBot: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  mentionable: boolean;
  hoist: boolean;
}

export interface DiscordMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  channelId: string;
  timestamp: string;
  editedTimestamp?: string;
  attachments: string[];
  embeds: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  count: number;
  offset: number;
  has_more: boolean;
  next_offset?: number;
}

export enum ResponseFormat {
  JSON = "json",
  MARKDOWN = "markdown"
}
