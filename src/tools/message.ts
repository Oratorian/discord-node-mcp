import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  SendMessageSchema,
  GetMessagesSchema,
  DeleteMessageSchema,
  EditMessageSchema,
  AddReactionSchema,
  RemoveReactionSchema,
  PinMessageSchema,
  UnpinMessageSchema,
  GetPinnedMessagesSchema,
  type SendMessageInput,
  type GetMessagesInput,
  type DeleteMessageInput,
  type EditMessageInput,
  type AddReactionInput,
  type RemoveReactionInput,
  type PinMessageInput,
  type UnpinMessageInput,
  type GetPinnedMessagesInput,
} from "../schemas/index.js";
import {
  getClient,
  formatMessage,
  messageToMarkdown,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { Routes, type APIMessage, type Message, type RESTGetAPIChannelMessagesPinsResult } from "discord.js";
import { ResponseFormat, type DiscordMessage } from "../types.js";

function formatPinnedMessage(message: APIMessage): DiscordMessage {
  return {
    id: message.id,
    content: message.content,
    authorId: message.author.id,
    authorName: message.author.username,
    channelId: message.channel_id,
    timestamp: new Date(message.timestamp).toISOString(),
    editedTimestamp: message.edited_timestamp ? new Date(message.edited_timestamp).toISOString() : undefined,
    attachments: message.attachments.map(attachment => attachment.url),
    embeds: message.embeds.length,
  };
}

export function registerMessageTools(server: McpServer) {
  server.registerTool(
    "discord_send_message",
    {
      title: "Send Discord Message",
      description: `Send a message to a Discord channel.

Args:
  - channel_id (string): Discord channel ID
  - content (string): Message content (max 2000 characters)
  - reply_to (string, optional): Message ID to reply to

Returns:
  The sent message details including ID`,
      inputSchema: SendMessageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SendMessageInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('send' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const options: any = { content: params.content };
        if (params.reply_to) {
          options.reply = { messageReference: params.reply_to };
        }

        const message = await (channel as any).send(options);

        return {
          content: [{ type: "text", text: `Message sent (ID: ${message.id})` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error sending message: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_get_messages",
    {
      title: "Get Discord Messages",
      description: `Retrieve messages from a Discord channel.

Args:
  - channel_id (string): Discord channel ID
  - limit (number): Number of messages to retrieve (1-100, default: 20)
  - before (string, optional): Get messages before this message ID
  - after (string, optional): Get messages after this message ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of messages with content, author, timestamp, attachments`,
      inputSchema: GetMessagesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetMessagesInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const options: any = { limit: params.limit };
        if (params.before) options.before = params.before;
        if (params.after) options.after = params.after;

        const messages = await (channel as any).messages.fetch(options);
        const formatted = messages.map((m: Message) => formatMessage(m));

        const text = formatResponse(
          Array.from(formatted.values()) as DiscordMessage[],
          params.response_format,
          messageToMarkdown
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting messages: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_message",
    {
      title: "Delete Discord Message",
      description: `Delete a message from a Discord channel.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to delete

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteMessageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: DeleteMessageInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const message = await (channel as any).messages.fetch(params.message_id);
        await message.delete();

        return {
          content: [{ type: "text", text: `Deleted message ${params.message_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting message: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_edit_message",
    {
      title: "Edit Discord Message",
      description: `Edit a message sent by the bot.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to edit
  - content (string): New message content (max 2000 characters)

Returns:
  Confirmation of edit`,
      inputSchema: EditMessageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EditMessageInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const message = await (channel as any).messages.fetch(params.message_id);
        await message.edit(params.content);

        return {
          content: [{ type: "text", text: `Edited message ${params.message_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing message: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_add_reaction",
    {
      title: "Add Reaction to Message",
      description: `Add an emoji reaction to a message.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to react to
  - emoji (string): Emoji to react with (e.g., '\u{1F44D}' or custom emoji format)

Returns:
  Confirmation of reaction added`,
      inputSchema: AddReactionSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: AddReactionInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const message = await (channel as any).messages.fetch(params.message_id);
        await message.react(params.emoji);

        return {
          content: [{ type: "text", text: `Added reaction ${params.emoji} to message ${params.message_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error adding reaction: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_remove_reaction",
    {
      title: "Remove Reaction from Message",
      description: `Remove the bot's emoji reaction from a message.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID
  - emoji (string): Emoji to remove

Returns:
  Confirmation of reaction removed`,
      inputSchema: RemoveReactionSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: RemoveReactionInput) => {
      try {
        const client = await getClient();
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const message = await (channel as any).messages.fetch(params.message_id);
        const reaction = message.reactions.cache.get(params.emoji);
        if (reaction) {
          await reaction.users.remove(client.user!.id);
        }

        return {
          content: [{ type: "text", text: `Removed reaction ${params.emoji} from message ${params.message_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error removing reaction: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_pin_message",
    {
      title: "Pin Discord Message",
      description: `Pin a message in a channel. In a guild channel the bot needs PIN_MESSAGES.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to pin
  - reason (string, optional): Reason visible in the guild audit log

Returns:
  Confirmation of message pinned`,
      inputSchema: PinMessageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: PinMessageInput) => {
      try {
        const client = await getClient();
        await client.rest.put(Routes.channelMessagesPin(params.channel_id, params.message_id), {
          reason: params.reason,
        });

        return {
          content: [{ type: "text", text: `Pinned message ${params.message_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error pinning message: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_unpin_message",
    {
      title: "Unpin Discord Message",
      description: `Unpin a message in a channel. In a guild channel the bot needs PIN_MESSAGES.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to unpin
  - reason (string, optional): Reason visible in the guild audit log

Returns:
  Confirmation of message unpinned`,
      inputSchema: UnpinMessageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UnpinMessageInput) => {
      try {
        const client = await getClient();
        await client.rest.delete(Routes.channelMessagesPin(params.channel_id, params.message_id), {
          reason: params.reason,
        });

        return {
          content: [{ type: "text", text: `Unpinned message ${params.message_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error unpinning message: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_get_pinned_messages",
    {
      title: "Get Pinned Messages",
      description: `Get pinned messages in a channel. In a guild channel the bot needs VIEW_CHANNEL and READ_MESSAGE_HISTORY to see pins.

Args:
  - channel_id (string): Discord channel ID
  - limit (number, optional): Maximum pins per page (1-50, default: 50). Supply this to receive pagination metadata.
  - before (string, optional): Get messages pinned before this ISO 8601 timestamp. Use next_before from the previous page.
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  A list of pinned messages by default. Supplying limit or before adds pin timestamps and pagination metadata.`,
      inputSchema: GetPinnedMessagesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetPinnedMessagesInput) => {
      try {
        const client = await getClient();
        const query = new URLSearchParams();
        if (params.limit !== undefined) query.set("limit", String(params.limit));
        if (params.before !== undefined) query.set("before", params.before);

        // Keep the API's timestamp precision when round-tripping the pagination cursor.
        const { items, has_more } = await client.rest.get(Routes.channelMessagesPins(params.channel_id), {
          query,
        }) as RESTGetAPIChannelMessagesPinsResult;
        const paginated = params.limit !== undefined || params.before !== undefined;
        const pins = items.map(({ message, pinned_at }) => ({ message: formatPinnedMessage(message), pinned_at }));
        if (!paginated) {
          const messages = pins.map(pin => pin.message);
          const text = params.response_format === ResponseFormat.MARKDOWN && messages.length === 0
            ? "No pinned messages in this channel."
            : formatResponse(messages, params.response_format, messageToMarkdown);
          return { content: [{ type: "text", text: truncateIfNeeded(text) }] };
        }

        const page = {
          items: pins,
          has_more,
          next_before: has_more ? pins.at(-1)?.pinned_at : undefined,
        };
        const text = formatResponse(page, params.response_format, ({ items, next_before }) => {
          if (items.length === 0) return "No pinned messages in this channel.";
          const messages = items.map(({ message, pinned_at }) =>
            `${messageToMarkdown(message)}\nPinned at ${pinned_at}`
          ).join("\n\n---\n\n");
          return next_before ? `Pass \`${next_before}\` as \`before\` for the next page.\n\n${messages}` : messages;
        });
        return { content: [{ type: "text", text: params.response_format === ResponseFormat.JSON ? text : truncateIfNeeded(text) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting pinned messages: ${(error as Error).message}` }],
        };
      }
    }
  );
}
