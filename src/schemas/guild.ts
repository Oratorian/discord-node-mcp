import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, ResponseFormatSchema } from "./common.js";

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

export const EditGuildSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(2)
    .max(100)
    .optional()
    .describe("New server name"),
  verification_level: z.enum(["none", "low", "medium", "high", "very_high"])
    .optional()
    .describe("Verification level required for members"),
  default_notifications: z.enum(["all_messages", "only_mentions"])
    .optional()
    .describe("Default notification settings for new members"),
  afk_channel_id: ChannelIdSchema.optional()
    .describe("AFK voice channel ID"),
  afk_timeout: z.number()
    .int()
    .optional()
    .describe("AFK timeout in seconds (60, 300, 900, 1800, 3600)"),
  system_channel_id: ChannelIdSchema.optional()
    .describe("System messages channel ID"),
  system_channel_flags: z.object({
    suppress_join_notifications: z.boolean().optional(),
    suppress_premium_subscriptions: z.boolean().optional(),
    suppress_guild_reminder_notifications: z.boolean().optional(),
    suppress_join_notification_replies: z.boolean().optional()
  }).optional().describe("System channel behavior flags")
}).strict();

// Type exports
export type ListGuildsInput = z.infer<typeof ListGuildsSchema>;
export type GetGuildInput = z.infer<typeof GetGuildSchema>;
export type LeaveGuildInput = z.infer<typeof LeaveGuildSchema>;
export type EditGuildInput = z.infer<typeof EditGuildSchema>;
