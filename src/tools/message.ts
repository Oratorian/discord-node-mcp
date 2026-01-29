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
import { TextChannel, TextBasedChannel, Message } from "discord.js";
import { DiscordMessage } from "../types.js";

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
      description: `Pin a message in a channel.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to pin

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
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const message = await (channel as any).messages.fetch(params.message_id);
        await message.pin();

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
      description: `Unpin a message in a channel.

Args:
  - channel_id (string): Discord channel ID
  - message_id (string): Message ID to unpin

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
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const message = await (channel as any).messages.fetch(params.message_id);
        await message.unpin();

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
      description: `Get all pinned messages in a channel.

Args:
  - channel_id (string): Discord channel ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of pinned messages`,
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
        const channel = client.channels.cache.get(params.channel_id);

        if (!channel || !('messages' in channel)) {
          return {
            isError: true,
            content: [{ type: "text", text: `Text channel not found: ${params.channel_id}` }],
          };
        }

        const messages = await (channel as any).messages.fetchPinned();
        const formatted = messages.map((m: Message) => formatMessage(m));

        const text = formatResponse(
          Array.from(formatted.values()) as DiscordMessage[],
          params.response_format,
          (items: DiscordMessage[]) => items.length > 0
            ? items.map(messageToMarkdown).join("\n\n---\n\n")
            : "No pinned messages in this channel."
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting pinned messages: ${(error as Error).message}` }],
        };
      }
    }
  );
}
