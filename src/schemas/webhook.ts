import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, WebhookIdSchema, ResponseFormatSchema } from "./common.js";

export const ListWebhooksSchema = z.object({
  guild_id: GuildIdSchema.optional()
    .describe("Guild ID to list all webhooks in the server"),
  channel_id: ChannelIdSchema.optional()
    .describe("Channel ID to list webhooks for a specific channel"),
  response_format: ResponseFormatSchema
}).strict();

export const CreateWebhookSchema = z.object({
  channel_id: ChannelIdSchema,
  name: z.string()
    .min(1)
    .max(80)
    .describe("Webhook name"),
  avatar_url: z.string()
    .url()
    .optional()
    .describe("URL of avatar image for the webhook")
}).strict();

export const EditWebhookSchema = z.object({
  webhook_id: WebhookIdSchema,
  name: z.string()
    .min(1)
    .max(80)
    .optional()
    .describe("New webhook name"),
  channel_id: ChannelIdSchema.optional()
    .describe("Move webhook to a different channel")
}).strict();

export const DeleteWebhookSchema = z.object({
  webhook_id: WebhookIdSchema
}).strict();

// Type exports
export type ListWebhooksInput = z.infer<typeof ListWebhooksSchema>;
export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;
export type EditWebhookInput = z.infer<typeof EditWebhookSchema>;
export type DeleteWebhookInput = z.infer<typeof DeleteWebhookSchema>;
