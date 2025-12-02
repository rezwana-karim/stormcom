# Copilot Coding Agent Instructions

## Repository Overview
**StormCom** - Next.js 16 multi-tenant SaaS e-commerce platform with authentication, user management, and organization features.

**Tech Stack**: Next.js 16.0.3 (Turbopack), React 19.2, TypeScript 5, Prisma 6.19.0, NextAuth 4.24, shadcn-ui  
**Size**: ~1,900 lines of TypeScript, 580 npm packages  
**Runtime**: Node.js v20+ required  
**Database**: SQLite (dev), PostgreSQL (production planned)

## Critical Build & Validation Workflow

### ALWAYS Follow This Exact Sequence
1. **Install Dependencies**: `npm install` (takes ~20-30s)
2. **Environment Setup**: Create `.env.local` with ALL required variables:
   ```bash
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="development-secret-at-least-32-chars"
   NEXTAUTH_URL="http://localhost:3000"
   EMAIL_FROM="noreply@example.com"
   RESEND_API_KEY="re_dummy_key_for_build"  # REQUIRED even with dummy value
   ```
   **CRITICAL**: Build WILL FAIL without `RESEND_API_KEY` (even dummy value like `re_dummy_key_for_build`) because `new Resend()` is instantiated at module level in `src/lib/auth.ts`. Dev mode logs magic links to console when API key is missing.

3. **Generate Prisma Client**: `npm run prisma:generate` (takes ~5s)
4. **Run Migrations** (first time only): `npm run prisma:migrate:dev` (requires env vars sourced: `export $(cat .env.local | xargs) && npm run prisma:migrate:dev`)
5. **Type Check**: `npm run type-check` (takes ~10s)
6. **Lint**: `npm run lint` (takes ~10s, warnings acceptable, zero errors)
7. **Build**: `npm run build` (takes ~20s with Turbopack)
8. **Dev Server**: `npm run dev` (ready in ~1-2s)

### Build Timing & Known Issues
- **npm install**: 18-30 seconds
- **npm run build**: 15-25 seconds (Turbopack enabled)
- **npm run type-check**: 8-12 seconds
- **npm run lint**: 8-15 seconds

**Expected Lint Warnings** (non-blocking):
- `@typescript-eslint/no-unused-vars` in `next-auth.d.ts` (type extension file)
- `react-hooks/incompatible-library` in `src/components/data-table.tsx` (React Compiler + TanStack Table API)

**No Test Suite**: Repository has no tests; do not add testing infrastructure unless explicitly requested.

## Architecture & Project Layout

### Directory Structure
```
/src
  /app                          # Next.js 16 App Router
    /(auth)                     # Public auth routes (route group)
      /login                    # Login page
      /signup                   # Signup page  
      /verify-email             # Email verification page
    /api/auth/[...nextauth]     # NextAuth handler
    /dashboard                  # Protected: Main dashboard
    /projects                   # Protected: Projects page
    /team                       # Protected: Team management
    /settings                   # Protected: User settings
      /billing                  # Protected: Billing settings
    /onboarding                 # Onboarding flow
    layout.tsx                  # Root layout (Geist fonts)
    page.tsx                    # Landing page
    globals.css                 # Tailwind CSS
  /components                   # React components
    /ui                         # shadcn-ui primitives (30+ components)
    app-sidebar.tsx             # Main navigation sidebar
    site-header.tsx             # Site header
    nav-*.tsx                   # Navigation components
    data-table.tsx              # TanStack Table wrapper
  /lib                          # Utilities
    auth.ts                     # NextAuth configuration
    prisma.ts                   # Singleton Prisma client
    utils.ts                    # Helper functions (cn, etc.)
  /hooks                        # Custom React hooks
/prisma
  schema.prisma                 # SQLite schema (ACTIVE for dev)
  schema.postgres.prisma,.md    # PostgreSQL schema (RENAME before use)
  /migrations                   # Database migrations
  dev.db                        # SQLite database file
/public                         # Static assets (SVG icons)
/.github
  copilot-instructions.md       # This file
  /agents                       # Custom agent definitions
middleware.ts                   # NextAuth middleware (route protection)
next.config.ts                  # React Compiler enabled
tsconfig.json                   # TypeScript config (paths: @/*)
components.json                 # shadcn-ui config
```

### Authentication Architecture
- **Provider**: Email magic link via NextAuth + Resend (password auth planned for dev)
- **Session**: JWT strategy, `session.user.id` added in callback (NEVER remove)
- **Config**: `src/lib/auth.ts` exports `authOptions`
- **Handler**: `src/app/api/auth/[...nextauth]/route.ts` (5 lines)
- **Protection**: `middleware.ts` (re-export from `next-auth/middleware`)
  - **Matcher**: `/dashboard/:path*`, `/settings/:path*`, `/team/:path*`, `/projects/:path*`
  - **To Protect New Route**: Add to matcher array (e.g., `"/reports/:path*"`)
- **Server Session**: Use `getServerSession(authOptions)` in Server Components
- **Client Session**: Use `useSession()` hook in Client Components

### Database Layer (Multi-Tenant)
- **Dev Schema**: `prisma/schema.prisma` (ACTIVE)
- **Prod Schema**: `prisma/schema.postgres.prisma,.md` (TYPO: rename to `.prisma` before deploy)
- **Models**: `User` (NextAuth), `Account`, `Session`, `VerificationToken`, `Organization`, `Membership` (with `Role` enum)
- **Multi-Tenancy**: ALWAYS filter queries by BOTH `userId` AND `organizationId` (or `slug`) to prevent data leakage
- **Prisma Client**: Singleton in `src/lib/prisma.ts` - NEVER instantiate `new PrismaClient()` elsewhere
- **Key Relations**: `User` ↔ `Membership` ↔ `Organization` (unique `[userId, organizationId]`)

### UI/Component Patterns
- **shadcn-ui**: Primitives in `src/components/ui` (Button, Card, Dialog, etc.)
- **Client Components**: Require `"use client"` directive at top of file
- **Styling**: Tailwind CSS + `cn()` utility + CVA (Class Variance Authority)
- **Button Variants**: Extend `buttonVariants` in `button.tsx` (e.g., `variant="subtle"`)
- **Icons**: Lucide React (`lucide-react`) + Tabler Icons (`@tabler/icons-react`)
- **Fonts**: Geist Sans + Geist Mono (loaded in root `layout.tsx`)

## Development Workflows

### Common Commands
```bash
npm run dev              # Start dev server (port 3000, Turbopack)
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint (ESLint 9 flat config)
npm run type-check      # TypeScript validation (no emit)
npm run prisma:generate # Generate Prisma Client
npm run prisma:migrate:dev # Run migrations + generate
```

### Database Migrations
**IMPORTANT**: Prisma CLI does NOT auto-load `.env.local`. Workarounds:
```bash
# Option 1: Source env vars before command
export $(cat .env.local | xargs) && npm run prisma:migrate:dev

# Option 2: Use dotenv-cli (if installed)
dotenv -e .env.local -- npm run prisma:migrate:dev

# Option 3: Use npx with dotenv
npx dotenv -e .env.local -- prisma migrate dev --schema=prisma/schema.prisma
```

**Migration Workflow**:
1. Modify `prisma/schema.prisma`
2. Run `npm run prisma:migrate:dev` (creates migration + generates client)
3. Commit both schema and migration files

### Adding Protected Routes
1. Create route folder in `src/app/your-route`
2. Add to `middleware.ts` matcher: `"/your-route/:path*"`
3. Use `getServerSession(authOptions)` to check auth in Server Components

### Adding shadcn-ui Components
**DO NOT manually copy files**. Use MCP tool:
```bash
#mcp_shadcn_get_add_command_for_items ["@shadcn/dialog", "@shadcn/form"]
# Then run returned command: npx shadcn@latest add dialog form
```

## Configuration Files

- **next.config.ts**: React Compiler enabled (`reactCompiler: true`)
- **tsconfig.json**: Path alias `@/*` → `./src/*`
- **eslint.config.mjs**: ESLint 9 flat config, Next.js rules
- **components.json**: shadcn-ui config (New York style, RSC, Tailwind v4)
- **postcss.config.mjs**: Tailwind CSS PostCSS plugin
- **middleware.ts**: NextAuth route protection (5 lines)

## Common Pitfalls & Workarounds

### Build Failures
1. **"Missing API key" error**: Add `RESEND_API_KEY="re_dummy"` to `.env.local` (required even for build)
2. **Prisma Client not found**: Run `npm run prisma:generate` before build
3. **Environment variables not loaded**: Prisma CLI ignores `.env.local`; source manually (see above)

### Development Issues
1. **React Compiler warnings**: Expected for TanStack Table (`data-table.tsx`); ignore unless errors occur
2. **Hot reload fails**: Restart dev server (`npm run dev`)
3. **Stale Prisma types**: Re-run `npm run prisma:generate` after schema changes

### Data Security
1. **Multi-tenancy**: NEVER query without filtering by `organizationId` AND `userId`
2. **Session user ID**: ALWAYS preserve `session.user.id` in auth callback (line 48-49 in `auth.ts`)
3. **Singleton Prisma**: NEVER create `new PrismaClient()` outside `src/lib/prisma.ts`

### PostgreSQL Migration (Not Yet Done)
1. Rename `prisma/schema.postgres.prisma,.md` → `schema.postgres.prisma`
2. Update `DATABASE_URL` to PostgreSQL connection string
3. Run `npx prisma migrate deploy` (production)
4. Update `package.json` scripts to use postgres schema

## Planned Features (Not Implemented)
- **Password Auth**: Add `passwordHash` to User model, implement CredentialsProvider (dev only)
- **OAuth**: Extend `authOptions.providers` (keep environment separation)
- **Cache Tags**: Use `revalidateTag()` for org-switch or membership updates
- **Middleware Migration**: Next.js 16 recommends `proxy.ts` over `middleware.ts` (not yet migrated)

## Validation & Testing

**No Automated Tests**: Repository has no test suite. Do not add unless explicitly requested.

**Pre-Commit Checklist**:
1. `npm run type-check` (must pass with 0 errors)
2. `npm run lint` (must pass with 0 errors; warnings acceptable)
3. `npm run build` (must complete successfully)
4. Test locally with `npm run dev` and verify changes in browser
5. Use `#mcp_next-devtools_browser_eval` to capture console errors after UI changes

## Next.js DevTools MCP Usage

When `next-devtools-mcp` server is available, follow this workflow for Next.js 16 development:

### 1. Start Dev Server First
Always start the dev server before using Next DevTools MCP:
```bash
npm run dev
```
Wait until fully started (no errors, available at dev URL).

### 2. Initialize Once Per Session
After dev server is running, call `init` tool from `next-devtools-mcp` **once** at session start:
- Do NOT call `init` repeatedly while dev server is running and MCP is working
- After `init`, treat older Next.js training data as outdated
- Use `nextjs_docs` tool for ALL Next.js concepts

**When to call `init` again**: Only if dev server was restarted AND MCP appears to be failing.

### 3. Documentation-First with nextjs_docs
For any Next.js question (routing, data fetching, caching, Server/Client Components, auth, config):
- Use `nextjs_docs` to `search` for docs, then `get` full content
- Base all explanations and code changes on returned documentation
- Avoid answering from memory when `nextjs_docs` is available

### 4. Runtime Diagnostics with nextjs_runtime
When dev server is running, use `nextjs_runtime` to inspect actual runtime state:
- `discover_servers` → Find active Next.js dev server
- `list_tools` → See available runtime tools
- `call_tool` → Invoke runtime tools:
  - `get_errors` → Build/runtime/type errors
  - `get_logs` → Dev server logs
  - `get_page_metadata` → Routes and component metadata
  - `get_project_metadata` → Project structure and dev URL
  - `get_server_action_by_id` → Locate Server Actions in codebase

Before major refactors or debugging, inspect routes, errors, and logs with `nextjs_runtime`.

### 5. Browser Verification with browser_eval
If Playwright MCP is available via `next-devtools-mcp`, use `browser_eval` to:
- Open app in real browser at dev URL (`http://localhost:3000`)
- Navigate flows, click buttons, fill forms, capture console messages
- Take screenshots to validate visual changes

Use `nextjs_runtime` for internal diagnostics; `browser_eval` for end-to-end UX verification and visual/hydration checks.

### 6. Upgrades with upgrade_nextjs_16
When planning Next.js 16 upgrade:
- Use `upgrade_nextjs_16` **tool** to run codemods, generate guidance, surface breaking changes
- Use `upgrade-nextjs-16` **prompt** (if available) to structure migration plan
- After changes: verify with `nextjs_docs`, `nextjs_runtime` (`get_errors`, `get_logs`), and tests

### 7. Cache Components with enable_cache_components
When enabling Cache Components:
- Use `enable_cache_components` **tool** for readiness checks, config, automated error detection
- Use `enable-cache-components` **prompt** for phased migration flow
- Use Cache Components **resources** via MCP for deeper understanding:
  - `cache-components://overview`
  - `cache-components://core-mechanics`
  - `cache-components://request-apis`
  - `cache-components://cache-invalidation`
  - `cache-components://error-patterns`

Combine with `nextjs_docs` and `nextjs_runtime` for safe, concrete changes.

### 8. Authoritative Resources
For migration and fundamentals, use MCP resources as authoritative:
- `nextjs16://migration/beta-to-stable` → Breaking changes
- `nextjs16://migration/examples` → Recommended patterns
- `nextjs-fundamentals://use-client` → Client component decisions

Treat these resources plus `nextjs_docs` as **authoritative** for Next.js behavior in this repository.

## Final Notes
- **Trust These Instructions**: Search codebase only if information is incomplete or contradicts reality.
- **Minimal Changes**: Make smallest possible edits to achieve task goals.
- **Environment First**: ALWAYS create `.env.local` with all variables before any build/dev command.
- **Prisma Lifecycle**: Generate → Migrate → Build (in that order).
