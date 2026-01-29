import { z } from "zod";
import { ResponseFormat } from "../types.js";

// Response format schema
export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.JSON)
  .describe("Output format: 'markdown' for human-readable or 'json' for structured data");

// Pagination schema
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

// ID schemas (Discord snowflakes)
export const GuildIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Guild ID must be numeric")
  .describe("Discord server/guild ID (snowflake)");

export const ChannelIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Channel ID must be numeric")
  .describe("Discord channel ID (snowflake)");

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

export const WebhookIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Webhook ID must be numeric")
  .describe("Discord webhook ID (snowflake)");

export const EmojiIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Emoji ID must be numeric")
  .describe("Discord emoji ID (snowflake)");

export const StickerIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Sticker ID must be numeric")
  .describe("Discord sticker ID (snowflake)");

export const EventIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Event ID must be numeric")
  .describe("Discord scheduled event ID (snowflake)");

export const AutoModRuleIdSchema = z.string()
  .min(17)
  .max(20)
  .regex(/^\d+$/, "Rule ID must be numeric")
  .describe("Auto moderation rule ID (snowflake)");
