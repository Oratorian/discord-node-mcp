import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, RoleIdSchema, ResponseFormatSchema } from "./common.js";

// Welcome Screen schemas
export const GetWelcomeScreenSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const EditWelcomeScreenSchema = z.object({
  guild_id: GuildIdSchema,
  enabled: z.boolean()
    .optional()
    .describe("Whether the welcome screen is enabled"),
  description: z.string()
    .max(140)
    .optional()
    .describe("The server description shown in the welcome screen (max 140 chars)"),
  welcome_channels: z.array(z.object({
    channel_id: ChannelIdSchema,
    description: z.string().max(50).describe("Channel description (max 50 chars)"),
    emoji_id: z.string().optional().describe("Custom emoji ID (only for custom server emojis)"),
    emoji_name: z.string().optional().describe("Unicode emoji character (e.g., '👍') or custom emoji name if using emoji_id")
  }))
    .max(5)
    .optional()
    .describe("Welcome screen channels (max 5)")
}).strict();

// Onboarding schemas
export const GetOnboardingSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const EditOnboardingSchema = z.object({
  guild_id: GuildIdSchema,
  prompts: z.array(z.object({
    id: z.string().optional().describe("Prompt ID (required for editing existing prompts)"),
    type: z.enum(["multiple_choice", "dropdown"]).describe("Prompt type"),
    title: z.string().max(100).describe("Prompt title"),
    single_select: z.boolean().default(true).describe("Whether only one option can be selected"),
    required: z.boolean().default(false).describe("Whether this prompt is required"),
    in_onboarding: z.boolean().default(true).describe("Whether shown during onboarding"),
    options: z.array(z.object({
      id: z.string().optional().describe("Option ID (required for editing existing options)"),
      title: z.string().max(50).describe("Option title"),
      description: z.string().max(100).optional().describe("Option description"),
      emoji_id: z.string().optional().describe("Custom emoji ID"),
      emoji_name: z.string().optional().describe("Emoji name"),
      role_ids: z.array(RoleIdSchema).optional().describe("Roles to assign when selected (at least one role OR channel required)"),
      channel_ids: z.array(ChannelIdSchema).optional().describe("Channels to show when selected (at least one role OR channel required)")
    })).min(1).describe("Available options for this prompt")
  })).optional().describe("Onboarding prompts/questions"),
  default_channel_ids: z.array(ChannelIdSchema)
    .optional()
    .describe("Channels shown to new members by default"),
  enabled: z.boolean()
    .optional()
    .describe("Whether onboarding is enabled"),
  mode: z.enum(["onboarding_default", "onboarding_advanced"])
    .optional()
    .describe("Onboarding mode")
}).strict();

// Setup Onboarding schema - for initial configuration
export const SetupOnboardingSchema = z.object({
  guild_id: GuildIdSchema,
  default_channel_ids: z.array(ChannelIdSchema)
    .min(1)
    .describe("Channels shown to new members by default (at least one required)"),
  prompts: z.array(z.object({
    type: z.enum(["multiple_choice", "dropdown"]).describe("Prompt type"),
    title: z.string().max(100).describe("Prompt title"),
    single_select: z.boolean().default(true).describe("Whether only one option can be selected"),
    required: z.boolean().default(false).describe("Whether this prompt is required"),
    in_onboarding: z.boolean().default(true).describe("Whether shown during onboarding"),
    options: z.array(z.object({
      title: z.string().max(50).describe("Option title"),
      description: z.string().max(100).optional().describe("Option description"),
      emoji_id: z.string().optional().describe("Custom emoji ID"),
      emoji_name: z.string().optional().describe("Unicode emoji or custom emoji name"),
      role_ids: z.array(RoleIdSchema).optional().describe("Roles to assign when selected (at least one role OR channel required)"),
      channel_ids: z.array(ChannelIdSchema).optional().describe("Channels to show when selected (at least one role OR channel required)")
    })).min(1).describe("Available options for this prompt")
  })).min(1).describe("Onboarding prompts/questions (at least one required)"),
  mode: z.enum(["onboarding_default", "onboarding_advanced"])
    .default("onboarding_default")
    .describe("Onboarding mode"),
  enabled: z.boolean()
    .default(true)
    .describe("Whether to enable onboarding after setup")
}).strict();

// Setup Community schema
export const SetupCommunitySchema = z.object({
  guild_id: GuildIdSchema,
  rules_channel_id: ChannelIdSchema
    .describe("Channel for server rules (required for Community)"),
  public_updates_channel_id: ChannelIdSchema
    .describe("Channel for Discord community updates (required for Community)"),
  description: z.string()
    .max(120)
    .optional()
    .describe("Server description (max 120 chars)"),
  preferred_locale: z.string()
    .optional()
    .describe("Preferred language (e.g., 'en-US', 'de', 'fr')"),
  safety_alerts_channel_id: ChannelIdSchema
    .optional()
    .describe("Channel for safety alerts from Discord")
}).strict();

// Get Community Settings schema
export const GetCommunitySettingsSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

// Type exports
export type GetWelcomeScreenInput = z.infer<typeof GetWelcomeScreenSchema>;
export type EditWelcomeScreenInput = z.infer<typeof EditWelcomeScreenSchema>;
export type GetOnboardingInput = z.infer<typeof GetOnboardingSchema>;
export type EditOnboardingInput = z.infer<typeof EditOnboardingSchema>;
export type SetupOnboardingInput = z.infer<typeof SetupOnboardingSchema>;
export type SetupCommunityInput = z.infer<typeof SetupCommunitySchema>;
export type GetCommunitySettingsInput = z.infer<typeof GetCommunitySettingsSchema>;
