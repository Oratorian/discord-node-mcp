import { z } from "zod";
import { ChannelIdSchema, GuildIdSchema, ResponseFormatSchema, RoleIdSchema, UserIdSchema } from "./common.js";

const PermissionScopeSchema = z.union([
  z.object({ guild_id: GuildIdSchema }).strict(),
  z.object({
    channel_id: ChannelIdSchema,
    implicit: z.boolean().optional().describe(
      "Apply implicit permission masking for missing View Channel or Connect access. Discord defaults to true."
    ),
  }).strict(),
]).describe("Discord server or channel whose permissions to calculate");

export const GetMemberPermissionsSchema = z.object({
  user_id: UserIdSchema,
  scope: PermissionScopeSchema,
  response_format: ResponseFormatSchema,
}).strict();

export const GetRolePermissionsSchema = z.object({
  role_id: RoleIdSchema,
  scope: PermissionScopeSchema,
  response_format: ResponseFormatSchema,
}).strict();

export type PermissionScope = z.infer<typeof PermissionScopeSchema>;
