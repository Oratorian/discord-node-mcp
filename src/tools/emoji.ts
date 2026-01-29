import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListEmojisSchema,
  CreateEmojiSchema,
  DeleteEmojiSchema,
  ListStickersSchema,
  DeleteStickerSchema,
  type ListEmojisInput,
  type CreateEmojiInput,
  type DeleteEmojiInput,
  type ListStickersInput,
  type DeleteStickerInput,
} from "../schemas/index.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";

export function registerEmojiTools(server: McpServer) {
  // ============================================================================
  // EMOJI TOOLS
  // ============================================================================

  server.registerTool(
    "discord_list_emojis",
    {
      title: "List Emojis",
      description: `List all custom emojis in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of emojis with name, ID, and whether animated`,
      inputSchema: ListEmojisSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListEmojisInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const emojis = guild.emojis.cache.map(emoji => ({
          id: emoji.id,
          name: emoji.name,
          animated: emoji.animated,
          available: emoji.available,
          managed: emoji.managed,
          requireColons: emoji.requiresColons,
          roles: emoji.roles.cache.map(r => r.name),
          url: emoji.url,
        }));

        const result = formatResponse(
          emojis,
          params.response_format,
          (items) => items.map(e => `${e.animated ? '(animated) ' : ''}**${e.name}** - ID: ${e.id}`).join('\n')
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing emojis: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_create_emoji",
    {
      title: "Create Emoji",
      description: `Create a custom emoji in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Emoji name (2-32 chars, alphanumeric and underscores)
  - image_url (string): URL of image (PNG, JPG, GIF under 256KB)
  - roles (string[], optional): Role IDs that can use this emoji

Returns:
  Created emoji details`,
      inputSchema: CreateEmojiSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateEmojiInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const emoji = await guild.emojis.create({
          attachment: params.image_url,
          name: params.name,
          roles: (params as any).roles,
        });

        return {
          content: [{ type: "text", text: `Created emoji :${emoji.name}: (ID: ${emoji.id})` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating emoji: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_emoji",
    {
      title: "Delete Emoji",
      description: `Delete a custom emoji from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - emoji_id (string): Discord emoji ID

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteEmojiSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteEmojiInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const emoji = guild.emojis.cache.get(params.emoji_id);
        if (!emoji) {
          return {
            isError: true,
            content: [{ type: "text", text: `Emoji not found: ${params.emoji_id}` }],
          };
        }

        const name = emoji.name;
        await emoji.delete();

        return {
          content: [{ type: "text", text: `Deleted emoji :${name}:` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting emoji: ${(error as Error).message}` }],
        };
      }
    }
  );

  // ============================================================================
  // STICKER TOOLS
  // ============================================================================

  server.registerTool(
    "discord_list_stickers",
    {
      title: "List Stickers",
      description: `List all custom stickers in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of stickers with name, description, and format`,
      inputSchema: ListStickersSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListStickersInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const stickers = await guild.stickers.fetch();
        const stickerList = stickers.map(sticker => ({
          id: sticker.id,
          name: sticker.name,
          description: sticker.description,
          tags: sticker.tags,
          format: sticker.format,
          available: sticker.available,
          url: sticker.url,
        }));

        const result = formatResponse(
          stickerList,
          params.response_format,
          (items) => items.map(s => `**${s.name}** (ID: ${s.id})\nDescription: ${s.description || 'None'}\nTags: ${s.tags || 'None'}`).join('\n\n')
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing stickers: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_sticker",
    {
      title: "Delete Sticker",
      description: `Delete a custom sticker from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - sticker_id (string): Discord sticker ID

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteStickerSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: DeleteStickerInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const sticker = await guild.stickers.fetch(params.sticker_id).catch(() => null);
        if (!sticker) {
          return {
            isError: true,
            content: [{ type: "text", text: `Sticker not found: ${params.sticker_id}` }],
          };
        }

        const name = sticker.name;
        await sticker.delete();

        return {
          content: [{ type: "text", text: `Deleted sticker: ${name}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting sticker: ${(error as Error).message}` }],
        };
      }
    }
  );
}
