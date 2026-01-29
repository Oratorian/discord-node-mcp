import { z } from "zod";
import { ChannelIdSchema, MessageIdSchema, ResponseFormatSchema } from "./common.js";

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
