import {
  MessageSearchAuthorType,
  MessageSearchEmbedType,
  MessageSearchHasType,
  MessageSearchSortMode,
} from "discord.js";
import { z } from "zod";
import { ChannelIdSchema, GuildIdSchema, MessageIdSchema, ResponseFormatSchema, RoleIdSchema, UserIdSchema } from "./common.js";

export const MAX_MESSAGE_SEARCH_OFFSET = 9975;

export const SearchGuildMessagesSchema = z.object({
  guild_id: GuildIdSchema,
  content: z.string().min(1).max(1024).optional().describe("Text to search for"),
  slop: z.number().int().min(0).max(100).optional().describe("Maximum words between matching search tokens"),
  limit: z.number().int().min(1).max(25).default(25).describe("Maximum number of matches to return"),
  offset: z.number().int().min(0).max(MAX_MESSAGE_SEARCH_OFFSET).default(0).describe("Number of matches to skip"),
  min_id: MessageIdSchema.optional().describe("Find messages after this message ID"),
  max_id: MessageIdSchema.optional().describe("Find messages before this message ID"),
  channel_id: z.array(ChannelIdSchema).min(1).max(500).optional().describe("Only search these channels"),
  author_id: z.array(UserIdSchema).min(1).max(100).optional().describe("Filter by these authors"),
  author_type: z.array(z.nativeEnum(MessageSearchAuthorType)).min(1).optional().describe("Filter by author type. Prefix a type with - to exclude it."),
  mentions: z.array(UserIdSchema).min(1).max(100).optional().describe("Filter by mentioned users"),
  mentions_role_id: z.array(RoleIdSchema).min(1).max(100).optional().describe("Filter by mentioned roles"),
  mention_everyone: z.boolean().optional().describe("Filter by whether messages mention @everyone"),
  replied_to_user_id: z.array(UserIdSchema).min(1).max(100).optional().describe("Filter by the author of the replied-to message"),
  replied_to_message_id: z.array(MessageIdSchema).min(1).max(100).optional().describe("Filter by the replied-to message ID"),
  pinned: z.boolean().optional().describe("Filter by whether messages are pinned"),
  has: z.array(z.nativeEnum(MessageSearchHasType)).min(1).optional().describe("Filter by message features such as link, file, or poll. Prefix a feature with - to exclude it."),
  embed_type: z.array(z.nativeEnum(MessageSearchEmbedType)).min(1).optional().describe("Filter by embed type"),
  embed_provider: z.array(z.string().min(1).max(256)).min(1).max(100).optional().describe("Filter by case-sensitive embed provider name"),
  link_hostname: z.array(z.string().min(1).max(256)).min(1).max(100).optional().describe("Filter links by hostname"),
  attachment_filename: z.array(z.string().min(1).max(1024)).min(1).max(100).optional().describe("Filter by attachment filename"),
  attachment_extension: z.array(z.string().min(1).max(256)).min(1).max(100).optional().describe("Filter by attachment extension such as png"),
  sort_by: z.nativeEnum(MessageSearchSortMode).optional().describe("Sort by timestamp or relevance"),
  sort_order: z.enum(["asc", "desc"]).optional().describe("Sort direction when sorting by timestamp"),
  include_nsfw: z.boolean().optional().describe("Include results from age-restricted channels"),
  response_format: ResponseFormatSchema,
}).strict();
