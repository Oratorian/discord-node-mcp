import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Routes, type APIMessage, type Client } from "discord.js";
import { CreatePollSchema, PollMessageSchema } from "../schemas/poll.js";
import { formatResponse, getClient } from "../services/discord.js";
import type { ResponseFormat } from "../types.js";

async function respondWithPoll(
  operation: string,
  responseFormat: ResponseFormat,
  request: (client: Client) => Promise<APIMessage>,
) {
  try {
    const message = await request(await getClient());
    const poll = message.poll;
    if (!poll) throw new Error(`Message ${message.id} does not contain a poll`);

    const counts = new Map(poll.results?.answer_counts.map(answer => [answer.id, answer.count]));
    const result = {
      channel_id: message.channel_id,
      message_id: message.id,
      author_id: message.author.id,
      question: poll.question.text ?? null,
      answers: poll.answers.map(answer => ({
        id: answer.answer_id,
        text: answer.poll_media.text ?? null,
        emoji: answer.poll_media.emoji ?? null,
        votes: poll.results ? counts.get(answer.answer_id) ?? 0 : null,
      })),
      expires_at: poll.expiry,
      allow_multiselect: poll.allow_multiselect,
      results_finalized: poll.results?.is_finalized ?? null,
    };
    const text = formatResponse(result, responseFormat, data => {
      const lines = [`### ${data.question ?? "Discord poll"}`, `Message ID ${data.message_id}`];
      if (data.expires_at) lines.push(`Expires ${data.expires_at}`);
      const status = data.results_finalized === null ? "Vote counts unavailable"
        : data.results_finalized ? "Final vote counts" : "Provisional vote counts";
      lines.push(status, ...data.answers.map(answer => {
        const emoji = answer.emoji?.name ? `${answer.emoji.name} ` : "";
        const votes = answer.votes === null ? "" : ` (${answer.votes} votes)`;
        return `- ${emoji}${answer.text ?? `Answer ${answer.id}`}${votes}`;
      }));
      return lines.join("\n");
    });
    return { content: [{ type: "text" as const, text }] };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Could not ${operation} Discord poll. ${(error as Error).message}` }],
    };
  }
}

export function registerPollTools(server: McpServer) {
  server.registerTool(
    "discord_create_poll",
    {
      title: "Create Discord Poll",
      description: "Post a native Discord poll. Specify the question, up to 10 answers, duration, and whether multiple answers are allowed. Requires Send Polls in the channel.",
      inputSchema: CreatePollSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    ({ channel_id, question, answers, duration_hours, allow_multiselect, response_format }) => {
      const body = {
        poll: {
          question: { text: question },
          answers: answers.map(poll_media => ({ poll_media })),
          duration: duration_hours,
          allow_multiselect,
        },
      };
      return respondWithPoll("create", response_format, async client =>
        await client.rest.post(Routes.channelMessages(channel_id), { body }) as APIMessage,
      );
    },
  );

  server.registerTool(
    "discord_get_poll",
    {
      title: "Get Discord Poll",
      description: "Read a poll by channel and message ID. Returns the answers, counts when Discord provides them, and whether the tally is final.",
      inputSchema: PollMessageSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    ({ channel_id, message_id, response_format }) => respondWithPoll("get", response_format, async client =>
      await client.rest.get(Routes.channelMessage(channel_id, message_id)) as APIMessage,
    ),
  );

  server.registerTool(
    "discord_end_poll",
    {
      title: "End Discord Poll",
      description: "Close a poll created by the bot and return the latest results. Discord may still be finalizing the vote counts.",
      inputSchema: PollMessageSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    ({ channel_id, message_id, response_format }) => respondWithPoll("end", response_format, async client =>
      await client.rest.post(Routes.expirePoll(channel_id, message_id)) as APIMessage,
    ),
  );
}
