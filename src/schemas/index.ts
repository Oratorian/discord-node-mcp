import { z } from "zod";
import { ResponseFormat } from "../types.js";

// Common schemas
export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.JSON)
  .describe("Output format: 'markdown' for human-readable or 'json' for structured data");

export const PaginationSchema = z.object({
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of results to return (1-100)"),
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip for pagination")
});

export const ChannelIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Channel ID must be numeric")
  .describe("Discord channel ID (snowflake)");

export const GuildIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Guild ID must be numeric")
  .describe("Discord server/guild ID (snowflake)");

export const UserIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "User ID must be numeric")
  .describe("Discord user ID (snowflake)");

export const RoleIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Role ID must be numeric")
  .describe("Discord role ID (snowflake)");

export const MessageIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Message ID must be numeric")
  .describe("Discord message ID (snowflake)");

// Tool-specific schemas

export const ListGuildsSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

export const GetGuildSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const LeaveGuildSchema = z.object({
  guild_id: GuildIdSchema,
  confirm: z.boolean()
    .describe("Must be set to true to confirm leaving the server")
}).strict();

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

export const SendMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  content: z.string()
    .min(1)
    .max(2000)
    .describe("Message content (max 2000 characters)"),
  reply_to: MessageIdSchema.optional()
    .describe("Optional message ID to reply to")
}).strict();

export const GetMessagesSchema = z.object({
  channel_id: ChannelIdSchema,
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Number of messages to retrieve (1-100)"),
  before: MessageIdSchema.optional()
    .describe("Get messages before this message ID"),
  after: MessageIdSchema.optional()
    .describe("Get messages after this message ID"),
  response_format: ResponseFormatSchema
}).strict();

export const DeleteMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema
}).strict();

export const EditMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema,
  content: z.string()
    .min(1)
    .max(2000)
    .describe("New message content (max 2000 characters)")
}).strict();

export const ListMembersSchema = z.object({
  guild_id: GuildIdSchema,
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum number of members to return"),
  after: UserIdSchema.optional()
    .describe("Get members after this user ID (for pagination)"),
  response_format: ResponseFormatSchema
}).strict();

export const GetMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const ListRolesSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const AddRoleSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  role_id: RoleIdSchema
}).strict();

export const RemoveRoleSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  role_id: RoleIdSchema
}).strict();

export const CreateChannelSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Channel name"),
  type: z.enum(["text", "voice", "category"])
    .default("text")
    .describe("Channel type: 'text', 'voice', or 'category'"),
  topic: z.string()
    .max(1024)
    .optional()
    .describe("Channel topic (text channels only)"),
  parent_id: ChannelIdSchema.optional()
    .describe("Category ID to create channel under (not for categories)"),
  nsfw: z.boolean()
    .optional()
    .describe("Whether the channel is NSFW (text channels only)"),
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
    .describe("User limit for voice channels (0 = unlimited)")
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
    .describe("User limit for voice channels")
}).strict();

// Permission override schema
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

export const MoveMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  channel_id: ChannelIdSchema.nullable()
    .describe("Target voice channel ID, or null to disconnect the user")
}).strict();

export const KickMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  reason: z.string()
    .max(512)
    .optional()
    .describe("Reason for kick (visible in audit log)")
}).strict();

export const BanMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  reason: z.string()
    .max(512)
    .optional()
    .describe("Reason for ban (visible in audit log)"),
  delete_message_days: z.number()
    .int()
    .min(0)
    .max(7)
    .default(0)
    .describe("Number of days of messages to delete (0-7)")
}).strict();

export const UnbanMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema
}).strict();

export const CreateRoleSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Role name"),
  color: z.number()
    .int()
    .min(0)
    .max(16777215)
    .optional()
    .describe("Role color as decimal integer (e.g., 16711680 for red)"),
  mentionable: z.boolean()
    .default(false)
    .describe("Whether the role can be mentioned"),
  hoist: z.boolean()
    .default(false)
    .describe("Whether to display role members separately")
}).strict();

export const DeleteRoleSchema = z.object({
  guild_id: GuildIdSchema,
  role_id: RoleIdSchema
}).strict();

export const EditRoleSchema = z.object({
  guild_id: GuildIdSchema,
  role_id: RoleIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe("New role name"),
  color: z.number()
    .int()
    .min(0)
    .max(16777215)
    .optional()
    .describe("Role color as decimal integer (e.g., 16711680 for red)"),
  mentionable: z.boolean()
    .optional()
    .describe("Whether the role can be mentioned"),
  hoist: z.boolean()
    .optional()
    .describe("Whether to display role members separately"),
  permissions: z.array(z.string())
    .optional()
    .describe("Permissions to grant (replaces existing permissions). Use permission names like 'Administrator', 'ManageChannels', 'SendMessages', etc.")
}).strict();

export const SetRolePositionsSchema = z.object({
  guild_id: GuildIdSchema,
  positions: z.array(z.object({
    role_id: RoleIdSchema,
    position: z.number().int().min(0).describe("New position for the role (higher = more authority)")
  })).min(1).describe("Array of role ID and position pairs to update")
}).strict();

export const SetNicknameSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  nickname: z.string()
    .max(32)
    .optional()
    .describe("New nickname (empty/null to reset)")
}).strict();

export const AddReactionSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema,
  emoji: z.string()
    .min(1)
    .describe("Emoji to react with (e.g., '👍' or custom emoji format)")
}).strict();

export const RemoveReactionSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema,
  emoji: z.string()
    .min(1)
    .describe("Emoji to remove (e.g., '👍' or custom emoji format)")
}).strict();

export const PinMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema
}).strict();

export const UnpinMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema
}).strict();

export const GetPinnedMessagesSchema = z.object({
  channel_id: ChannelIdSchema,
  response_format: ResponseFormatSchema
}).strict();

// Guild Management Schemas
export const EditGuildSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(2)
    .max(100)
    .optional()
    .describe("New server name"),
  description: z.string()
    .max(120)
    .optional()
    .describe("Server description (Community servers only)"),
  afk_channel_id: ChannelIdSchema.optional()
    .describe("AFK voice channel ID"),
  afk_timeout: z.number()
    .int()
    .optional()
    .describe("AFK timeout in seconds (60, 300, 900, 1800, 3600)"),
  system_channel_id: ChannelIdSchema.optional()
    .describe("System message channel ID"),
  rules_channel_id: ChannelIdSchema.optional()
    .describe("Rules channel ID (Community servers only)"),
  public_updates_channel_id: ChannelIdSchema.optional()
    .describe("Public updates channel ID (Community servers only)"),
  verification_level: z.number()
    .int()
    .min(0)
    .max(4)
    .optional()
    .describe("Verification level (0=None, 1=Low, 2=Medium, 3=High, 4=Very High)"),
  explicit_content_filter: z.number()
    .int()
    .min(0)
    .max(2)
    .optional()
    .describe("Explicit content filter (0=Disabled, 1=Members without roles, 2=All members)"),
  default_message_notifications: z.number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .describe("Default notification setting (0=All messages, 1=Only mentions)")
}).strict();

// Timeout/Mute Schema
export const TimeoutMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  duration_minutes: z.number()
    .int()
    .min(0)
    .max(40320) // Max 28 days
    .describe("Timeout duration in minutes (0 to remove timeout, max 40320 = 28 days)"),
  reason: z.string()
    .max(512)
    .optional()
    .describe("Reason for timeout (visible in audit log)")
}).strict();

// Emoji Schemas
export const ListEmojisSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateEmojiSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Emoji name must be alphanumeric with underscores only")
    .describe("Emoji name (2-32 characters, alphanumeric and underscores)"),
  image_url: z.string()
    .url()
    .describe("URL of the image to use for the emoji (PNG, JPG, GIF under 256KB)"),
  roles: z.array(RoleIdSchema)
    .optional()
    .describe("Roles that can use this emoji (empty = everyone)")
}).strict();

export const DeleteEmojiSchema = z.object({
  guild_id: GuildIdSchema,
  emoji_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/, "Emoji ID must be numeric")
    .describe("Discord emoji ID")
}).strict();

// Invite Schemas
export const ListInvitesSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateInviteSchema = z.object({
  channel_id: ChannelIdSchema,
  max_age: z.number()
    .int()
    .min(0)
    .max(604800)
    .default(86400)
    .describe("Invite duration in seconds (0 = never expires, max 604800 = 7 days)"),
  max_uses: z.number()
    .int()
    .min(0)
    .max(100)
    .default(0)
    .describe("Max number of uses (0 = unlimited)"),
  temporary: z.boolean()
    .default(false)
    .describe("Whether members invited get kicked when they disconnect"),
  unique: z.boolean()
    .default(false)
    .describe("Whether to create a new unique invite or reuse an existing one")
}).strict();

export const DeleteInviteSchema = z.object({
  invite_code: z.string()
    .min(1)
    .describe("Invite code to delete")
}).strict();

// Webhook Schemas
export const ListWebhooksSchema = z.object({
  guild_id: GuildIdSchema.optional()
    .describe("Guild ID to list all webhooks in the server"),
  channel_id: ChannelIdSchema.optional()
    .describe("Channel ID to list webhooks for a specific channel"),
  response_format: ResponseFormatSchema
}).strict();

export const CreateWebhookSchema = z.object({
  channel_id: ChannelIdSchema,
  name: z.string()
    .min(1)
    .max(80)
    .describe("Webhook name"),
  avatar_url: z.string()
    .url()
    .optional()
    .describe("URL for webhook avatar image")
}).strict();

export const DeleteWebhookSchema = z.object({
  webhook_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/, "Webhook ID must be numeric")
    .describe("Discord webhook ID")
}).strict();

export const EditWebhookSchema = z.object({
  webhook_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/, "Webhook ID must be numeric")
    .describe("Discord webhook ID"),
  name: z.string()
    .min(1)
    .max(80)
    .optional()
    .describe("New webhook name"),
  channel_id: ChannelIdSchema.optional()
    .describe("Move webhook to a different channel")
}).strict();

// Audit Log Schema
export const GetAuditLogSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema.optional()
    .describe("Filter by user who performed the action"),
  action_type: z.number()
    .int()
    .optional()
    .describe("Filter by action type (e.g., 1=GuildUpdate, 20=MemberKick, 22=MemberBan)"),
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Number of entries to return (1-100)"),
  response_format: ResponseFormatSchema
}).strict();

// Prune Schema
export const PruneMembersSchema = z.object({
  guild_id: GuildIdSchema,
  days: z.number()
    .int()
    .min(1)
    .max(30)
    .describe("Number of days of inactivity (1-30)"),
  include_roles: z.array(RoleIdSchema)
    .optional()
    .describe("Roles to include in prune (by default only members without roles are pruned)"),
  dry_run: z.boolean()
    .default(true)
    .describe("If true, returns count without actually pruning")
}).strict();

// Sticker Schemas
export const ListStickersSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const DeleteStickerSchema = z.object({
  guild_id: GuildIdSchema,
  sticker_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/, "Sticker ID must be numeric")
    .describe("Discord sticker ID")
}).strict();

// Scheduled Event Schemas
export const ListEventsSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateEventSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Event name"),
  description: z.string()
    .max(1000)
    .optional()
    .describe("Event description"),
  scheduled_start_time: z.string()
    .describe("ISO8601 timestamp for when the event starts"),
  scheduled_end_time: z.string()
    .optional()
    .describe("ISO8601 timestamp for when the event ends"),
  entity_type: z.enum(["stage", "voice", "external"])
    .describe("Type of event: 'stage', 'voice', or 'external'"),
  channel_id: ChannelIdSchema.optional()
    .describe("Channel ID for stage/voice events"),
  location: z.string()
    .max(100)
    .optional()
    .describe("Location for external events")
}).strict();

export const DeleteEventSchema = z.object({
  guild_id: GuildIdSchema,
  event_id: z.string()
    .min(17)
    .max(20)
    .regex(/^\d+$/, "Event ID must be numeric")
    .describe("Discord scheduled event ID")
}).strict();

// Ban List Schema
export const ListBansSchema = z.object({
  guild_id: GuildIdSchema,
  limit: z.number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe("Number of bans to return (1-1000)"),
  response_format: ResponseFormatSchema
}).strict();

// Type exports
export type ListGuildsInput = z.infer<typeof ListGuildsSchema>;
export type GetGuildInput = z.infer<typeof GetGuildSchema>;
export type LeaveGuildInput = z.infer<typeof LeaveGuildSchema>;
export type ListChannelsInput = z.infer<typeof ListChannelsSchema>;
export type GetChannelInput = z.infer<typeof GetChannelSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type GetMessagesInput = z.infer<typeof GetMessagesSchema>;
export type DeleteMessageInput = z.infer<typeof DeleteMessageSchema>;
export type EditMessageInput = z.infer<typeof EditMessageSchema>;
export type ListMembersInput = z.infer<typeof ListMembersSchema>;
export type GetMemberInput = z.infer<typeof GetMemberSchema>;
export type ListRolesInput = z.infer<typeof ListRolesSchema>;
export type AddRoleInput = z.infer<typeof AddRoleSchema>;
export type RemoveRoleInput = z.infer<typeof RemoveRoleSchema>;
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;
export type DeleteChannelInput = z.infer<typeof DeleteChannelSchema>;
export type EditChannelInput = z.infer<typeof EditChannelSchema>;
export type SetChannelPermissionsInput = z.infer<typeof SetChannelPermissionsSchema>;
export type RemoveChannelPermissionsInput = z.infer<typeof RemoveChannelPermissionsSchema>;
export type GetChannelPermissionsInput = z.infer<typeof GetChannelPermissionsSchema>;
export type SyncChannelPermissionsInput = z.infer<typeof SyncChannelPermissionsSchema>;
export type MoveMemberInput = z.infer<typeof MoveMemberSchema>;
export type KickMemberInput = z.infer<typeof KickMemberSchema>;
export type BanMemberInput = z.infer<typeof BanMemberSchema>;
export type UnbanMemberInput = z.infer<typeof UnbanMemberSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof DeleteRoleSchema>;
export type EditRoleInput = z.infer<typeof EditRoleSchema>;
export type SetRolePositionsInput = z.infer<typeof SetRolePositionsSchema>;
export type SetNicknameInput = z.infer<typeof SetNicknameSchema>;
export type AddReactionInput = z.infer<typeof AddReactionSchema>;
export type RemoveReactionInput = z.infer<typeof RemoveReactionSchema>;
export type PinMessageInput = z.infer<typeof PinMessageSchema>;
export type UnpinMessageInput = z.infer<typeof UnpinMessageSchema>;
export type GetPinnedMessagesInput = z.infer<typeof GetPinnedMessagesSchema>;
export type EditGuildInput = z.infer<typeof EditGuildSchema>;
export type TimeoutMemberInput = z.infer<typeof TimeoutMemberSchema>;
export type ListEmojisInput = z.infer<typeof ListEmojisSchema>;
export type CreateEmojiInput = z.infer<typeof CreateEmojiSchema>;
export type DeleteEmojiInput = z.infer<typeof DeleteEmojiSchema>;
export type ListInvitesInput = z.infer<typeof ListInvitesSchema>;
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
export type DeleteInviteInput = z.infer<typeof DeleteInviteSchema>;
export type ListWebhooksInput = z.infer<typeof ListWebhooksSchema>;
export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;
export type DeleteWebhookInput = z.infer<typeof DeleteWebhookSchema>;
export type EditWebhookInput = z.infer<typeof EditWebhookSchema>;
export type GetAuditLogInput = z.infer<typeof GetAuditLogSchema>;
export type PruneMembersInput = z.infer<typeof PruneMembersSchema>;
export type ListStickersInput = z.infer<typeof ListStickersSchema>;
export type DeleteStickerInput = z.infer<typeof DeleteStickerSchema>;
export type ListEventsInput = z.infer<typeof ListEventsSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type DeleteEventInput = z.infer<typeof DeleteEventSchema>;
export type ListBansInput = z.infer<typeof ListBansSchema>;
