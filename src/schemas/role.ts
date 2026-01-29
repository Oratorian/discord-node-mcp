import { z } from "zod";
import { GuildIdSchema, UserIdSchema, RoleIdSchema, ResponseFormatSchema } from "./common.js";

export const ListRolesSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const AddRoleSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  role_id: RoleIdSchema
}).strict();

export const RemoveRoleSchema = z.object({
  guild_id: GuildIdSchema,
  user_id: UserIdSchema,
  role_id: RoleIdSchema
}).strict();

export const CreateRoleSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Role name"),
  color: z.number()
    .int()
    .min(0)
    .max(16777215)
    .optional()
    .describe("Role color as decimal (e.g., 16711680 for red)"),
  hoist: z.boolean()
    .optional()
    .describe("Whether to display role members separately"),
  mentionable: z.boolean()
    .optional()
    .describe("Whether the role can be mentioned"),
  permissions: z.array(z.string())
    .optional()
    .describe("Array of permission names (e.g., ['SendMessages', 'ManageChannels'])")
}).strict();

export const DeleteRoleSchema = z.object({
  guild_id: GuildIdSchema,
  role_id: RoleIdSchema
}).strict();

export const EditRoleSchema = z.object({
  guild_id: GuildIdSchema,
  role_id: RoleIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe("New role name"),
  color: z.number()
    .int()
    .min(0)
    .max(16777215)
    .optional()
    .describe("New role color as decimal"),
  hoist: z.boolean()
    .optional()
    .describe("Whether to display role members separately"),
  mentionable: z.boolean()
    .optional()
    .describe("Whether the role can be mentioned"),
  permissions: z.array(z.string())
    .optional()
    .describe("New permission names array")
}).strict();

export const SetRolePositionsSchema = z.object({
  guild_id: GuildIdSchema,
  positions: z.array(z.object({
    role_id: RoleIdSchema,
    position: z.number().int().min(0)
  })).min(1).describe("Array of role positions to set")
}).strict();

// Type exports
export type ListRolesInput = z.infer<typeof ListRolesSchema>;
export type AddRoleInput = z.infer<typeof AddRoleSchema>;
export type RemoveRoleInput = z.infer<typeof RemoveRoleSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type DeleteRoleInput = z.infer<typeof DeleteRoleSchema>;
export type EditRoleInput = z.infer<typeof EditRoleSchema>;
export type SetRolePositionsInput = z.infer<typeof SetRolePositionsSchema>;
