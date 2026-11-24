import { z } from "zod";
import { ChannelIdSchema, EmojiIdSchema, MessageIdSchema, ResponseFormatSchema } from "./common.js";

const PollAnswerSchema = z.object({
  text: z.string().trim().min(1).max(55),
  emoji: z.union([
    z.object({ id: EmojiIdSchema }).strict(),
    z.object({ name: z.string().min(1) }).strict(),
  ]).optional().describe("Optional custom emoji ID or Unicode emoji name"),
}).strict();

export const CreatePollSchema = z.object({
  channel_id: ChannelIdSchema,
  question: z.string().trim().min(1).max(300),
  answers: z.array(PollAnswerSchema).min(1).max(10),
  duration_hours: z.number().int().min(1).max(768).default(24),
  allow_multiselect: z.boolean().default(false),
  response_format: ResponseFormatSchema,
}).strict();

export const PollMessageSchema = z.object({
  channel_id: ChannelIdSchema,
  message_id: MessageIdSchema.describe("ID of the Discord message containing the poll"),
  response_format: ResponseFormatSchema,
}).strict();
