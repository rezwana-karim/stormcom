# AI Coding Agent Instructions
Purpose: Immediate UI/UX enhancement and productivity in this Next.js 16 + NextAuth + Prisma + shadcn-ui Multi-tenant e-commerce SaaS platform built with Next.js 16.

## Architecture
App Router in `src/app`; root layout `layout.tsx`. Public auth segment `(auth)` with `login`, `signup`, `verify-email`. Protected feature routes: `dashboard`, `projects`, `team`, `settings` (with `billing`). Auth config at `src/lib/auth.ts`; handler `api/auth/[...nextauth]/route.ts`. JWT sessions; `session.user.id` added in callback (retain). Protection via `middleware.ts` re-exporting `next-auth/middleware`; extend `config.matcher` for new secured paths (include `:path*`).

## Data Layer
Dev uses SQLite schema `prisma/schema.sqlite.prisma`. Prod intended: `schema.postgres.prisma` (current filename typo: `schema.postgres.prisma,.md`—rename before deploy). Multi-tenancy via `Organization` + `Membership` (unique `[userId, organizationId]`, `Role` enum). Always scope queries by both user and org (e.g. slug) to avoid data bleed. Singleton Prisma client in `src/lib/prisma.ts` (never new `PrismaClient` elsewhere).

## UI / Components
Reusable UI in `src/components/ui`; compound navigation/layout in `src/components/*`. Interactive components use "use client" at top. Styling: Tailwind + `cn()` + `class-variance-authority` (see `button.tsx` export `buttonVariants`). To add a button variant: extend `variant` map, then `<Button variant="subtle"/>`.

## Environment
Required vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `EMAIL_FROM`; `RESEND_API_KEY` optional (logs magic link to console if missing). Gmail normalization (dot stripping) in `auth.ts`—reuse for any email identity logic.

## Workflows
Dev: `npm run dev`. Lint: `npm run lint`. Types: `npm run type-check`. Migrations: `npm run prisma:migrate:dev` (SQLite dev) then `npm run prisma:generate`. For Postgres deploy use `prisma migrate deploy` with corrected schema file. To secure a new route: add folder under `src/app` and append matcher entry (e.g. `"/reports/:path*"`). Server session: `getServerSession(authOptions)`; client: `useSession()`.

## Caching & Extensions
No custom caching yet; safe to introduce `revalidateTag()` around org-switch features. To add OAuth providers, extend `providers` array in `authOptions` (models already present). Keep middleware light (no DB reads); future `proxy.ts` may replace it.

## Gotchas
Rename Postgres schema file before production. Missing `RESEND_API_KEY` only surfaces when sending verification emails. Preserve `session.user.id` logic. Never duplicate Prisma client.

Next steps for agents: ensure env vars, run dev server, apply needed migrations, then implement features respecting multi-tenancy + variant patterns.
