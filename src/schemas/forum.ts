import { z } from "zod";
import { ChannelIdSchema, ResponseFormatSchema } from "./common.js";

// Forum posts (threads) live inside a forum channel. A post ID and a forum
// channel ID are both channel snowflakes, so they reuse ChannelIdSchema.

const AutoArchiveSchema = z.enum(["60", "1440", "4320", "10080"])
  .describe("Minutes of inactivity before the post auto-archives: '60' (1h), '1440' (1 day), '4320' (3 days), '10080' (1 week)");

const AppliedTagsSchema = z.array(ChannelIdSchema)
  .max(5)
  .describe("Tag IDs to apply to the post (max 5). Tag IDs come from the forum channel's available_tags");

export const CreateForumPostSchema = z.object({
  channel_id: ChannelIdSchema.describe("Forum channel ID to create the post in"),
  name: z.string()
    .min(1)
    .max(100)
    .describe("Post title (max 100 characters)"),
  content: z.string()
    .min(1)
    .max(2000)
    .describe("Content of the post's opening message (max 2000 characters)"),
  applied_tags: AppliedTagsSchema.optional(),
  auto_archive_duration: AutoArchiveSchema.optional(),
  response_format: ResponseFormatSchema
}).strict();

export const ListForumPostsSchema = z.object({
  channel_id: ChannelIdSchema.describe("Forum channel ID to list posts from"),
  include_archived: z.boolean()
    .default(false)
    .describe("Whether to also include archived (closed) posts"),
  response_format: ResponseFormatSchema
}).strict();

export const GetForumPostSchema = z.object({
  post_id: ChannelIdSchema.describe("Forum post (thread) ID"),
  response_format: ResponseFormatSchema
}).strict();

export const EditForumPostSchema = z.object({
  post_id: ChannelIdSchema.describe("Forum post (thread) ID"),
  name: z.string()
    .min(1)
    .max(100)
    .optional()
    .describe("New post title (max 100 characters)"),
  applied_tags: AppliedTagsSchema.optional()
    .describe("Replace the post's tags with this set of tag IDs (max 5). Supplying this replaces all existing tags"),
  archived: z.boolean()
    .optional()
    .describe("Set true to archive (close) the post, false to reopen it"),
  locked: z.boolean()
    .optional()
    .describe("Set true to lock the post (only moderators can send messages), false to unlock"),
  pinned: z.boolean()
    .optional()
    .describe("Set true to pin the post to the top of the forum, false to unpin"),
  auto_archive_duration: AutoArchiveSchema.optional(),
  response_format: ResponseFormatSchema
}).strict();

export const DeleteForumPostSchema = z.object({
  post_id: ChannelIdSchema.describe("Forum post (thread) ID to delete")
}).strict();

// Type exports
export type CreateForumPostInput = z.infer<typeof CreateForumPostSchema>;
export type ListForumPostsInput = z.infer<typeof ListForumPostsSchema>;
export type GetForumPostInput = z.infer<typeof GetForumPostSchema>;
export type EditForumPostInput = z.infer<typeof EditForumPostSchema>;
export type DeleteForumPostInput = z.infer<typeof DeleteForumPostSchema>;
