import { z } from "zod";
import { GuildIdSchema, UserIdSchema, RoleIdSchema, ChannelIdSchema, ResponseFormatSchema } from "./common.js";

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

export const MoveMemberSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  channel_id: ChannelIdSchema.nullable()
    .describe("Target voice channel ID, or null to disconnect the user")
}).strict();

export const SetNicknameSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  nickname: z.string()
    .max(32)
    .nullable()
    .describe("New nickname (max 32 chars) or null to clear")
}).strict();

// Type exports
export type ListMembersInput = z.infer<typeof ListMembersSchema>;
export type GetMemberInput = z.infer<typeof GetMemberSchema>;
export type MoveMemberInput = z.infer<typeof MoveMemberSchema>;
export type SetNicknameInput = z.infer<typeof SetNicknameSchema>;
