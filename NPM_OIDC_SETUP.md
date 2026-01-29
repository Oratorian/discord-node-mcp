# npm Trusted Publishers (OIDC) Setup Guide

This guide explains how to set up automated publishing from GitHub to npm using OIDC (OpenID Connect) authentication.

**Important**: As of December 9, 2025, npm permanently deprecated all Classic Tokens. OIDC trusted publishing is now the required authentication method.

## Prerequisites

- npm account with publish access to `@mahesvara/discord-mcpserver`
- Admin access to the GitHub repository `Oratorian/discord-node-mcp`
- **No npm tokens needed** - OIDC handles authentication automatically!

## Step 1: Configure npm Trusted Publisher (MUST DO FIRST!)

⚠️ **You MUST configure the trusted publisher on npm.com BEFORE the GitHub workflow will work!**

1. Go to [npmjs.com](https://www.npmjs.com/) and sign in
2. Navigate to your package: [@mahesvara/discord-mcpserver](https://www.npmjs.com/package/@mahesvara/discord-mcpserver)
3. Click on **Settings** (in the package page)
4. Scroll down to **Publishing access** section
5. Find the **Trusted publishers** area
6. Click **Add trusted publisher** or **Configure GitHub Actions**
7. Fill in these exact details:
   ```
   Provider: GitHub Actions
   Repository owner: Oratorian
   Repository name: discord-node-mcp
   Workflow filename: publish.yml
   Environment name: (leave empty)
   ```
8. Click **Add** or **Save**

## Step 2: GitHub Workflow (Already Set Up!)

The workflow file `.github/workflows/publish.yml` is already configured with:

✅ `permissions.id-token: write` - Required for OIDC
✅ `node-version: 20` - Uses Node.js 20
✅ `npm publish --access public` - Publishes as public package
✅ **No `NODE_AUTH_TOKEN`** - OIDC authentication is automatic
✅ **Provenance automatic** - Generated automatically with OIDC (no flag needed)

## Step 3: Publishing a New Version

Once the trusted publisher is configured on npm, you can publish:

```bash
# 1. Ensure all changes are committed
git status

# 2. Push to GitHub
git push origin main

# 3. Create and push a version tag (e.g., v1.1.3)
git tag v1.1.3
git push origin v1.1.3
```

The GitHub Action will automatically:
1. ✅ Checkout the code
2. ✅ Install dependencies with `npm ci`
3. ✅ Build TypeScript with `npm run build`
4. ✅ Authenticate using OIDC (automatic!)
5. ✅ Publish to npm with provenance (automatic!)

## Step 4: Verify Publication

1. Check [GitHub Actions](https://github.com/Oratorian/discord-node-mcp/actions) - should see "Publish to npm" workflow
2. Verify on [npmjs.com](https://www.npmjs.com/package/@mahesvara/discord-mcpserver)
3. Check for provenance attestation (automatically added)

## Common Errors & Solutions

### Error: "ENEEDAUTH - need auth"

**Cause**: Trusted publisher not configured on npm.com
**Solution**: Complete Step 1 above - configure the trusted publisher first!

### Error: "id-token permission missing"

**Cause**: Workflow missing `permissions.id-token: write`
**Solution**: Already fixed in the workflow file

### Error: Still asks for auth token

**Cause**: `NODE_AUTH_TOKEN` or `NPM_TOKEN` is set (even as empty string)
**Solution**: Remove ALL references to these env vars - OIDC only works when they're completely unset

## Benefits of OIDC

- ✅ **No secrets to manage**: Zero npm tokens in GitHub secrets
- ✅ **More secure**: Temporary credentials per workflow run
- ✅ **Provenance**: Automatically verifiable package origin
- ✅ **Auditable**: Clear link between npm package and GitHub commit
- ✅ **Required**: Classic tokens deprecated as of Dec 2025

## Alternative: Manual Publishing

For local testing or emergency releases:

```bash
npm login  # Use web browser authentication
npm run build
npm publish --access public
```

## References

- [npm Trusted Publishers Documentation](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm OIDC Generally Available - GitHub Changelog](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [npm Classic Tokens Deprecated](https://github.com/orgs/community/discussions/176761)
