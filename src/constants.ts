// Shared constants for Discord MCP Server

export const CHARACTER_LIMIT = 50000;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MAX_MESSAGE_LENGTH = 2000; // Discord's message limit
export const MAX_MESSAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_MESSAGE_UPLOAD_BASE64_LENGTH = 4 * Math.ceil(MAX_MESSAGE_UPLOAD_BYTES / 3);
export const MAX_MESSAGE_ATTACHMENTS = 10;
export const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PROFILE_IMAGE_BASE64_LENGTH = 4 * Math.ceil(MAX_PROFILE_IMAGE_BYTES / 3);
