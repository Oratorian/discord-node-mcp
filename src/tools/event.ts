import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListEventsSchema,
  CreateEventSchema,
  DeleteEventSchema,
  type ListEventsInput,
  type CreateEventInput,
  type DeleteEventInput,
} from "../schemas/index.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from "discord.js";

export function registerEventTools(server: McpServer) {
  server.registerTool(
    "discord_list_events",
    {
      title: "List Scheduled Events",
      description: `List all scheduled events in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of events with name, time, location, and status`,
      inputSchema: ListEventsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListEventsInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const events = await guild.scheduledEvents.fetch();
        const eventList = events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description,
          status: event.status,
          entityType: event.entityType,
          channel: event.channel?.name,
          channelId: event.channelId,
          location: event.entityMetadata?.location,
          scheduledStartTime: event.scheduledStartAt?.toISOString(),
          scheduledEndTime: event.scheduledEndAt?.toISOString(),
          userCount: event.userCount,
          creator: event.creator?.username,
        }));

        const result = formatResponse(
          eventList,
          params.response_format,
          (items) => items.map(e =>
            `**${e.name}** (ID: ${e.id})\nStatus: ${e.status}\nStart: ${e.scheduledStartTime}\nLocation: ${e.location || e.channel || 'TBD'}\nAttending: ${e.userCount || 0}`
          ).join('\n\n')
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing events: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_create_event",
    {
      title: "Create Scheduled Event",
      description: `Create a scheduled event in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Event name
  - description (string, optional): Event description
  - scheduled_start_time (string): ISO8601 timestamp for start
  - scheduled_end_time (string, optional): ISO8601 timestamp for end
  - entity_type ('stage' | 'voice' | 'external'): Type of event
  - channel_id (string, optional): Channel ID for stage/voice events
  - location (string, optional): Location for external events

Returns:
  Created event details`,
      inputSchema: CreateEventSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateEventInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const entityTypeMap: Record<string, GuildScheduledEventEntityType> = {
          stage: GuildScheduledEventEntityType.StageInstance,
          voice: GuildScheduledEventEntityType.Voice,
          external: GuildScheduledEventEntityType.External,
        };

        const createOptions: {
          name: string;
          description?: string;
          scheduledStartTime: Date;
          scheduledEndTime?: Date;
          privacyLevel: GuildScheduledEventPrivacyLevel;
          entityType: GuildScheduledEventEntityType;
          channel?: string;
          entityMetadata?: { location: string };
        } = {
          name: params.name,
          scheduledStartTime: new Date(params.scheduled_start_time),
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          entityType: entityTypeMap[params.entity_type],
        };

        if (params.description) createOptions.description = params.description;
        if (params.scheduled_end_time) createOptions.scheduledEndTime = new Date(params.scheduled_end_time);
        if (params.channel_id) createOptions.channel = params.channel_id;
        if (params.entity_metadata?.location) createOptions.entityMetadata = { location: params.entity_metadata.location };

        const event = await guild.scheduledEvents.create(createOptions);

        return {
          content: [{ type: "text", text: `Created event "${event.name}" (ID: ${event.id})\nStart: ${event.scheduledStartAt?.toISOString()}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating event: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_event",
    {
      title: "Delete Scheduled Event",
      description: `Delete a scheduled event from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - event_id (string): Discord scheduled event ID

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteEventSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteEventInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const event = await guild.scheduledEvents.fetch(params.event_id).catch(() => null);
        if (!event) {
          return {
            isError: true,
            content: [{ type: "text", text: `Event not found: ${params.event_id}` }],
          };
        }

        const name = event.name;
        await event.delete();

        return {
          content: [{ type: "text", text: `Deleted event: ${name}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting event: ${(error as Error).message}` }],
        };
      }
    }
  );
}
