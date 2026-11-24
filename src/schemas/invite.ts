import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, ResponseFormatSchema, RoleIdSchema, UserIdSchema } from "./common.js";

const InviteTargetUserIdsSchema = z.array(UserIdSchema).min(1).max(1000);
const InviteTargetCodeSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/, "Use the invite code from the invite link")
  .describe("Discord invite code");

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
    .describe("Whether to create a unique invite. Invites with target users or roles always use a new code."),
  target_user_ids: InviteTargetUserIdsSchema.optional()
    .describe("Limit acceptance of the invite to these Discord users (1-1000 IDs)"),
  role_ids: z.array(RoleIdSchema).min(1).optional()
    .describe("Roles granted to users who accept the invite. Requires Manage Roles and sufficient role hierarchy.")
}).strict();

export const DeleteInviteSchema = z.object({
  invite_code: z.string()
    .min(1)
    .describe("Invite code to delete")
}).strict();

export const ListInviteTargetUsersSchema = z.object({
  invite_code: InviteTargetCodeSchema,
  response_format: ResponseFormatSchema,
}).strict();

export const EditInviteTargetUsersSchema = z.object({
  invite_code: InviteTargetCodeSchema,
  action: z.enum(["add", "remove"]).describe("Add users to or remove users from the invite's target list"),
  user_ids: InviteTargetUserIdsSchema.describe("Discord user IDs to add or remove (1-1000 IDs)"),
}).strict();

// Type exports
export type ListInvitesInput = z.infer<typeof ListInvitesSchema>;
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
export type DeleteInviteInput = z.infer<typeof DeleteInviteSchema>;
