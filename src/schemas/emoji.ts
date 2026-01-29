import { z } from "zod";
import { GuildIdSchema, EmojiIdSchema, StickerIdSchema, ResponseFormatSchema } from "./common.js";

export const ListEmojisSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateEmojiSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Emoji name must be alphanumeric with underscores")
    .describe("Emoji name (2-32 alphanumeric characters)"),
  image_url: z.string()
    .url()
    .describe("URL of the image to use for the emoji")
}).strict();

export const DeleteEmojiSchema = z.object({
  guild_id: GuildIdSchema,
  emoji_id: EmojiIdSchema
}).strict();

export const ListStickersSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const DeleteStickerSchema = z.object({
  guild_id: GuildIdSchema,
  sticker_id: StickerIdSchema
}).strict();

// Type exports
export type ListEmojisInput = z.infer<typeof ListEmojisSchema>;
export type CreateEmojiInput = z.infer<typeof CreateEmojiSchema>;
export type DeleteEmojiInput = z.infer<typeof DeleteEmojiSchema>;
export type ListStickersInput = z.infer<typeof ListStickersSchema>;
export type DeleteStickerInput = z.infer<typeof DeleteStickerSchema>;
