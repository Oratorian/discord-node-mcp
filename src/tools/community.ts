import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GetWelcomeScreenSchema,
  EditWelcomeScreenSchema,
  GetOnboardingSchema,
  EditOnboardingSchema,
  SetupOnboardingSchema,
  SetupCommunitySchema,
  GetCommunitySettingsSchema,
  type GetWelcomeScreenInput,
  type EditWelcomeScreenInput,
  type GetOnboardingInput,
  type EditOnboardingInput,
  type SetupOnboardingInput,
  type SetupCommunityInput,
  type GetCommunitySettingsInput,
} from "../schemas/index.js";
import {
  getClient,
  formatResponse,
  truncateIfNeeded,
} from "../services/discord.js";

export function registerCommunityTools(server: McpServer) {
  // ============================================================================
  // WELCOME SCREEN TOOLS
  // ============================================================================

  server.registerTool(
    "discord_get_welcome_screen",
    {
      title: "Get Welcome Screen",
      description: `Get the welcome screen configuration for a server.

Requires the server to have Community features enabled.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Welcome screen settings including description and channels`,
      inputSchema: GetWelcomeScreenSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetWelcomeScreenInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const welcomeScreen = await guild.fetchWelcomeScreen();

        const result = {
          enabled: welcomeScreen.enabled,
          description: welcomeScreen.description,
          channels: welcomeScreen.welcomeChannels.map(ch => ({
            channelId: ch.channelId,
            description: ch.description,
            emoji: ch.emoji ? { id: ch.emoji.id, name: ch.emoji.name } : null,
          })),
        };

        const text = formatResponse(
          result,
          params.response_format,
          (data) => `**Welcome Screen**\nEnabled: ${data.enabled}\nDescription: ${data.description || 'None'}\n\n**Channels:**\n${data.channels.map(ch => `- <#${ch.channelId}>: ${ch.description} ${ch.emoji?.name || ''}`).join('\n')}`
        );

        return {
          content: [{ type: "text", text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting welcome screen: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_edit_welcome_screen",
    {
      title: "Edit Welcome Screen",
      description: `Edit the welcome screen configuration for a server.

Requires the server to have Community features enabled and bot must have MANAGE_GUILD permission.

Args:
  - guild_id (string): Discord server/guild ID
  - enabled (boolean, optional): Enable/disable the welcome screen
  - description (string, optional): Server description (max 140 chars)
  - welcome_channels (array, optional): Up to 5 channels to show (channel_id, description, emoji)

Returns:
  Updated welcome screen settings`,
      inputSchema: EditWelcomeScreenSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EditWelcomeScreenInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const updateData: any = {};
        if (params.enabled !== undefined) updateData.enabled = params.enabled;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.welcome_channels !== undefined) {
          updateData.welcomeChannels = params.welcome_channels.map(ch => ({
            channel: ch.channel_id,
            description: ch.description,
            // For custom emojis, use emoji_id. For unicode emojis, just use the emoji string directly as emoji_name
            emoji: ch.emoji_id ? { id: ch.emoji_id, name: ch.emoji_name } : ch.emoji_name || undefined,
          }));
        }

        const welcomeScreen = await guild.editWelcomeScreen(updateData);

        return {
          content: [{ type: "text", text: `Welcome screen updated. Enabled: ${welcomeScreen.enabled}, Channels: ${welcomeScreen.welcomeChannels.size}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing welcome screen: ${(error as Error).message}` }],
        };
      }
    }
  );

  // ============================================================================
  // ONBOARDING TOOLS
  // ============================================================================

  server.registerTool(
    "discord_get_onboarding",
    {
      title: "Get Server Onboarding",
      description: `Get the onboarding configuration for a server.

Onboarding guides new members through a questionnaire to customize their experience.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Onboarding settings including prompts, options, and default channels`,
      inputSchema: GetOnboardingSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetOnboardingInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const onboarding = await guild.fetchOnboarding();

        const result = {
          enabled: onboarding.enabled,
          mode: onboarding.mode,
          defaultChannelIds: onboarding.defaultChannels.map(c => c.id),
          prompts: onboarding.prompts.map(p => ({
            id: p.id,
            type: p.type,
            title: p.title,
            singleSelect: p.singleSelect,
            required: p.required,
            inOnboarding: p.inOnboarding,
            options: p.options.map(o => ({
              id: o.id,
              title: o.title,
              description: o.description,
              emoji: o.emoji ? { id: o.emoji.id, name: o.emoji.name } : null,
              roleIds: o.roles.map(r => r.id),
              channelIds: o.channels.map(c => c.id),
            })),
          })),
        };

        const text = formatResponse(
          result,
          params.response_format,
          (data) => {
            let output = `**Server Onboarding**\nEnabled: ${data.enabled}\nMode: ${data.mode}\nDefault Channels: ${data.defaultChannelIds.length}\n\n**Prompts:**\n`;
            data.prompts.forEach((p: any, i: number) => {
              output += `\n${i + 1}. **${p.title}** (${p.type})\n`;
              output += `   Required: ${p.required}, Single Select: ${p.singleSelect}\n`;
              output += `   Options: ${p.options.map((o: any) => o.title).join(', ')}\n`;
            });
            return output;
          }
        );

        return {
          content: [{ type: "text", text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting onboarding: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_edit_onboarding",
    {
      title: "Edit Server Onboarding",
      description: `Edit the onboarding configuration for a server.

Configure prompts/questions that new members answer to customize their server experience.
Each prompt can assign roles or show channels based on member selections.

Args:
  - guild_id (string): Discord server/guild ID
  - prompts (array, optional): Onboarding prompts with options
  - default_channel_ids (array, optional): Channels shown to all new members
  - enabled (boolean, optional): Enable/disable onboarding
  - mode ('onboarding_default' | 'onboarding_advanced', optional): Onboarding mode

Returns:
  Updated onboarding configuration`,
      inputSchema: EditOnboardingSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: EditOnboardingInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const promptTypeMap: Record<string, number> = { multiple_choice: 0, dropdown: 1 };
        const modeMap: Record<string, number> = { onboarding_default: 0, onboarding_advanced: 1 };

        const updateData: any = {};
        if (params.enabled !== undefined) updateData.enabled = params.enabled;
        if (params.default_channel_ids !== undefined) updateData.defaultChannelIds = params.default_channel_ids;
        if (params.mode !== undefined) updateData.mode = modeMap[params.mode];
        if (params.prompts !== undefined) {
          // Debug: Log the incoming prompts structure
          console.error("DEBUG prompts input:", JSON.stringify(params.prompts, null, 2));

          updateData.prompts = params.prompts.map(p => ({
            id: p.id,
            type: promptTypeMap[p.type],
            title: p.title,
            singleSelect: p.single_select,
            required: p.required,
            inOnboarding: p.in_onboarding,
            options: p.options.map(o => {
              // Debug: Log each option
              console.error("DEBUG option:", JSON.stringify(o, null, 2));

              // Discord requires at least one role OR channel per option
              const hasRoles = o.role_ids && o.role_ids.length > 0;
              const hasChannels = o.channel_ids && o.channel_ids.length > 0;
              if (!hasRoles && !hasChannels) {
                throw new Error(`Option "${o.title}" must have at least one role_ids or channel_ids. Received: role_ids=${JSON.stringify(o.role_ids)}, channel_ids=${JSON.stringify(o.channel_ids)}`);
              }
              return {
                id: o.id,
                title: o.title,
                description: o.description,
                emoji: o.emoji_id ? { id: o.emoji_id, name: o.emoji_name } : o.emoji_name || undefined,
                roles: o.role_ids || [],
                channels: o.channel_ids || [],
              };
            }),
          }));
        }

        const onboarding = await guild.editOnboarding(updateData);

        return {
          content: [{ type: "text", text: `Onboarding updated. Enabled: ${onboarding.enabled}, Prompts: ${onboarding.prompts.size}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error editing onboarding: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_setup_onboarding",
    {
      title: "Setup Server Onboarding",
      description: `Setup and enable onboarding for a server from scratch.

This tool configures the complete onboarding experience for new members.
The server must have Community features enabled.

Requirements:
- Server must have Community features enabled (done in Discord Server Settings)
- At least one default channel must be specified
- At least one prompt with options must be provided
- Each option must have at least one role_ids OR channel_ids

Args:
  - guild_id (string): Discord server/guild ID
  - default_channel_ids (string[]): Channels shown to all new members (required, at least one)
  - prompts (array): Onboarding questions (required, at least one)
    - type ('multiple_choice' | 'dropdown'): Prompt type
    - title (string): Question title
    - single_select (boolean): Allow only one selection (default: true)
    - required (boolean): Must answer to continue (default: false)
    - in_onboarding (boolean): Show during onboarding (default: true)
    - options (array): Available choices (at least one)
      - title (string): Option title
      - description (string, optional): Option description
      - emoji_name (string, optional): Unicode emoji (e.g., '🎮')
      - role_ids (string[], optional): Roles to assign when selected
      - channel_ids (string[], optional): Channels to show when selected
  - mode ('onboarding_default' | 'onboarding_advanced', optional): Mode (default: 'onboarding_default')
  - enabled (boolean, optional): Enable after setup (default: true)

Returns:
  Confirmation with onboarding status`,
      inputSchema: SetupOnboardingSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: SetupOnboardingInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        // Check if community features are enabled
        if (!guild.features.includes('COMMUNITY')) {
          return {
            isError: true,
            content: [{ type: "text", text: `Server "${guild.name}" does not have Community features enabled. Please enable Community in Discord Server Settings > Enable Community first.` }],
          };
        }

        const promptTypeMap: Record<string, number> = { multiple_choice: 0, dropdown: 1 };
        const modeMap: Record<string, number> = { onboarding_default: 0, onboarding_advanced: 1 };

        // Build the onboarding data
        const onboardingData: any = {
          enabled: params.enabled ?? true,
          defaultChannelIds: params.default_channel_ids,
          mode: modeMap[params.mode || 'onboarding_default'],
          prompts: params.prompts.map(p => ({
            type: promptTypeMap[p.type],
            title: p.title,
            singleSelect: p.single_select ?? true,
            required: p.required ?? false,
            inOnboarding: p.in_onboarding ?? true,
            options: p.options.map(o => {
              // Validate that each option has at least one role or channel
              const hasRoles = o.role_ids && o.role_ids.length > 0;
              const hasChannels = o.channel_ids && o.channel_ids.length > 0;
              if (!hasRoles && !hasChannels) {
                throw new Error(`Option "${o.title}" must have at least one role_ids or channel_ids`);
              }
              return {
                title: o.title,
                description: o.description,
                emoji: o.emoji_id ? { id: o.emoji_id, name: o.emoji_name } : o.emoji_name || undefined,
                roles: o.role_ids || [],
                channels: o.channel_ids || [],
              };
            }),
          })),
        };

        const onboarding = await guild.editOnboarding(onboardingData);

        return {
          content: [{ type: "text", text: `Onboarding setup complete for "${guild.name}"!\nEnabled: ${onboarding.enabled}\nMode: ${params.mode || 'onboarding_default'}\nDefault Channels: ${params.default_channel_ids.length}\nPrompts: ${onboarding.prompts.size}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error setting up onboarding: ${(error as Error).message}` }],
        };
      }
    }
  );

  // ============================================================================
  // COMMUNITY SETUP TOOLS
  // ============================================================================

  server.registerTool(
    "discord_get_community_settings",
    {
      title: "Get Community Settings",
      description: `Get the community settings for a server.

Shows rules channel, updates channel, and other community-related settings.

Args:
  - guild_id (string): Discord server/guild ID
  - response_format ('markdown' | 'json'): Output format (default: 'json')

Returns:
  Community settings including channels and features`,
      inputSchema: GetCommunitySettingsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: GetCommunitySettingsInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const isCommunity = guild.features.includes('COMMUNITY');

        const settings = {
          isCommunity,
          features: guild.features,
          rulesChannelId: guild.rulesChannelId,
          publicUpdatesChannelId: guild.publicUpdatesChannelId,
          safetyAlertsChannelId: guild.safetyAlertsChannelId,
          systemChannelId: guild.systemChannelId,
          description: guild.description,
          preferredLocale: guild.preferredLocale,
          premiumTier: guild.premiumTier,
          premiumSubscriptionCount: guild.premiumSubscriptionCount,
          vanityURLCode: guild.vanityURLCode,
        };

        const text = formatResponse(
          settings,
          params.response_format,
          (data) => {
            let output = `**Community Settings for ${guild.name}**\n`;
            output += `Community Enabled: ${data.isCommunity ? 'Yes' : 'No'}\n\n`;
            output += `**Channels:**\n`;
            output += `- Rules: ${data.rulesChannelId ? `<#${data.rulesChannelId}>` : 'Not set'}\n`;
            output += `- Public Updates: ${data.publicUpdatesChannelId ? `<#${data.publicUpdatesChannelId}>` : 'Not set'}\n`;
            output += `- Safety Alerts: ${data.safetyAlertsChannelId ? `<#${data.safetyAlertsChannelId}>` : 'Not set'}\n`;
            output += `- System: ${data.systemChannelId ? `<#${data.systemChannelId}>` : 'Not set'}\n\n`;
            output += `**Server Info:**\n`;
            output += `- Description: ${data.description || 'None'}\n`;
            output += `- Locale: ${data.preferredLocale}\n`;
            output += `- Boost Level: ${data.premiumTier} (${data.premiumSubscriptionCount} boosts)\n`;
            output += `- Vanity URL: ${data.vanityURLCode || 'None'}\n\n`;
            output += `**Features:** ${data.features.join(', ')}`;
            return output;
          }
        );

        return {
          content: [{ type: "text", text }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting community settings: ${(error as Error).message}` }],
        };
      }
    }
  );

  server.registerTool(
    "discord_setup_community",
    {
      title: "Setup Community Server",
      description: `Configure the required channels for a Community server.

Sets the rules channel and public updates channel which are required for Community features.
The server must already have Community enabled in Discord Server Settings.

Args:
  - guild_id (string): Discord server/guild ID
  - rules_channel_id (string): Channel for server rules (required)
  - public_updates_channel_id (string): Channel for Discord updates (required)
  - description (string, optional): Server description (max 120 chars)
  - preferred_locale (string, optional): Preferred language (e.g., 'en-US', 'de')
  - safety_alerts_channel_id (string, optional): Channel for safety alerts

Returns:
  Updated community settings`,
      inputSchema: SetupCommunitySchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: SetupCommunityInput) => {
      try {
        const client = await getClient();
        const guild = client.guilds.cache.get(params.guild_id);

        if (!guild) {
          return {
            isError: true,
            content: [{ type: "text", text: `Guild not found: ${params.guild_id}` }],
          };
        }

        const updateData: any = {
          rulesChannel: params.rules_channel_id,
          publicUpdatesChannel: params.public_updates_channel_id,
        };

        if (params.description !== undefined) {
          updateData.description = params.description;
        }
        if (params.preferred_locale !== undefined) {
          updateData.preferredLocale = params.preferred_locale;
        }
        if (params.safety_alerts_channel_id !== undefined) {
          updateData.safetyAlertsChannel = params.safety_alerts_channel_id;
        }

        const updated = await guild.edit(updateData);

        const isCommunity = updated.features.includes('COMMUNITY');

        return {
          content: [{ type: "text", text: `Community settings updated for "${updated.name}"!\nCommunity Enabled: ${isCommunity ? 'Yes' : 'No'}\nRules Channel: <#${params.rules_channel_id}>\nPublic Updates: <#${params.public_updates_channel_id}>${params.description ? `\nDescription: ${params.description}` : ''}` }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error setting up community: ${(error as Error).message}` }],
        };
      }
    }
  );
}
