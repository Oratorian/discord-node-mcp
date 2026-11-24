import { z } from "zod";
import { MAX_PROFILE_IMAGE_BASE64_LENGTH } from "../constants.js";
import { GuildIdSchema } from "./common.js";

export const ProfileImageDataPattern = /^data:(image\/(?:png|jpeg|gif));base64,([A-Za-z0-9+/]+={0,2})$/;

const ProfileImageDataSchema = z.string()
  .max(MAX_PROFILE_IMAGE_BASE64_LENGTH + "data:image/jpeg;base64,".length)
  .regex(ProfileImageDataPattern, "Expected a PNG, JPEG, or GIF base64 data URI");

const ProfileImageUrlSchema = z.string().url().regex(
  /^https:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\//i,
  "Expected an HTTPS Discord CDN URL"
);

const ProfileImageSchema = z.union([ProfileImageDataSchema, ProfileImageUrlSchema]).nullable().optional();

const ProfileImages = {
  avatar: ProfileImageSchema.describe("PNG, JPEG, or GIF avatar as a base64 data URI or Discord CDN URL. Pass null to clear."),
  banner: ProfileImageSchema.describe("PNG, JPEG, or GIF banner as a base64 data URI or Discord CDN URL. Pass null to clear."),
};

export const UpdateBotProfileSchema = z.object(ProfileImages).strict();

export const UpdateBotGuildProfileSchema = z.object({
  guild_id: GuildIdSchema,
  nickname: z.string().trim().min(1).max(32).nullable().optional()
    .describe("Bot nickname in this server (1-32 characters). Pass null to clear."),
  ...ProfileImages,
}).strict();
