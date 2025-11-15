# AI Coding Agent Instructions
Purpose: Immediate UI/UX improvement and productivity in this Next.js 16 + NextAuth + Prisma + shadcn-ui multi-tenant e-commerce SaaS.

## Architecture
App Router in `src/app`; root layout `layout.tsx`. Public auth segment `(auth)` with `login`, `signup`, `verify-email`. Protected routes: `dashboard`, `projects`, `team`, `settings` (and `settings/billing`). Auth config `src/lib/auth.ts`; handler `api/auth/[...nextauth]/route.ts`. Current provider: Email magic link (password login planned). JWT sessions; `session.user.id` added in callback (retain). Protection via `middleware.ts` (re-export of `next-auth/middleware`) with `config.matcher`; include `:path*` for new secure paths.

## Local Auth Transition (Dev Password Plan)
Goal: add email + password for local dev without weakening production email-only flow.
1. Add `passwordHash String?` to `User` in both Prisma schemas (never store plain text).
2. Implement signup flow hashing with bcrypt (e.g. 12-14 salt rounds).
3. Add `CredentialsProvider` for `NODE_ENV === 'development'` only; keep Email provider active.
4. Ensure queries still scope by organization when loading user data.
5. Update instructions & remove `?` once feature lands.

## Data Layer
SQLite dev schema: `prisma/schema.sqlite.prisma`; Postgres prod intended: `schema.postgres.prisma` (current filename typo: `schema.postgres.prisma,.md`—rename before deploy). Multi-tenancy: `Organization` + `Membership` (unique `[userId, organizationId]`, `Role`). ALWAYS filter queries by BOTH user and org (slug or id) to avoid data bleed. Singleton Prisma client in `src/lib/prisma.ts` (never new `PrismaClient`).

## UI / Components
shadcn-ui primitives in `src/components/ui`; composite navigation/layout in `src/components/*` (e.g. `app-sidebar.tsx`). Client interactivity requires top-level `"use client"`. Styling: Tailwind + `cn()` + CVA variants (`button.tsx` -> `buttonVariants`). Add a button variant by extending CVA map; use `<Button variant="subtle"/>`.

## Environment
Vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `EMAIL_FROM`; optional `RESEND_API_KEY` (logs magic link to console if missing). Gmail dot-normalization in `auth.ts`—reuse for any identity logic.

## Workflows
Dev: `npm run dev`. Lint: `npm run lint`. Types: `npm run type-check`. Migrations: `npm run prisma:migrate:dev` then `npm run prisma:generate`. Postgres deploy: rename schema file, set Postgres `DATABASE_URL`, run `prisma migrate deploy`. Protect new route: create folder + extend matcher (e.g. `"/reports/:path*"`). Server: `getServerSession(authOptions)`; client: `useSession()`.

## Tooling (MCP & Automation)
- `#mcp_next-devtools_browser_eval`: open automated browser to verify pages & capture console errors after UI changes.
- `#mcp_shadcn_get_add_command_for_items`: fetch add commands for new UI components/themes from registry instead of manual copy.
- `#chromedevtools/chrome-devtools-mcp`: deep DOM, network, and performance diagnostics before adding custom logging.

## Caching & Extensions
No cache tags yet; safe to introduce `revalidateTag()` around org-switch or membership updates. Future OAuth: extend `authOptions.providers` (keep email + credentials separation by environment). Keep middleware lean (no DB reads); anticipate possible move to `proxy.ts`.

## Gotchas
Rename `schema.postgres.prisma,.md`. Missing `RESEND_API_KEY` only surfaces when sending verification emails (dev logs link). Preserve `session.user.id`. NEVER duplicate Prisma client. Adding password auth must not bypass multi-tenancy checks.

## Credentials Provider Sketch (Planned)
```ts
CredentialsProvider({
  name: 'Dev Credentials',
  credentials: { email: {}, password: {} },
  async authorize(creds) {
    const user = await prisma.user.findUnique({ where: { email: creds.email } });
    if (!user || !user.passwordHash) return null;
    const ok = await bcrypt.compare(creds.password, user.passwordHash);
    return ok ? user : null;
  }
})
```

Next steps: verify env vars, run dev, apply migrations, implement passwordHash + credentials provider (dev only), use MCP tooling for UI additions & validation, enforce multi-tenancy consistently.
