import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, ResponseFormatSchema } from "./common.js";

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
    .describe("Invite expiration in seconds (0 = never, max 604800 = 7 days)"),
  max_uses: z.number()
    .int()
    .min(0)
    .max(100)
    .default(0)
    .describe("Max uses (0 = unlimited)"),
  temporary: z.boolean()
    .default(false)
    .describe("Whether membership is temporary"),
  unique: z.boolean()
    .default(false)
    .describe("Whether to create a unique invite")
}).strict();

export const DeleteInviteSchema = z.object({
  invite_code: z.string()
    .min(1)
    .describe("Invite code to delete")
}).strict();

// Type exports
export type ListInvitesInput = z.infer<typeof ListInvitesSchema>;
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
export type DeleteInviteInput = z.infer<typeof DeleteInviteSchema>;
