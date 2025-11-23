# StormCom Implementation Plan (Technical Execution Guide)

## Guiding Principles
- Incremental & reversible: additive schema first; dual-write transitions; delayed removal of deprecated fields.
- Tenant safety: every new query path enforces `storeId` scoping; repository pattern adoption early.
- Observability first: correlation IDs & structured logging from phase 1.
- Feature flags: enable new modules per store gradually for validation.

## High-Level Workstreams
| Workstream | Description | Parallelizable |
|------------|-------------|----------------|
| Schema Evolution | Define & migrate new tables | Yes (batch additive) |
| Service Layer | Introduce domain services enforcing invariants | Partial |
| API Expansion | tRPC internal + REST public + GraphQL | Staggered |
| Caching Strategy | Tagging & invalidations | With service layer |
| Extensibility | Webhooks + background jobs | After service baseline |
| Security & RBAC | Permissions + rate limiting + audit enhancements | Parallel once service layer exists |
| Internationalization | Translations + currency pricing | After pricing foundation |

## Detailed Step Plan

### Step 1: Repository & Service Layer Foundation
- Create `repos/` with scoped repositories (ProductRepo, OrderRepo, CustomerRepo).
- Add unit tests (lightweight) verifying tenant filter enforced (future expansion). *Do not build full test infra now.*
- Introduce `services/orderService.ts` implementing order creation pipeline (validation, pricing, inventory reservation, audit log emission).

### Step 2: Additive Schema Migration Batch 1
Tables: `PaymentAttempt`, `Refund`, `Fulfillment`, `FulfillmentItem`, `ReturnRequest`, `ReturnItem`, `Collection`, `CollectionProduct`, `DiscountCode`, `ProductImage`.
- Prisma migration script: additive.
- Backfill product images from existing JSON (if any) – later migration.

### Step 3: Order Lifecycle Integration
- Extend order creation to generate initial `PaymentAttempt` (PENDING).
- Add fulfillment creation endpoint (internal tRPC + REST).
- Add return request flow (initial: states requested → approved → refunded).
- UI: add tabs/views (Orders → Returns / Fulfillments).

### Step 4: Pricing & Promotion Foundation
- Add `PromotionRule`, `AppliedPromotion`, `ProductPrice` tables.
- Create pricing service: resolves applicable prices (currency, segment, volume tiers).
- Promotion evaluator: iterates active rules & discount codes; returns structured discount lines.
- Dual-write `ProductPrice` (legacy product.price remains authoritative until validated).

### Step 5: Inventory Event Model
- Add `InventoryAdjustment` & `StockReservation` tables.
- Wrap inventory changes through `inventoryService.adjust()`.
- Add reservation logic in orderService checkout path.
- Create reconciliation script verifying `product.inventoryQty == initial + sum(adjustments) - reservedOutstanding`.

### Step 6: Extensibility & Observability
- Add `WebhookSubscription` & `WebhookDelivery` tables.
- Introduce event emitter infrastructure (e.g., simple in-memory publish/subscribe later replaced by queue).
- Capture `AnalyticsEvent` for order.created, product.updated, inventory.low_stock.
- Expand `AuditLog` with correlationId, requestId, actorType, severity.
- Logging: structured JSON logs; correlation ID middleware attaches header.

### Step 7: RBAC Granularity & API Tokens
- Add `Permission`, `RolePermission`, `ApiToken` tables.
- Migration: map existing roles → permission sets.
- Authorization middleware: `requirePermission("product.write")`.
- UI: permission matrix editor.

### Step 8: Webhook Delivery Worker & Rate Limiting
- Introduce BullMQ with Redis.
- Worker for webhook delivery with exponential backoff.
- Rate limiting middleware (sliding window) for selected endpoints.

### Step 9: GraphQL Gateway (Storefront Composition)
- Define schema (products, collections, pricing). 
- Resolvers call service layer; implement dataloaders for N+1 mitigation.
- Add `cacheTag` invalidation to resolvers affecting static queries.

### Step 10: Internationalization & Multi-Currency
- Add `ProductTranslation`, `CategoryTranslation`, `BrandTranslation`, `CurrencyRate` tables.
- Extend pricing service for currency conversion & locale fallback.
- UI: locale switcher & translation editor.

### Step 11: Recommendation & Search Enhancement
- Add `ProductEmbedding` table.
- Background job to generate embeddings (stub algorithm → expand later).
- Search endpoint uses trgm + optional embedding similarity.

### Step 12: Event Sourcing Pilot (Inventory)
- Switch inventory adjustments seeding to rely solely on `InventoryAdjustment` + projection.
- Build script to regenerate `product.inventoryQty` from adjustments (for verification).

### Step 13: Hardening & Performance Optimization
- Query EXPLAIN profiling top endpoints.
- Add missing partial indexes, optimize composite indexes.
- Implement cache component directives (`use cache` / tags) for stable server components.

### Step 14: Documentation & Developer Experience
- Auto-generate API reference from OpenAPI for REST endpoints.
- Provide GraphQL schema docs, permission matrix docs, webhook event catalog.

## Caching & Invalidations Specifics
| Event | Tags Invalidated |
|-------|------------------|
| Product update | `product:{id}`, `category:{categoryId}`, `collection:{collectionId}` |
| Price change | `price:{productId}` |
| Inventory adjustment | `inventory:{productId}` |
| Promotion rule change | `promotion:list`, `collection:{affectedCollection}` |
| Fulfillment shipped | `order:{id}` |

## Transaction Boundary Examples
- Order creation:
  1. Validate input.
  2. Begin transaction.
  3. Create `Order` (status=PENDING).
  4. Create `StockReservation` records.
  5. Create `PaymentAttempt` (PENDING).
  6. Emit domain event (order.created) and audit log.
  7. Commit transaction.

- Refund issuance:
  1. Begin transaction.
  2. Insert `Refund` (pending).
  3. Update `Order` (status maybe remains PAID until processed).
  4. Emit audit + webhook.
  5. Commit.

## Risk Register & Mitigation Strategy
| Risk | Mitigation | Exit Criteria |
|------|-----------|--------------|
| Dual-write divergence (pricing) | Nightly consistency job; alerts when mismatch > threshold | 30 days without mismatch |
| Webhook storm | Backpressure via queue concurrency; per-subscription rate limits | P95 delivery under SLA |
| Inventory race | Row-level locks on Product/Variant during reservation | Zero negative stock incidents |
| Index bloat | Quarterly index review script (size, usage) | Acceptable ratio (<30% unused) |
| Migration failures | Dry-run on staging copy; fallback DB snapshot | Successful staging validation |

## Monitoring & Alerts
| Metric | Threshold | Action |
|--------|----------|--------|
| Error rate (5xx) | >2% per 5 min | Pager alert, rollback recent deploy |
| Slow order creation (P95 > 500ms) | >2 intervals | Investigate DB slow queries |
| Webhook failures | >10% failed after retries | Inspect target endpoints, throttle |
| Inventory drift | non-zero reconciliation diff | Investigate adjustment logic |
| Promotion evaluator latency | >150ms avg | Optimize rule indexing or precompilation |

## Tooling & Libraries
| Concern | Tool | Notes |
|---------|------|------|
| Background jobs | BullMQ | Redis-backed, simple priority queues |
| Rate Limiting | custom + Redis | Sliding window or token bucket |
| Search (phase 1) | Postgres pg_trgm | Add extension migration |
| Embeddings | External service / open-source model | Cache vectors in DB |
| Monitoring | OpenTelemetry + Prometheus exporter | Standard instrumentation |
| Validation | Zod / Valibot | Shared schemas across API layers |

## Decommissioning / Cleanup Plan
- After pricing dual-write stable: remove legacy product price fields.
- After inventory event sourcing stable: mark `InventoryLog` deprecated (keep for audit or migrate into DomainEvent).
- Static page generation fallback removed once tag caching proves consistent.

## Success Definition
StormCom achieves:
- Full commerce lifecycle fidelity (orders → fulfillment → returns/refunds).
- Merchants can optimize pricing & promotions dynamically.
- Stable extensibility surface (webhooks + APIs) enabling integrations.
- Scalable tenant architecture with security and observability baked in.
- Path to advanced features (internationalization, recommendations) without structural overhaul.

## Final Notes
Maintain disciplined documentation updates per migration. Every new table accompanied by a short ADR (Architecture Decision Record) explaining rationale and alternatives considered.
