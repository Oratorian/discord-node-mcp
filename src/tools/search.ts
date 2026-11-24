import { setTimeout } from "node:timers/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeURLSearchParams, Routes, type RESTGetAPIGuildMessagesSearchResult } from "discord.js";
import { MAX_MESSAGE_SEARCH_OFFSET, SearchGuildMessagesSchema } from "../schemas/search.js";
import { formatApiMessage, formatResponse, getClient, messageToMarkdown, truncateIfNeeded } from "../services/discord.js";
import { ResponseFormat } from "../types.js";

const MIN_SEARCH_RETRY_MS = 250;
const MAX_SEARCH_RETRY_MS = 2000;

export function registerSearchTools(server: McpServer) {
  server.registerTool(
    "discord_search_guild_messages",
    {
      title: "Search Discord Guild Messages",
      description: "Search a Discord server's message history using text, author, channel, and other filters. The bot needs the Message Content intent and Read Message History. Use next_offset to request another page. Discord may need time to index the messages and provide a retry delay.",
      inputSchema: SearchGuildMessagesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ guild_id, response_format, ...filters }, { signal }) => {
      try {
        const client = await getClient();
        const route = Routes.guildMessagesSearch(guild_id);
        const query = makeURLSearchParams(filters);
        const search = () => client.rest.get(route, { query, signal }) as Promise<RESTGetAPIGuildMessagesSearchResult>;
        let result = await search();
        if ("retry_after" in result) {
          const delay = Math.max(MIN_SEARCH_RETRY_MS, result.retry_after * 1000);
          if (delay <= MAX_SEARCH_RETRY_MS) {
            await setTimeout(delay, undefined, { signal });
            result = await search();
          }
        }

        if ("retry_after" in result) {
          const indexStatus = {
            status: "indexing",
            code: result.code,
            documents_indexed: result.documents_indexed,
            retry_after_seconds: Math.max(MIN_SEARCH_RETRY_MS / 1000, result.retry_after),
          };
          const text = formatResponse(indexStatus, response_format, ({ retry_after_seconds }) =>
            `Discord is indexing the message history. Retry the same search in ${retry_after_seconds} seconds.`
          );
          return { content: [{ type: "text", text }] };
        }

        const items = result.messages.flat().map(message => ({
          ...formatApiMessage(message),
          pinned: message.pinned,
          url: `https://discord.com/channels/${guild_id}/${message.channel_id}/${message.id}`,
        }));
        // Discord can return a short page even when another page is available.
        const next = filters.offset + filters.limit;
        const page = {
          status: "results",
          items,
          count: items.length,
          offset: filters.offset,
          limit: filters.limit,
          total_results: result.total_results,
          next_offset: next <= MAX_MESSAGE_SEARCH_OFFSET && next < result.total_results ? next : undefined,
          doing_deep_historical_index: result.doing_deep_historical_index,
          documents_indexed: result.documents_indexed,
        };
        const text = formatResponse(page, response_format, data => {
          const summary = `${data.count} results at offset ${data.offset}. Discord estimates ${data.total_results} matches.`;
          const nextPage = data.next_offset === undefined ? "" : `\nUse offset ${data.next_offset} for the next page.`;
          const indexing = data.doing_deep_historical_index ? "\nDiscord is still indexing older messages." : "";
          const messages = data.items.map(message => `${messageToMarkdown(message)}\n[Open message](${message.url})`);
          return [summary + nextPage + indexing, ...messages].join("\n\n");
        });
        return { content: [{ type: "text", text: response_format === ResponseFormat.JSON ? text : truncateIfNeeded(text) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Could not search Discord messages. ${(error as Error).message}` }],
        };
      }
    },
  );
}
