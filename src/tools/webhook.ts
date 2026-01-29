import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListWebhooksSchema,
  CreateWebhookSchema,
  EditWebhookSchema,
  DeleteWebhookSchema,
  type ListWebhooksInput,
  type CreateWebhookInput,
  type EditWebhookInput,
  type DeleteWebhookInput,
} from "../schemas/index.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { TextChannel } from "discord.js";

export function registerWebhookTools(server: McpServer) {
  server.registerTool(
    "discord_list_webhooks",
    {
      title: "List Webhooks",
      description: `List webhooks in a guild or channel.

Args:
  - guild_id (string, optional): List all webhooks in the server
  - channel_id (string, optional): List webhooks for a specific channel
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of webhooks with name, channel, and URL`,
      inputSchema: ListWebhooksSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListWebhooksInput) => {
      try {
        const client = await getClient();
        let webhooks;

        if (params.channel_id) {
          const channel = client.channels.cache.get(params.channel_id);
          if (!channel || !('fetchWebhooks' in channel)) {
            return {
              isError: true,
              content: [{ type: "text", text: `Channel not found or doesn't support webhooks: ${params.channel_id}` }],
            };
          }
          webhooks = await (channel as TextChannel).fetchWebhooks();
        } else if (params.guild_id) {
          const guild = client.guilds.cache.get(params.guild_id);
          if (!guild) {
            return {
              isError: true,
              content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
            };
          }
          webhooks = await guild.fetchWebhooks();
        } else {
          return {
            isError: true,
            content: [{ type: "text", text: `Must provide either guild_id or channel_id` }],
          };
        }

        const webhookList = webhooks.map(wh => ({
          id: wh.id,
          name: wh.name,
          channel: wh.channel?.id,
          url: wh.url,
          owner: wh.owner?.username || 'Unknown',
          avatar: wh.avatarURL(),
        }));

        const result = formatResponse(
          webhookList,
          params.response_format,
          (items) => items.map(w => `**${w.name}** (ID: ${w.id})\nChannel: <#${w.channel}>\nOwner: ${w.owner}`).join('\n\n')
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing webhooks: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_create_webhook",
    {
      title: "Create Webhook",
      description: `Create a webhook in a channel.

Args:
  - channel_id (string): Discord channel ID
  - name (string): Webhook name
  - avatar_url (string, optional): Avatar image URL

Returns:
  Created webhook details including URL`,
      inputSchema: CreateWebhookSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateWebhookInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('createWebhook' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Channel not found or doesn't support webhooks: ${params.channel_id}` }],
          };
        }

        const webhook = await (channel as TextChannel).createWebhook({
          name: params.name,
          avatar: params.avatar_url,
        });

        return {
          content: [{ type: "text", text: `Created webhook "${webhook.name}" (ID: ${webhook.id})\nURL: ${webhook.url}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating webhook: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_edit_webhook",
    {
      title: "Edit Webhook",
      description: `Edit an existing webhook.

Args:
  - webhook_id (string): Discord webhook ID
  - name (string, optional): New webhook name
  - channel_id (string, optional): Move webhook to different channel

Returns:
  Updated webhook details`,
      inputSchema: EditWebhookSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EditWebhookInput) => {
      try {
        const client = await getClient();
        const webhook = await client.fetchWebhook(params.webhook_id).catch(() => null);

        if (!webhook) {
          return {
            isError: true,
            content: [{ type: "text", text: `Webhook not found: ${params.webhook_id}` }],
          };
        }

        const editOptions: { name?: string; channel?: string } = {};
        if (params.name !== undefined) editOptions.name = params.name;
        if (params.channel_id !== undefined) editOptions.channel = params.channel_id;

        await webhook.edit(editOptions);

        return {
          content: [{ type: "text", text: `Updated webhook "${webhook.name}" (ID: ${webhook.id})` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing webhook: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_webhook",
    {
      title: "Delete Webhook",
      description: `Delete a webhook.

Args:
  - webhook_id (string): Discord webhook ID

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteWebhookSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteWebhookInput) => {
      try {
        const client = await getClient();
        const webhook = await client.fetchWebhook(params.webhook_id).catch(() => null);

        if (!webhook) {
          return {
            isError: true,
            content: [{ type: "text", text: `Webhook not found: ${params.webhook_id}` }],
          };
        }

        const name = webhook.name;
        await webhook.delete();

        return {
          content: [{ type: "text", text: `Deleted webhook: ${name}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting webhook: ${(error as Error).message}` }],
        };
      }
    }
  );
}
