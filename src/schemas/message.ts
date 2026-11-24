import { z } from "zod";
import { ChannelIdSchema, MessageIdSchema, ResponseFormatSchema } from "./common.js";
import { AllowedMentionsSchema, AttachmentUpdatesSchema, MessageContentFields } from "./message-content.js";

export const SendMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  ...MessageContentFields,
  allowed_mentions: AllowedMentionsSchema.extend({ replied_user: z.boolean().optional() }).optional(),
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
  ...MessageContentFields,
  content: MessageContentFields.content.nullable().describe("New message text, or null to clear existing text"),
  attachment_updates: AttachmentUpdatesSchema.optional(),
}).strict();

export const AddReactionSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema,
  emoji: z.string()
    .describe("Emoji to react with (unicode emoji or custom emoji format)")
}).strict();

export const RemoveReactionSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema,
  emoji: z.string()
    .describe("Emoji reaction to remove")
}).strict();

export const PinMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema,
  reason: z.string()
    .min(1)
    .max(512)
    .optional()
    .describe("Reason visible in the guild audit log")
}).strict();

export const UnpinMessageSchema = PinMessageSchema;

export const GetPinnedMessagesSchema = z.object({
  channel_id: ChannelIdSchema,
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Maximum number of pins in a page. Supply a limit to receive pagination metadata."),
  before: z.string()
    .datetime({ offset: true })
    .optional()
    .describe("ISO 8601 pin timestamp. Use next_before from the previous page."),
  response_format: ResponseFormatSchema
}).strict();

// Type exports
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type GetMessagesInput = z.infer<typeof GetMessagesSchema>;
export type DeleteMessageInput = z.infer<typeof DeleteMessageSchema>;
export type EditMessageInput = z.infer<typeof EditMessageSchema>;
export type AddReactionInput = z.infer<typeof AddReactionSchema>;
export type RemoveReactionInput = z.infer<typeof RemoveReactionSchema>;
export type PinMessageInput = z.infer<typeof PinMessageSchema>;
export type UnpinMessageInput = z.infer<typeof UnpinMessageSchema>;
export type GetPinnedMessagesInput = z.infer<typeof GetPinnedMessagesSchema>;
