import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AuditLogEvent,
  GuildAuditLogsEntry,
  Routes,
  SnowflakeUtil,
  makeURLSearchParams,
  type RESTGetAPIAuditLogResult,
} from "discord.js";
import {
  KickMemberSchema,
  BanMemberSchema,
  UnbanMemberSchema,
  TimeoutMemberSchema,
  ListBansSchema,
  PruneMembersSchema,
  GetAuditLogSchema,
  auditLogEventCodes,
  auditLogEventNames,
  ListAutoModRulesSchema,
  GetAutoModRuleSchema,
  CreateAutoModRuleSchema,
  EditAutoModRuleSchema,
  DeleteAutoModRuleSchema,
  type KickMemberInput,
  type BanMemberInput,
  type UnbanMemberInput,
  type TimeoutMemberInput,
  type ListBansInput,
  type PruneMembersInput,
  type GetAuditLogInput,
  type ListAutoModRulesInput,
  type GetAutoModRuleInput,
  type CreateAutoModRuleInput,
  type EditAutoModRuleInput,
  type DeleteAutoModRuleInput,
} from "../schemas/index.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";
import { ResponseFormat } from "../types.js";

export function registerModerationTools(server: McpServer) {
  server.registerTool(
    "discord_kick_member",
    {
      title: "Kick Discord Member",
      description: `Kick a member from a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to kick
  - reason (string, optional): Reason for kick (visible in audit log)

Returns:
  Confirmation of kick`,
      inputSchema: KickMemberSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: KickMemberInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const member = await guild.members.fetch(params.user_id);
        await member.kick(params.reason);

        return {
          content: [{ type: "text", text: `Kicked user ${params.user_id} from ${guild.name}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error kicking member: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_ban_member",
    {
      title: "Ban Discord Member",
      description: `Ban a member from a Discord server.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to ban
  - reason (string, optional): Reason for ban (visible in audit log)
  - delete_message_days (number): Days of messages to delete (0-7, default: 0)

Returns:
  Confirmation of ban`,
      inputSchema: BanMemberSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: BanMemberInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        await guild.members.ban(params.user_id, {
          reason: params.reason,
          deleteMessageSeconds: params.delete_message_days ? params.delete_message_days * 86400 : undefined,
        });

        return {
          content: [{ type: "text", text: `Banned user ${params.user_id} from ${guild.name}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error banning member: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_unban_member",
    {
      title: "Unban Discord Member",
      description: `Remove a ban from a user.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to unban

Returns:
  Confirmation of unban`,
      inputSchema: UnbanMemberSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: UnbanMemberInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        await guild.members.unban(params.user_id);

        return {
          content: [{ type: "text", text: `Unbanned user ${params.user_id} from ${guild.name}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error unbanning member: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_timeout_member",
    {
      title: "Timeout Member",
      description: `Timeout (mute) a member for a specified duration. They cannot send messages, react, or join voice.

Args:
  - guild_id (string): Discord server/guild ID
  - user_id (string): Discord user ID to timeout
  - duration_minutes (number): Timeout duration in minutes (0 to remove, max 40320 = 28 days)
  - reason (string, optional): Reason for timeout (visible in audit log)

Returns:
  Confirmation of timeout`,
      inputSchema: TimeoutMemberSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: TimeoutMemberInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const member = await guild.members.fetch(params.user_id).catch(() => null);
        if (!member) {
          return {
            isError: true,
            content: [{ type: "text", text: `Member not found: ${params.user_id}` }],
          };
        }

        if (params.duration_minutes === 0) {
          await member.timeout(null, params.reason);
          return {
            content: [{ type: "text", text: `Removed timeout from ${member.user.username}` }],
          };
        }

        const timeoutMs = params.duration_minutes * 60 * 1000;
        await member.timeout(timeoutMs, params.reason);

        return {
          content: [{ type: "text", text: `Timed out ${member.user.username} for ${params.duration_minutes} minutes` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error timing out member: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_list_bans",
    {
      title: "List Bans",
      description: `List all banned users in a server.

Args:
  - guild_id (string): Discord server/guild ID
  - limit (number): Number of bans to return (1-1000, default 100)
  - response_format ('json' | 'markdown'): Output format

Returns:
  List of banned users with reasons`,
      inputSchema: ListBansSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListBansInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const bans = await guild.bans.fetch({ limit: params.limit });
        const banList = bans.map(ban => ({
          userId: ban.user.id,
          username: ban.user.username,
          reason: ban.reason || 'No reason provided',
        }));

        const result = formatResponse(
          banList,
          params.response_format,
          (b) => `**${b.username}** (${b.userId})\nReason: ${b.reason}`
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing bans: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_prune_members",
    {
      title: "Prune Members",
      description: `Remove inactive members from the server.

Args:
  - guild_id (string): Discord server/guild ID
  - days (number): Days of inactivity required (1-30)
  - include_roles (string[], optional): Role IDs to include in prune (by default only members without roles)
  - dry_run (boolean): If true, returns count without actually pruning (default true)

Returns:
  Number of members pruned (or would be pruned if dry_run)`,
      inputSchema: PruneMembersSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: PruneMembersInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        if (params.dry_run) {
          const count = await guild.members.prune({
            days: params.days,
            roles: params.include_roles,
            dry: true,
          });

          return {
            content: [{ type: "text", text: `Dry run: ${count} members would be pruned (inactive for ${params.days}+ days)` }],
          };
        }

        const pruned = await guild.members.prune({
          days: params.days,
          roles: params.include_roles,
          dry: false,
        });

        return {
          content: [{ type: "text", text: `Pruned ${pruned} members (inactive for ${params.days}+ days)` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error pruning members: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_get_audit_log",
    {
      title: "Get Audit Log",
      description: `Get Discord audit log entries with actor, target, changes, and event details. Requires View Audit Log.

Filter by user ID and by event code or name, including CHANNEL_POSITION_UPDATE and ROLE_POSITION_UPDATE. Discord can merge repeated actions into one entry, with options.count giving the combined count for these events.

Use before for older entries or after for newer entries. JSON returns an array by default. Set include_pagination or supply a cursor to get an object with entries and a continuation cursor when the page is full.`,
      inputSchema: GetAuditLogSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetAuditLogInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const action = typeof params.action_type === "string" ? auditLogEventCodes[params.action_type] : params.action_type;
        const query = makeURLSearchParams({
          limit: params.limit,
          user_id: params.user_id,
          action_type: action,
          before: params.before,
          after: params.after,
        });
        const auditLogs = await client.rest.get(Routes.guildAuditLog(guild.id), { query }) as RESTGetAPIAuditLogResult;
        const users = new Map(auditLogs.users.map(user => [user.id, user]));
        const entries = auditLogs.audit_log_entries.map(entry => {
          const { action_type, target_id, user_id } = entry;
          const executor = user_id ? users.get(user_id) ?? client.users.cache.get(user_id) : undefined;
          let target = "Unknown";
          if (target_id) {
            const cachedTarget = client.channels.cache.get(target_id) ?? guild.roles.cache.get(target_id)
              ?? client.users.cache.get(target_id) ?? guild.emojis.cache.get(target_id);
            target = cachedTarget?.toString() ?? (users.has(target_id) ? `<@${target_id}>` : target_id);
          }
          const isReorder = action_type === AuditLogEvent.ChannelPositionUpdate || action_type === AuditLogEvent.RolePositionUpdate;
          return {
            id: entry.id,
            action: action_type,
            actionName: auditLogEventNames[action_type],
            actionType: isReorder ? "Update" : GuildAuditLogsEntry.actionType(action_type),
            executor: executor?.username || "Unknown",
            executorId: user_id ?? undefined,
            target,
            targetId: target_id,
            reason: entry.reason || "No reason",
            createdAt: new Date(SnowflakeUtil.timestampFrom(entry.id)).toISOString(),
            changes: entry.changes?.map(c => ({ key: c.key, old: c.old_value, new: c.new_value })) ?? [],
            options: entry.options,
          };
        });

        const paginated = params.include_pagination || params.before !== undefined || params.after !== undefined;
        const cursor = paginated && entries.length === params.limit ? entries.at(-1)?.id : undefined;
        const cursorKey = params.after === undefined ? "next_before" : "next_after";
        const markdown = () => {
          const list = formatResponse(entries, ResponseFormat.MARKDOWN, entry => {
            const details = entry.options ? `\n**Details** ${JSON.stringify(entry.options)}` : "";
            return `**${entry.actionName ?? `Action ${entry.action}`}** by ${entry.executor}\n**Target** ${entry.target}\n**Reason** ${entry.reason}\n**Time** ${entry.createdAt}${details}`;
          });
          return cursor ? `Continue with ${cursorKey === "next_before" ? "before" : "after"} set to \`${cursor}\`.\n\n${list}` : list;
        };
        const result = params.response_format === ResponseFormat.JSON
          ? JSON.stringify(paginated ? { entries, [cursorKey]: cursor } : entries, null, 2)
          : truncateIfNeeded(markdown());

        return {
          content: [{ type: "text", text: result }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching audit log: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_list_automod_rules",
    {
      title: "List Auto Moderation Rules",
      description: `List all auto moderation rules for a server.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  List of auto moderation rules`,
      inputSchema: ListAutoModRulesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: ListAutoModRulesInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const rules = await guild.autoModerationRules.fetch();
        const ruleList = rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled,
          eventType: rule.eventType,
          triggerType: rule.triggerType,
          actions: rule.actions.map(a => ({ type: a.type, metadata: a.metadata })),
        }));

        const text = formatResponse(
          ruleList,
          params.response_format,
          (r) => `**${r.name}** (${r.id})\nEnabled: ${r.enabled}\nTrigger: ${r.triggerType}\nActions: ${r.actions.map(a => a.type).join(', ')}`
        );

        return {
          content: [{ type: "text", text: truncateIfNeeded(text) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing auto moderation rules: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_get_automod_rule",
    {
      title: "Get Auto Moderation Rule",
      description: `Get details of a specific auto moderation rule.

Args:
  - guild_id (string): Discord server/guild ID
  - rule_id (string): Auto moderation rule ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Auto moderation rule details`,
      inputSchema: GetAutoModRuleSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetAutoModRuleInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const rule = await guild.autoModerationRules.fetch(params.rule_id);

        const result = {
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled,
          eventType: rule.eventType,
          triggerType: rule.triggerType,
          triggerMetadata: rule.triggerMetadata,
          actions: rule.actions,
          exemptRoles: rule.exemptRoles.map(r => r.id),
          exemptChannels: rule.exemptChannels.map(c => c.id),
          creatorId: rule.creatorId,
        };

        const text = formatResponse(
          result,
          params.response_format,
          (r) => `**${r.name}** (${r.id})\nEnabled: ${r.enabled}\nEvent: ${r.eventType}\nTrigger: ${r.triggerType}\nExempt Roles: ${r.exemptRoles.length}\nExempt Channels: ${r.exemptChannels.length}`
        );

        return {
          content: [{ type: "text", text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting auto moderation rule: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_create_automod_rule",
    {
      title: "Create Auto Moderation Rule",
      description: `Create a new auto moderation rule for a server.

Args:
  - guild_id (string): Discord server/guild ID
  - name (string): Rule name
  - event_type ('message_send'): Event that triggers the rule
  - trigger_type ('keyword' | 'spam' | 'keyword_preset' | 'mention_spam'): Trigger type
  - trigger_metadata (object, optional): Trigger configuration (keyword_filter, presets, etc.)
  - actions (array): Actions to take (block_message, send_alert_message, timeout)
  - enabled (boolean): Whether rule is enabled (default: true)
  - exempt_roles (array, optional): Role IDs exempt from this rule
  - exempt_channels (array, optional): Channel IDs exempt from this rule

Returns:
  Created rule details`,
      inputSchema: CreateAutoModRuleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: CreateAutoModRuleInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const eventTypeMap: Record<string, number> = { message_send: 1 };
        const triggerTypeMap: Record<string, number> = { keyword: 1, spam: 3, keyword_preset: 4, mention_spam: 5 };
        const actionTypeMap: Record<string, number> = { block_message: 1, send_alert_message: 2, timeout: 3 };

        const rule = await guild.autoModerationRules.create({
          name: params.name,
          eventType: eventTypeMap[params.event_type],
          triggerType: triggerTypeMap[params.trigger_type],
          triggerMetadata: params.trigger_metadata ? {
            keywordFilter: params.trigger_metadata.keyword_filter,
            regexPatterns: params.trigger_metadata.regex_patterns,
            presets: params.trigger_metadata.presets?.map(p => p === 'profanity' ? 1 : p === 'sexual_content' ? 2 : 3),
            allowList: params.trigger_metadata.allow_list,
            mentionTotalLimit: params.trigger_metadata.mention_total_limit,
          } : undefined,
          actions: params.actions.map(a => ({
            type: actionTypeMap[a.type],
            metadata: a.metadata ? {
              channelId: a.metadata.channel_id,
              durationSeconds: a.metadata.duration_seconds,
            } : undefined,
          })),
          enabled: params.enabled,
          exemptRoles: params.exempt_roles,
          exemptChannels: params.exempt_channels,
        });

        return {
          content: [{ type: "text", text: `Created auto moderation rule "${rule.name}" (${rule.id})` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error creating auto moderation rule: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_edit_automod_rule",
    {
      title: "Edit Auto Moderation Rule",
      description: `Edit an existing auto moderation rule.

Args:
  - guild_id (string): Discord server/guild ID
  - rule_id (string): Auto moderation rule ID
  - name (string, optional): New rule name
  - trigger_metadata (object, optional): New trigger configuration
  - actions (array, optional): New actions
  - enabled (boolean, optional): Enable/disable rule
  - exempt_roles (array, optional): New exempt roles
  - exempt_channels (array, optional): New exempt channels

Returns:
  Updated rule details`,
      inputSchema: EditAutoModRuleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EditAutoModRuleInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const rule = await guild.autoModerationRules.fetch(params.rule_id);
        const actionTypeMap: Record<string, number> = { block_message: 1, send_alert_message: 2, timeout: 3 };

        const updateData: any = {};
        if (params.name !== undefined) updateData.name = params.name;
        if (params.enabled !== undefined) updateData.enabled = params.enabled;
        if (params.exempt_roles !== undefined) updateData.exemptRoles = params.exempt_roles;
        if (params.exempt_channels !== undefined) updateData.exemptChannels = params.exempt_channels;
        if (params.trigger_metadata !== undefined) {
          updateData.triggerMetadata = {
            keywordFilter: params.trigger_metadata.keyword_filter,
            regexPatterns: params.trigger_metadata.regex_patterns,
            presets: params.trigger_metadata.presets?.map(p => p === 'profanity' ? 1 : p === 'sexual_content' ? 2 : 3),
            allowList: params.trigger_metadata.allow_list,
            mentionTotalLimit: params.trigger_metadata.mention_total_limit,
          };
        }
        if (params.actions !== undefined) {
          updateData.actions = params.actions.map(a => ({
            type: actionTypeMap[a.type],
            metadata: a.metadata ? {
              channelId: a.metadata.channel_id,
              durationSeconds: a.metadata.duration_seconds,
            } : undefined,
          }));
        }

        const updated = await rule.edit(updateData);

        return {
          content: [{ type: "text", text: `Updated auto moderation rule "${updated.name}" (${updated.id})` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing auto moderation rule: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_delete_automod_rule",
    {
      title: "Delete Auto Moderation Rule",
      description: `Delete an auto moderation rule from a server.

Args:
  - guild_id (string): Discord server/guild ID
  - rule_id (string): Auto moderation rule ID to delete

Returns:
  Confirmation of deletion`,
      inputSchema: DeleteAutoModRuleSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: DeleteAutoModRuleInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const rule = await guild.autoModerationRules.fetch(params.rule_id);
        const ruleName = rule.name;
        await rule.delete();

        return {
          content: [{ type: "text", text: `Deleted auto moderation rule "${ruleName}" (${params.rule_id})` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error deleting auto moderation rule: ${(error as Error).message}` }],
        };
      }
    }
  );
}
