import { ButtonStyle, ComponentType, type AttachmentPayload, type BaseMessageOptions } from "discord.js";
import { MAX_MESSAGE_UPLOAD_BYTES } from "../constants.js";
import type { SendMessageInput } from "../schemas/message.js";

type MessageContentInput = Omit<SendMessageInput, "channel_id" | "reply_to" | "content">;

export function requireMessageContent({ content, embeds, files, link_buttons }: MessageContentInput & { content?: string }) {
  if (content === undefined && !embeds?.length && !files?.length && !link_buttons?.length) {
    throw new Error("Provide message text, an embed, a file, or a link button");
  }
}

export function prepareMessageContent({ embeds, files, link_buttons, allowed_mentions }: MessageContentInput): BaseMessageOptions {
  let embedCharacters = 0;
  for (const { title, description, author, footer, fields } of embeds ?? []) {
    embedCharacters += (title?.length ?? 0) + (description?.length ?? 0) +
      (author?.name.length ?? 0) + (footer?.text.length ?? 0);
    for (const field of fields ?? []) {
      embedCharacters += field.name.length + field.value.length;
    }
  }
  if (embedCharacters > 6000) throw new Error("Embeds can contain at most 6000 total text characters");

  let uploadBytes = 0;
  const attachments = files?.map(({ filename, data_base64, description, is_spoiler }): AttachmentPayload => {
    if (data_base64.length % 4 !== 0) throw new Error(`Invalid base64 file data for ${filename}`);
    uploadBytes += Buffer.byteLength(data_base64, "base64");
    if (uploadBytes > MAX_MESSAGE_UPLOAD_BYTES) throw new Error("Uploads can contain at most 20 MiB of file data per call");
    let name = filename;
    if (is_spoiler === true && !name.startsWith("SPOILER_")) name = `SPOILER_${name}`;
    if (is_spoiler === false) name = name.replace(/^(?:SPOILER_)+/, "");
    return { attachment: Buffer.from(data_base64, "base64"), name, description };
  });

  const components: NonNullable<BaseMessageOptions["components"]>[number][] = [];
  for (let start = 0; link_buttons && start < link_buttons.length; start += 5) {
    components.push({
      type: ComponentType.ActionRow,
      components: link_buttons.slice(start, start + 5).map(({ label, url }) => ({
        type: ComponentType.Button,
        style: ButtonStyle.Link,
        label,
        url,
      })),
    });
  }

  return {
    embeds,
    files: attachments,
    components: link_buttons === undefined ? undefined : components,
    allowedMentions: allowed_mentions === undefined ? undefined : {
      parse: [],
      roles: allowed_mentions.role_ids,
      users: allowed_mentions.user_ids,
      repliedUser: allowed_mentions.replied_user ?? false,
    },
  };
}
