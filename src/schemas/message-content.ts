import { z } from "zod";
import { MAX_MESSAGE_ATTACHMENTS, MAX_MESSAGE_LENGTH, MAX_MESSAGE_UPLOAD_BASE64_LENGTH } from "../constants.js";
import { MessageIdSchema, RoleIdSchema, UserIdSchema } from "./common.js";

const WebUrlSchema = z.string().max(2048).url().regex(/^https?:\/\//i, "Expected an HTTP or HTTPS URL");
const EmbedMediaUrlSchema = z.union([
  WebUrlSchema,
  z.string().max(2048).regex(/^attachment:\/\/[^/\\\x00-\x1F\x7F]+$/),
]);
const EmbedSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().min(1).max(4096).optional(),
  url: WebUrlSchema.optional(),
  color: z.number().int().min(0).max(0xffffff).optional().describe("RGB color as an integer"),
  timestamp: z.iso.datetime({ offset: true }).optional(),
  author: z.object({
    name: z.string().min(1).max(256),
    url: WebUrlSchema.optional(),
    icon_url: EmbedMediaUrlSchema.optional(),
  }).strict().optional(),
  footer: z.object({
    text: z.string().min(1).max(2048),
    icon_url: EmbedMediaUrlSchema.optional(),
  }).strict().optional(),
  image: z.object({ url: EmbedMediaUrlSchema }).strict().optional(),
  thumbnail: z.object({ url: EmbedMediaUrlSchema }).strict().optional(),
  fields: z.array(z.object({
    name: z.string().min(1).max(256),
    value: z.string().min(1).max(1024),
    inline: z.boolean().optional(),
  }).strict()).max(25).optional(),
}).strict();

export const AllowedMentionsSchema = z.object({
  role_ids: z.array(RoleIdSchema).max(100).optional(),
  user_ids: z.array(UserIdSchema).max(100).optional(),
}).strict().describe("Limit pings to the supplied user and role IDs. An empty object suppresses all pings.");

const AttachmentDescriptionSchema = z.string().max(1024).describe("Attachment description or alt text");
const FileSchema = z.object({
  filename: z.string().min(1).max(1024).regex(/^[^/\\\x00-\x1F\x7F]+$/, "Expected a filename without a path"),
  data_base64: z.string().min(4).max(MAX_MESSAGE_UPLOAD_BASE64_LENGTH)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Expected base64 file data without a data URL prefix"),
  description: AttachmentDescriptionSchema.optional(),
  is_spoiler: z.boolean().optional(),
}).strict();

export const AttachmentUpdatesSchema = z.array(z.object({
  attachment_id: MessageIdSchema.describe("ID from the message's attachmentDetails"),
  description: AttachmentDescriptionSchema.nullable().optional().describe("New description or alt text. Pass null to clear it."),
  is_spoiler: z.boolean().optional(),
}).strict().refine(update => update.description !== undefined || update.is_spoiler !== undefined, {
  message: "Provide a description or is_spoiler for this attachment",
})).min(1).max(MAX_MESSAGE_ATTACHMENTS)
  .describe("Edit descriptions or spoiler flags on existing attachments and keep every file");

export const MessageContentFields = {
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH).optional().describe("Message text (up to 2000 characters)"),
  embeds: z.array(EmbedSchema).max(10).optional().describe("Rich embeds (up to 10, 6000 text characters across all embeds)"),
  files: z.array(FileSchema).min(1).max(MAX_MESSAGE_ATTACHMENTS).optional()
    .describe("Base64 attachments (up to 10 files and 20 MiB of decoded data per call)"),
  link_buttons: z.array(z.object({
    label: z.string().min(1).max(80),
    url: WebUrlSchema.max(512),
  }).strict()).max(25).optional().describe("Link buttons that open URLs, with up to 5 buttons per row"),
  allowed_mentions: AllowedMentionsSchema.optional(),
};
