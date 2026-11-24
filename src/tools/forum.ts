import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CreateForumPostSchema,
  ListForumPostsSchema,
  GetForumPostSchema,
  EditForumPostSchema,
  DeleteForumPostSchema,
  type CreateForumPostInput,
  type ListForumPostsInput,
  type GetForumPostInput,
  type EditForumPostInput,
  type DeleteForumPostInput,
} from "../schemas/index.js";
import {
  getClient,
  formatForumPost,
  forumPostToMarkdown,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { ChannelType, ForumChannel, ThreadChannel } from "discord.js";
import { ResponseFormat } from "../types.js";

/**
 * Fetch a channel by ID, falling back to an API fetch when it is not cached.
 * Freshly created forum channels/posts are frequently not in the cache.
 */
async function fetchChannel(client: Awaited<ReturnType<typeof getClient>>, id: string) {
  return client.channels.cache.get(id) ?? (await client.channels.fetch(id));
}

export function registerForumTools(server: McpServer) {
  server.registerTool(
    "discord_create_forum_post",
    {
      title: "Create Discord Forum Post",
      description: `Create a new post (thread) in a Discord forum channel.

To reply within an existing forum post, use discord_send_message with the post's ID as the channel_id.

Args:
  - channel_id (string): Forum channel ID to create the post in
  - name (string): Post title (max 100 characters)
  - content (string): Content of the opening message (max 2000 characters)
  - applied_tags (string[], optional): Tag IDs to apply (max 5, from the forum's available tags)
  - auto_archive_duration ('60' | '1440' | '4320' | '10080', optional): Minutes before auto-archive
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  The created forum post details including its ID`,
      inputSchema: CreateForumPostSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateForumPostInput) => {
      try {
        const client = await getClient();
        const channel = await fetchChannel(client, params.channel_id);

        if (!channel || channel.type !== ChannelType.GuildForum) {
          return {
            isError: true,
            content: [{ type: "text", text: `Forum channel not found: ${params.channel_id}` }],
          };
        }

        const options: any = {
          name: params.name,
          message: { content: params.content },
        };
        if (params.applied_tags) options.appliedTags = params.applied_tags;
        if (params.auto_archive_duration) {
          options.autoArchiveDuration = parseInt(params.auto_archive_duration, 10);
        }

        const thread = await (channel as ForumChannel).threads.create(options);

        const text = formatResponse(
          formatForumPost(thread),
          params.response_format,
          forumPostToMarkdown
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating forum post: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_list_forum_posts",
    {
      title: "List Discord Forum Posts",
      description: `List posts (threads) in a Discord forum channel.

Args:
  - channel_id (string): Forum channel ID to list posts from
  - include_archived (boolean): Also include archived/closed posts (default: false)
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of forum posts with their tags and status`,
      inputSchema: ListForumPostsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListForumPostsInput) => {
      try {
        const client = await getClient();
        const channel = await fetchChannel(client, params.channel_id);

        if (!channel || channel.type !== ChannelType.GuildForum) {
          return {
            isError: true,
            content: [{ type: "text", text: `Forum channel not found: ${params.channel_id}` }],
          };
        }

        const forum = channel as ForumChannel;
        const active = await forum.threads.fetchActive();
        const threads = new Map<string, ThreadChannel>(active.threads);

        if (params.include_archived) {
          const archived = await forum.threads.fetchArchived();
          for (const [id, thread] of archived.threads) {
            if (!threads.has(id)) threads.set(id, thread);
          }
        }

        const formatted = Array.from(threads.values()).map((t) => formatForumPost(t));

        const text = formatted.length === 0 && params.response_format === ResponseFormat.MARKDOWN
          ? "No forum posts found in this channel."
          : formatResponse(formatted, params.response_format, forumPostToMarkdown);

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing forum posts: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_get_forum_post",
    {
      title: "Get Discord Forum Post",
      description: `Get details of a single forum post (thread).

Args:
  - post_id (string): Forum post (thread) ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  The forum post details including tags, status, and message count`,
      inputSchema: GetForumPostSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetForumPostInput) => {
      try {
        const client = await getClient();
        const channel = await fetchChannel(client, params.post_id);

        if (!channel || !channel.isThread()) {
          return {
            isError: true,
            content: [{ type: "text", text: `Forum post not found: ${params.post_id}` }],
          };
        }

        const text = formatResponse(
          formatForumPost(channel as ThreadChannel),
          params.response_format,
          forumPostToMarkdown
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting forum post: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_edit_forum_post",
    {
      title: "Edit Discord Forum Post",
      description: `Edit or moderate a forum post (thread): rename, retag, archive, lock, or pin.

Args:
  - post_id (string): Forum post (thread) ID
  - name (string, optional): New post title (max 100 characters)
  - applied_tags (string[], optional): Replace the post's tags with these tag IDs (max 5)
  - archived (boolean, optional): true to archive/close, false to reopen
  - locked (boolean, optional): true to lock (mods only can post), false to unlock
  - pinned (boolean, optional): true to pin to top of forum, false to unpin
  - auto_archive_duration ('60' | '1440' | '4320' | '10080', optional): Minutes before auto-archive

Returns:
  The updated forum post details`,
      inputSchema: EditForumPostSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EditForumPostInput) => {
      try {
        const client = await getClient();
        const channel = await fetchChannel(client, params.post_id);

        if (!channel || !channel.isThread()) {
          return {
            isError: true,
            content: [{ type: "text", text: `Forum post not found: ${params.post_id}` }],
          };
        }

        const thread = channel as ThreadChannel;
        const edits: any = {};
        if (params.name !== undefined) edits.name = params.name;
        if (params.applied_tags !== undefined) edits.appliedTags = params.applied_tags;
        if (params.archived !== undefined) edits.archived = params.archived;
        if (params.locked !== undefined) edits.locked = params.locked;
        if (params.auto_archive_duration !== undefined) {
          edits.autoArchiveDuration = parseInt(params.auto_archive_duration, 10);
        }

        if (Object.keys(edits).length > 0) {
          await thread.edit(edits);
        }

        // Pinning/unpinning a forum post to the top of the forum.
        if (params.pinned === true) {
          await thread.pin();
        } else if (params.pinned === false) {
          await thread.unpin();
        }

        const updated = await thread.fetch();

        const text = formatResponse(
          formatForumPost(updated as ThreadChannel),
          params.response_format,
          forumPostToMarkdown
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing forum post: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_forum_post",
    {
      title: "Delete Discord Forum Post",
      description: `Permanently delete a forum post (thread) and all its messages.

Args:
  - post_id (string): Forum post (thread) ID to delete

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteForumPostSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: DeleteForumPostInput) => {
      try {
        const client = await getClient();
        const channel = await fetchChannel(client, params.post_id);

        if (!channel || !channel.isThread()) {
          return {
            isError: true,
            content: [{ type: "text", text: `Forum post not found: ${params.post_id}` }],
          };
        }

        await (channel as ThreadChannel).delete();

        return {
          content: [{ type: "text", text: `Deleted forum post ${params.post_id}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting forum post: ${(error as Error).message}` }],
        };
      }
    }
  );
}
