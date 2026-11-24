import { MAX_PROFILE_IMAGE_BYTES } from "../constants.js";
import { ProfileImageDataPattern } from "../schemas/profile.js";

const imageSizeError = "Profile images must be at most 10 MiB";

export async function resolveProfileImage(image: string | null | undefined): Promise<string | null | undefined> {
  if (image == null) return image;

  const inlineImage = ProfileImageDataPattern.exec(image);
  if (inlineImage) {
    const base64 = inlineImage[2];
    if (base64.length % 4 !== 0) throw new Error("Invalid base64 profile image");
    if (Buffer.byteLength(base64, "base64") > MAX_PROFILE_IMAGE_BYTES) throw new Error(imageSizeError);
    return image;
  }

  const url = new URL(image);
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !["cdn.discordapp.com", "media.discordapp.net"].includes(url.hostname)) {
    throw new Error("Profile image URLs must point to the Discord CDN over HTTPS");
  }

  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(`Could not download the profile image (HTTP ${response.status})`);
  }
  if (contentType !== "image/png" && contentType !== "image/jpeg" && contentType !== "image/gif") {
    await response.body.cancel();
    throw new Error("Profile images must be PNG, JPEG, or GIF");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PROFILE_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error(imageSizeError);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size === 0) throw new Error("The profile image is empty");

  return `data:${contentType};base64,${Buffer.concat(chunks, size).toString("base64")}`;
}
