import { z } from "zod";
import { GuildIdSchema, ChannelIdSchema, EventIdSchema, ResponseFormatSchema } from "./common.js";

export const ListEventsSchema = z.object({
  guild_id: GuildIdSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CreateEventSchema = z.object({
  guild_id: GuildIdSchema,
  name: z.string()
    .min(1)
    .max(100)
    .describe("Event name"),
  description: z.string()
    .max(1000)
    .optional()
    .describe("Event description"),
  scheduled_start_time: z.string()
    .describe("ISO8601 timestamp for event start"),
  scheduled_end_time: z.string()
    .optional()
    .describe("ISO8601 timestamp for event end (required for external events)"),
  entity_type: z.enum(["stage", "voice", "external"])
    .describe("Event type: stage instance, voice channel, or external location"),
  channel_id: ChannelIdSchema.optional()
    .describe("Channel ID for stage/voice events"),
  entity_metadata: z.object({
    location: z.string().max(100).optional()
  }).optional().describe("Metadata for external events (location)")
}).strict();

export const DeleteEventSchema = z.object({
  guild_id: GuildIdSchema,
  event_id: EventIdSchema
}).strict();

// Type exports
export type ListEventsInput = z.infer<typeof ListEventsSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type DeleteEventInput = z.infer<typeof DeleteEventSchema>;
