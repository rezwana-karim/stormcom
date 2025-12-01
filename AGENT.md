# StormCom Agent Guide

This document defines how an autonomous or semi-autonomous coding agent should work on the **CodeStorm-Hub/stormcomui** repository.

The goal is to:
- Safely evolve a **Next.js 16 multi-tenant SaaS e‑commerce** application.
- Respect existing architecture, patterns, and roadmap.
- Always use MCP-based tools to fetch **latest** documentation and external references (Next.js, shadcn/ui, Prisma, NextAuth, Stripe, etc.) before implementing anything non-trivial.

---

## 1. Repository & Architecture Overview

StormCom is a **Next.js 16 (App Router, Turbopack)** multi-tenant SaaS e‑commerce platform.

Key aspects:

- **Tech Stack**
  - Next.js 16 (App Router)
  - React 19
  - TypeScript 5
  - Prisma 6 (SQLite dev, PostgreSQL prod planned)
  - NextAuth for auth
  - shadcn/ui for UI primitives
  - REST-style API routes under `src/app/api/*`
  - Zod for validation
- **Domain Model**
  - **Multi-tenancy**
    - `Organization` (top-level tenant)
    - `Membership` (user ↔ organization, roles: OWNER, ADMIN, MEMBER, VIEWER)
    - `Store` (commerce storefront scoped to org)
    - Per-request scoping via `storeId` / organization slug
  - **E‑commerce core**
    - `Product`, `ProductVariant`, `Category`, `Brand`
    - `Order`, `OrderItem`
    - `Customer`, `Address`
    - Inventory & audit logging baseline
- **App Structure (high-level)**
  - `src/app/(auth)/…` – login/signup/verify flows
  - `src/app/api/*` – REST endpoints for auth, products, categories, brands, orders, checkout, organizations, etc.
  - `src/app/dashboard/*` – admin UI
  - `src/app/settings`, `src/app/team`, `src/app/projects`, `src/app/onboarding`
  - `src/components/ui/*` – shadcn primitives
  - `src/components/*-page-client.tsx` – client logic
  - `src/components/*-table.tsx` – data tables
  - `src/components/*-form*.tsx` – forms
  - `src/lib/env.ts` – env validation
  - `src/lib/multi-tenancy.ts` – multitenant utilities
  - `src/lib/rate-limit.ts` – rate limiting

- **Documentation Directory**
  - `docs/README.md` – documentation index & navigation
  - `docs/COMPREHENSIVE_CODEBASE_ANALYSIS.md`
  - `docs/complete-implementations/*`
  - `docs/analysis/COMPREHENSIVE_ANALYSIS.md`
  - `docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md`
  - `docs/PROJECT_PLAN.md`
  - `docs/EXECUTIVE_SUMMARY.md`
  - `docs/research/*`

This repo already has rich internal docs; the agent must **use these as primary guidance**.

---

## 2. Mandatory MCP Tool Usage

**Non‑negotiable rule:**  
For any implementation, especially when touching external technologies or patterns (Next.js, shadcn/ui, Prisma, NextAuth, Stripe, etc.) the agent **must use MCP servers/tools to fetch the latest upstream documentation** before modifying or adding code.

### 2.1. When to Use MCP Tools

The agent **must** call MCP tools to fetch current docs whenever:

- Implementing or modifying:
  - Next.js routing, server components, API routes, caching, or middleware.
  - shadcn/ui components, composition patterns, themes, or accessibility behaviors.
  - Prisma models/migrations, relations, transactions, or performance tweaks.
  - NextAuth configuration, callbacks, sessions, or providers.
  - Payment integrations (e.g., Stripe) and webhooks.
- Making changes based on patterns that might have evolved since the existing code was written.
- Designing new architectural primitives (new services, middleware, or domain models).
- Adjusting security, auth, RBAC, or multi-tenancy boundaries.

### 2.2. Documentation Sources (via MCP)

The agent should, via MCP tools, query at least:

- **Next.js** official docs (version 16+)
- **React** docs
- **shadcn/ui** docs and component reference
- **Prisma** docs (schema, client, migrations, transactions)
- **NextAuth** docs
- **Stripe** docs (for checkout/billing work)
- Any other integration being used or introduced

The agent should:

1. Fetch the relevant documentation for the specific feature/task.
2. Cross-check with **existing internal docs** under `docs/`.
3. Resolve conflicts in favor of:
   - Security and data integrity.
   - Multi-tenant isolation.
   - Consistency with established patterns in this repo.

**The use of MCP tools to fetch latest documentation is mandatory for all non-trivial changes.**

---

## 3. Core Design Principles

When making changes, the agent must align with the following:

1. **Multi-tenant by default**
   - Every e‑commerce operation must be scoped by `storeId` and/or `organization` membership.
   - No cross-tenant data leakage.
   - Authorization must respect role-based access control (OWNER/ADMIN/MEMBER/VIEWER).

2. **API + Service Layer Separation**
   - Keep API handlers thin.
   - Business logic should live in dedicated service modules (see existing service files).
   - Use **Zod** for request validation and consistent error handling.

3. **Next.js 16 App Router best practices**
   - Prefer server components unless client state is required.
   - Use server actions responsibly and securely.
   - Avoid unnecessary client-side data fetching when server can do it.

4. **Type Safety & Validation**
   - All new endpoints and core business operations should be covered with Zod and TypeScript types.
   - Minimize `any` and explicit type casts.

5. **UI Consistency with shadcn/ui**
   - Reuse and extend `src/components/ui/*` primitives.
   - Follow established design patterns in existing forms/tables/modals.
   - Respect dark mode and theming conventions.

6. **Incremental, Roadmap-Driven Development**
   - Align changes with `docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md` and `docs/PROJECT_PLAN.md`.
   - Prefer completing existing partial features before adding new ones, unless explicitly instructed otherwise.

---

## 4. Agent Workflow

The agent should generally follow this step-by-step workflow for any task.

### 4.1. Understand Context

1. **Read internal docs first**
   - `docs/README.md`
   - `docs/COMPREHENSIVE_CODEBASE_ANALYSIS.md`
   - `docs/analysis/COMPREHENSIVE_ANALYSIS.md`
   - `docs/complete-implementations/*` relevant to the domain (e.g., code review, audits).
   - `docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md` and `docs/PROJECT_PLAN.md`.

2. **Scan relevant source**
   - `src/app/...` routes or pages affected.
   - `src/lib/*` helpers.
   - `src/components/*` UI and client logic.
   - Prisma schema and related services.

3. **Locate roadmap references**
   - Check if the requested change appears in the roadmap, audit report, or code review documents.
   - Respect existing prioritization and patterns recommended there.

### 4.2. Fetch Latest External Documentation (via MCP)

Before coding:

1. For the relevant technology (Next.js, shadcn/ui, Prisma, NextAuth, etc.), use MCP tools to:
   - Fetch the most recent stable documentation.
   - Search for best practices or examples that match the desired change.
2. Note version-specific details, deprecations, and recommended patterns.
3. Confirm that the planned implementation does not conflict with updated guidance.

This step is **required** for all substantial changes.

### 4.3. Propose Design

For any non-trivial change:

1. Summarize:
   - What is being changed and why.
   - The multi-tenant and security impacts.
2. Outline:
   - Necessary schema changes (if any).
   - Service-layer changes.
   - API route changes.
   - UI changes.
3. Validate:
   - Ensure the plan aligns with docs in `docs/` and latest external guidance (via MCP).

### 4.4. Implement Incrementally

When implementing:

- **Schema & Data Layer**
  - Extend Prisma schema following existing patterns.
  - Use proper `storeId` / `organizationId` relations.
  - If migrations are required, follow the established migration strategy.

- **Service Layer**
  - Add or extend service classes rather than embedding logic directly in route handlers.
  - Respect existing error types and success response structures.

- **API Routes**
  - Keep them thin:
    - Validate input with Zod.
    - Call services.
    - Handle known error cases with consistent HTTP status codes.

- **UI/UX**
  - Use shadcn/ui components, following the conventions from existing pages.
  - Maintain consistent layout, spacing, and dark-mode behavior.
  - Implement loading and error states.

### 4.5. Validation & Testing

- Ensure:
  - TypeScript passes.
  - Lint warnings are not increased (prefer reducing them when possible).
  - Existing flows (auth, dashboard navigation, basic product/order flows) are not broken.
- If adding new API endpoints:
  - Consider minimal integration tests or at least clear manual testing instructions.

---

## 5. Domain-Specific Guidance

### 5.1. Multi-Tenancy

- Always:
  - Filter and write via `storeId` or `organization` when applicable.
  - Confirm membership and role before performing administrative actions.
- Never:
  - Allow queries without a tenant scope in e‑commerce domains.
  - Expose cross-organization or cross-store data.

### 5.2. Authentication & Authorization

- Use existing NextAuth configuration and patterns:
  - Enforce sign-in for protected routes (dashboard, team, settings).
  - Use membership roles for access control when operating on organizations/stores.
- When updating auth:
  - Use MCP to fetch the latest NextAuth and security recommendations.
  - Update docs if you significantly change auth behavior.

### 5.3. E‑commerce Flows

Planned/known gaps from internal docs include (examples, not exhaustive):

- Cart & checkout models (`Cart`, `CartItem`, `Coupon`, `PaymentTransaction`).
- Stripe integration for billing and payments.
- Fulfillment, returns, promotion systems.

When working on these:

1. Read:
   - `docs/complete-implementations/*` audit and gap analyses.
   - `docs/research/business_logic_review.md`.
2. Use MCP tools to:
   - Fetch best practices from modern e‑commerce systems and Stripe docs.
3. Implement:
   - Tenant-safe, auditable flows (logs, status transitions).
   - Clear separation between customer-facing flows and admin operations.

---

## 6. Working with shadcn/ui

- Always:
  - Reuse existing `src/components/ui/*` primitives where possible.
  - Follow patterns in existing form/table/page components (see `*-page-client.tsx`, `*-table.tsx`, `*-form*.tsx`).
- Before introducing:
  - A new shadcn component or pattern, use MCP tools to:
    - Fetch the most recent shadcn/ui docs/examples.
    - Ensure API signatures and props match the current version.
- Keep:
  - Accessibility, keyboard navigation, and semantics consistent with shadcn recommendations.

---

## 7. Documentation Duties

Whenever the agent makes significant changes:

1. Update or add documentation under `docs/`:
   - Architecture changes → `docs/COMPREHENSIVE_CODEBASE_ANALYSIS.md` or a new analysis file.
   - Roadmap adjustments → `docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md`.
   - New domain features → separate docs under `docs/complete-implementations/` or `docs/research/`.
2. Ensure:
   - The new documentation is consistent with **both** the implementation and the latest external docs (fetched via MCP).
3. Consider:
   - Adding brief API descriptions where relevant (until a full API documentation system is built).

---

## 8. Guardrails & Anti‑Patterns

The agent **must not**:

- Introduce new patterns that contradict:
  - Multi-tenant isolation.
  - The service-layer approach.
  - Established Zod-based validation practices.
- Directly copy code from external sources without:
  - Verifying compatibility using MCP-fetched documentation.
  - Adapting to StormCom’s architecture.
- Downgrade security:
  - No broad `*` CORS.
  - No bypasses of authorization checks.
  - No logging sensitive information.

---

## 9. Summary of Non‑Negotiable Rules

1. **Always use MCP tools to fetch the latest external documentation** (Next.js, shadcn/ui, Prisma, NextAuth, Stripe, etc.) **before** implementing or updating significant behavior.
2. **Always respect multi-tenancy** (`organization`, `storeId`, `Membership` and roles).
3. **Always keep business logic in services**, with API routes as thin adapters using Zod validation.
4. **Always follow repo documentation and roadmap** under `docs/` and keep it up to date.

If any requested change conflicts with these principles, the agent must:
- Explain the conflict.
- Propose an alternative aligned with StormCom’s architecture and current best practices (validated via MCP-fetched documentation).
