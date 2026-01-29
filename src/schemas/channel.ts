import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, ResponseFormatSchema } from "./common.js";

export const ListChannelsSchema = z.object({
  guild_id: GuildIdSchema,
  type: z.enum(["text", "voice", "category", "all"])
    .default("all")
    .describe("Filter by channel type"),
  response_format: ResponseFormatSchema
}).strict();

export const GetChannelSchema = z.object({
  channel_id: ChannelIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateChannelSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Channel name"),
  type: z.enum(["text", "voice", "category", "forum"])
    .default("text")
    .describe("Channel type: 'text', 'voice', 'category', or 'forum'"),
  topic: z.string()
    .max(1024)
    .optional()
    .describe("Channel topic (text/forum channels only)"),
  parent_id: ChannelIdSchema.optional()
    .describe("Category ID to create channel under (not for categories)"),
  nsfw: z.boolean()
    .optional()
    .describe("Whether the channel is NSFW (text/forum channels only)"),
  bitrate: z.number()
    .int()
    .min(8000)
    .max(384000)
    .optional()
    .describe("Bitrate for voice channels (8000-384000)"),
  user_limit: z.number()
    .int()
    .min(0)
    .max(99)
    .optional()
    .describe("User limit for voice channels (0 = unlimited)"),
  default_reaction_emoji: z.string()
    .optional()
    .describe("Default reaction emoji for forum posts - use emoji character (e.g., '👍') or custom emoji ID"),
  default_sort_order: z.enum(["latest_activity", "creation_date"])
    .optional()
    .describe("Default sort order for forum posts"),
  default_forum_layout: z.enum(["not_set", "list_view", "gallery_view"])
    .optional()
    .describe("Default layout for forum channel"),
  available_tags: z.array(z.object({
    name: z.string().max(20).describe("Tag name (max 20 chars)"),
    moderated: z.boolean().optional().describe("Whether only moderators can apply this tag"),
    emoji_id: z.string().optional().describe("Custom emoji ID for the tag"),
    emoji_name: z.string().optional().describe("Unicode emoji for the tag (e.g., '🎮')")
  }))
    .max(20)
    .optional()
    .describe("Available tags for forum posts (max 20 tags)")
}).strict();

export const DeleteChannelSchema = z.object({
  channel_id: ChannelIdSchema
}).strict();

export const EditChannelSchema = z.object({
  channel_id: ChannelIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe("New channel name"),
  topic: z.string()
    .max(1024)
    .optional()
    .describe("New channel topic"),
  parent_id: ChannelIdSchema.optional()
    .describe("Move channel to a different category (use 'none' to remove from category)"),
  position: z.number()
    .int()
    .min(0)
    .optional()
    .describe("New position of the channel"),
  nsfw: z.boolean()
    .optional()
    .describe("Whether the channel is NSFW"),
  bitrate: z.number()
    .int()
    .min(8000)
    .max(384000)
    .optional()
    .describe("Bitrate for voice channels"),
  user_limit: z.number()
    .int()
    .min(0)
    .max(99)
    .optional()
    .describe("User limit for voice channels"),
  default_reaction_emoji: z.string()
    .optional()
    .describe("Default reaction emoji for forum posts - use emoji character (e.g., '👍') or custom emoji ID, use 'none' to remove"),
  default_sort_order: z.enum(["latest_activity", "creation_date"])
    .optional()
    .describe("Default sort order for forum posts"),
  default_forum_layout: z.enum(["not_set", "list_view", "gallery_view"])
    .optional()
    .describe("Default layout for forum channel"),
  available_tags: z.array(z.object({
    id: z.string().optional().describe("Tag ID (required when editing existing tags)"),
    name: z.string().max(20).describe("Tag name (max 20 chars)"),
    moderated: z.boolean().optional().describe("Whether only moderators can apply this tag"),
    emoji_id: z.string().optional().describe("Custom emoji ID for the tag"),
    emoji_name: z.string().optional().describe("Unicode emoji for the tag (e.g., '🎮')")
  }))
    .max(20)
    .optional()
    .describe("Available tags for forum posts (max 20 tags)")
}).strict();

// Permission schemas
export const PermissionOverwriteSchema = z.object({
  id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/)
    .describe("Role or User ID to set permissions for"),
  type: z.enum(["role", "member"])
    .describe("Whether this is a role or member permission override"),
  allow: z.array(z.string())
    .optional()
    .describe("Permissions to allow (e.g., ['ViewChannel', 'SendMessages'])"),
  deny: z.array(z.string())
    .optional()
    .describe("Permissions to deny (e.g., ['SendMessages', 'AddReactions'])")
});

export const SetChannelPermissionsSchema = z.object({
  channel_id: ChannelIdSchema,
  target_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/)
    .describe("Role or User ID to set permissions for"),
  target_type: z.enum(["role", "member"])
    .describe("Whether target is a role or member"),
  allow: z.array(z.string())
    .optional()
    .describe("Permissions to allow (e.g., ['ViewChannel', 'SendMessages', 'ReadMessageHistory'])"),
  deny: z.array(z.string())
    .optional()
    .describe("Permissions to deny (e.g., ['SendMessages', 'AddReactions'])")
}).strict();

export const RemoveChannelPermissionsSchema = z.object({
  channel_id: ChannelIdSchema,
  target_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/)
    .describe("Role or User ID to remove permission overrides for")
}).strict();

export const GetChannelPermissionsSchema = z.object({
  channel_id: ChannelIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const SyncChannelPermissionsSchema = z.object({
  channel_id: ChannelIdSchema
}).strict();

// Type exports
export type ListChannelsInput = z.infer<typeof ListChannelsSchema>;
export type GetChannelInput = z.infer<typeof GetChannelSchema>;
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;
export type DeleteChannelInput = z.infer<typeof DeleteChannelSchema>;
export type EditChannelInput = z.infer<typeof EditChannelSchema>;
export type SetChannelPermissionsInput = z.infer<typeof SetChannelPermissionsSchema>;
export type RemoveChannelPermissionsInput = z.infer<typeof RemoveChannelPermissionsSchema>;
export type GetChannelPermissionsInput = z.infer<typeof GetChannelPermissionsSchema>;
export type SyncChannelPermissionsInput = z.infer<typeof SyncChannelPermissionsSchema>;
