import { z } from "zod";
import { GuildIdSchema, UserIdSchema, ChannelIdSchema, RoleIdSchema, AutoModRuleIdSchema, ResponseFormatSchema } from "./common.js";

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
    .optional()
    .describe("Number of days of messages to delete (0-7)")
}).strict();

export const UnbanMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema
}).strict();

export const TimeoutMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  duration_minutes: z.number()
    .int()
    .min(1)
    .max(40320)
    .describe("Timeout duration in minutes (max 28 days = 40320)"),
  reason: z.string()
    .max(512)
    .optional()
    .describe("Reason for timeout")
}).strict();

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

export const PruneMembersSchema = z.object({
  guild_id: GuildIdSchema,
  days: z.number()
    .int()
    .min(1)
    .max(30)
    .describe("Number of days of inactivity (1-30)"),
  include_roles: z.array(RoleIdSchema)
    .optional()
    .describe("Role IDs to include in prune (normally members with roles are excluded)"),
  dry_run: z.boolean()
    .default(true)
    .describe("If true, only returns count without actually pruning")
}).strict();

export const GetAuditLogSchema = z.object({
  guild_id: GuildIdSchema,
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe("Number of entries to retrieve"),
  user_id: UserIdSchema.optional()
    .describe("Filter by user who performed actions"),
  action_type: z.number()
    .int()
    .optional()
    .describe("Filter by action type (Discord audit log action type number)"),
  response_format: ResponseFormatSchema
}).strict();

// Auto Moderation schemas
export const ListAutoModRulesSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const GetAutoModRuleSchema = z.object({
  guild_id: GuildIdSchema,
  rule_id: AutoModRuleIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateAutoModRuleSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Rule name"),
  event_type: z.enum(["message_send"])
    .describe("Event type that triggers the rule"),
  trigger_type: z.enum(["keyword", "spam", "keyword_preset", "mention_spam"])
    .describe("Type of content that triggers the rule"),
  trigger_metadata: z.object({
    keyword_filter: z.array(z.string()).optional().describe("Keywords to filter (for keyword trigger)"),
    regex_patterns: z.array(z.string()).optional().describe("Regex patterns to match"),
    presets: z.array(z.enum(["profanity", "sexual_content", "slurs"])).optional().describe("Preset keyword lists"),
    allow_list: z.array(z.string()).optional().describe("Allowed keywords that won't trigger"),
    mention_total_limit: z.number().int().min(1).optional().describe("Max mentions allowed (for mention_spam)")
  }).optional().describe("Trigger configuration"),
  actions: z.array(z.object({
    type: z.enum(["block_message", "send_alert_message", "timeout"]),
    metadata: z.object({
      channel_id: ChannelIdSchema.optional().describe("Channel to send alert (for send_alert_message)"),
      duration_seconds: z.number().int().max(2419200).optional().describe("Timeout duration in seconds (max 28 days)")
    }).optional()
  })).describe("Actions to take when rule is triggered"),
  enabled: z.boolean()
    .default(true)
    .describe("Whether the rule is enabled"),
  exempt_roles: z.array(RoleIdSchema)
    .optional()
    .describe("Roles exempt from this rule"),
  exempt_channels: z.array(ChannelIdSchema)
    .optional()
    .describe("Channels exempt from this rule")
}).strict();

export const EditAutoModRuleSchema = z.object({
  guild_id: GuildIdSchema,
  rule_id: AutoModRuleIdSchema,
  name: z.string().min(1).max(100).optional(),
  event_type: z.enum(["message_send"]).optional(),
  trigger_metadata: z.object({
    keyword_filter: z.array(z.string()).optional(),
    regex_patterns: z.array(z.string()).optional(),
    presets: z.array(z.enum(["profanity", "sexual_content", "slurs"])).optional(),
    allow_list: z.array(z.string()).optional(),
    mention_total_limit: z.number().int().min(1).optional()
  }).optional(),
  actions: z.array(z.object({
    type: z.enum(["block_message", "send_alert_message", "timeout"]),
    metadata: z.object({
      channel_id: ChannelIdSchema.optional(),
      duration_seconds: z.number().int().max(2419200).optional()
    }).optional()
  })).optional(),
  enabled: z.boolean().optional(),
  exempt_roles: z.array(RoleIdSchema).optional(),
  exempt_channels: z.array(ChannelIdSchema).optional()
}).strict();

export const DeleteAutoModRuleSchema = z.object({
  guild_id: GuildIdSchema,
  rule_id: AutoModRuleIdSchema
}).strict();

// Type exports
export type KickMemberInput = z.infer<typeof KickMemberSchema>;
export type BanMemberInput = z.infer<typeof BanMemberSchema>;
export type UnbanMemberInput = z.infer<typeof UnbanMemberSchema>;
export type TimeoutMemberInput = z.infer<typeof TimeoutMemberSchema>;
export type ListBansInput = z.infer<typeof ListBansSchema>;
export type PruneMembersInput = z.infer<typeof PruneMembersSchema>;
export type GetAuditLogInput = z.infer<typeof GetAuditLogSchema>;
export type ListAutoModRulesInput = z.infer<typeof ListAutoModRulesSchema>;
export type GetAutoModRuleInput = z.infer<typeof GetAutoModRuleSchema>;
export type CreateAutoModRuleInput = z.infer<typeof CreateAutoModRuleSchema>;
export type EditAutoModRuleInput = z.infer<typeof EditAutoModRuleSchema>;
export type DeleteAutoModRuleInput = z.infer<typeof DeleteAutoModRuleSchema>;
