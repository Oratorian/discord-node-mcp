# Contributing to Discord MCP Server

Thanks for your interest in contributing! This document outlines the process for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

### Building

```bash
npm run build
```

### Development Mode (watch for changes)

```bash
npm run dev
```

### Testing Locally

1. Create a `.env` file with your test bot token:
   ```env
   DISCORD_BOT_TOKEN=your_test_bot_token
   ```

2. Run the server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── index.ts          # Main entry point, tool registrations
├── constants.ts      # Shared constants
├── types.ts          # TypeScript interfaces
├── schemas/
│   └── index.ts      # Zod schemas for input validation
└── services/
    └── discord.ts    # Discord client and formatting utilities
```

## Adding a New Tool

1. **Define the schema** in `src/schemas/index.ts`:
   ```typescript
   export const MyNewToolSchema = z.object({
     guild_id: GuildIdSchema,
     // ... other params
     response_format: ResponseFormatSchema
   }).strict();

   export type MyNewToolInput = z.infer<typeof MyNewToolSchema>;
   ```

2. **Register the tool** in `src/index.ts`:
   ```typescript
   server.registerTool(
     "discord_my_new_tool",
     {
       title: "My New Tool",
       description: `Description of what the tool does.

   Args:
     - guild_id (string): The server ID
     - response_format ('markdown' | 'json'): Output format (default: 'json')

   Returns:
     Description of return value`,
       inputSchema: MyNewToolSchema,
       annotations: {
         readOnlyHint: true,  // or false if it modifies data
         destructiveHint: false,  // true for delete/kick/ban operations
         idempotentHint: true,
         openWorldHint: true,
       },
     },
     async (params: MyNewToolInput) => {
       // Implementation
     }
   );
   ```

3. **Add formatting** in `src/services/discord.ts` if needed

4. **Update README.md** with the new tool

## Code Style

- Use TypeScript strict mode
- Use Zod for all input validation
- Add proper error handling with descriptive messages
- Support both `json` and `markdown` response formats for read operations
- Mark destructive operations with `destructiveHint: true`

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add discord_create_thread tool`
- `fix: handle rate limiting in message operations`
- `docs: update README with new tool examples`

## Pull Requests

1. Ensure `npm run build` succeeds without errors
2. Update documentation if adding new features
3. Fill out the PR template completely
4. Link any related issues

## Questions?

Feel free to open an issue for questions or discussions.
