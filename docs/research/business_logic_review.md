# StormCom Business Logic Review

## Overview
StormCom aims to empower business owners to launch and operate individualized multi-tenant e‑commerce storefronts. Current implementation focuses on core catalog, order, customer, review, inventory audit logging, and organization membership. This review evaluates the present maturity versus a comprehensive SaaS commerce platform vision (products, inventory, orders, customers, marketing, analytics, extensibility, RBAC, compliance) and identifies gaps with prioritized recommendations.

## Domain Coverage Matrix
| Domain | Current Implementation | Maturity Level | Key Gaps | Recommendations |
|--------|-----------------------|----------------|----------|-----------------|
| Tenant & Org | `Organization`, `Membership`, `Store` (extends org) | Foundational | Limited subscription granularity; no usage metering | Add metering (orders/products count), upgrade workflow, usage overage alerts |
| Catalog | `Product`, `ProductVariant`, `Category`, `Brand`, `ProductAttribute`, `ProductAttributeValue` | Functional | No collections, bundles, product images table, translations, multi-currency, price tiers | Add `Collection`, `CollectionProduct`, `ProductBundle`, `BundleItem`, `ProductImage`, `ProductPrice`, translation tables |
| Inventory | Inline product qty + `InventoryLog` | Foundational | No reservations, safety stock, event sourcing separation | Add `InventoryAdjustment`, `StockReservation`, projection table, low stock scheduled job |
| Orders | `Order`, `OrderItem` | Functional | Missing fulfillment splits, returns, refunds, payment attempts, fulfillment tracking | Add `PaymentAttempt`, `Fulfillment`, `FulfillmentItem`, `ReturnRequest`, `ReturnItem`, `Refund` |
| Customers | `Customer` + basic marketing flags | Foundational | No segmentation, custom fields, lifecycle metrics | Add `CustomerSegment`, `CustomerSegmentMember`, `CustomerCustomField`, metrics table |
| Reviews | `Review` | Functional | Missing moderation workflow states beyond approval | Extend with `status` enum (PENDING/APPROVED/REJECTED) + moderation logs |
| Pricing & Promotions | Single price fields in Product/Variant | Minimal | No discount codes, promotions, tiered pricing | Add `DiscountCode`, `PromotionRule`, `AppliedPromotion`, `ProductPrice` |
| Payments | Embedded fields in `Order` | Minimal | No payment retry tracking, gateway abstraction | Add `PaymentProviderConfig`, `PaymentAttempt`, `Refund`, fraud assessment |
| Shipping & Fulfillment | Basic fields on Order (trackingNumber) | Minimal | No shipping rates, shipments, partial fulfillments | Add `ShippingProfile`, `ShippingRate`, `Fulfillment`, `Shipment` |
| Subscriptions (Platform) | Store plan enums on `Store` | Foundational | Product/service subscription support missing | Add separate `Subscription` domain for recurring product/service billing |
| Marketing | None beyond acceptsMarketing | Minimal | No campaigns, automation, abandoned cart | Add `EmailCampaign`, `EmailEvent`, `Cart`, automation jobs |
| Analytics | None (implicit audit) | Minimal | No events, no aggregated metrics | Add `AnalyticsEvent`, `DailyStoreMetrics`, `CohortMetrics`, `OrderAttribution` |
| RBAC & Permissions | Enum `Role` (OWNER/ADMIN/MEMBER/VIEWER) | Foundational | Granularity missing (resource-level) | Add `Permission`, `RolePermission`, `ApiToken` |
| Audit & Observability | `AuditLog`, `InventoryLog` | Functional | No correlation/request IDs, HMAC, structured diff | Extend `AuditLog` fields, add signing; add `DomainEvent` for key transitions |
| Extensibility | Not implemented | Minimal | No webhooks, no plugin/app model | Add `WebhookSubscription`, `WebhookDelivery`, `AppIntegration` |
| Internationalization | Not implemented | Minimal | No localized names, pricing, currency conversion | Add translation tables, `CurrencyRate`, multi-currency `ProductPrice` |
| Search & Discovery | Basic product indexing (implicit) | Minimal | No advanced search, no vector recs | Add `ProductEmbedding`, evaluate pg_trgm + vector search service |

## Business Logic Strengths
- Clear tenant scoping via `storeId` and `organizationId` fields.
- Explicit audit and inventory log baseline provides foundation for compliance.
- Variant model exists early (better than SKU-only modeling). 
- Subscription plan fields on Store allow platform monetization gating.

## Business Logic Weaknesses / Risks
- Order lifecycle lacks intermediate states (no partial fulfillment or returns) increasing future refactor cost.
- Pricing logic coupled to Product; no tiering or dynamic pricing makes upsell/segmentation difficult.
- Permission granularity risks over-provisioning (admin roles too powerful) and under-provisioning (member lacks fine scopes).
- Missing extensibility (webhooks) delays ecosystem and third-party integration adoption.
- Inventory accuracy risk under concurrent order creation (no reservation snapshot or atomic decrement pattern described).

## Gap Impact Prioritization (High = immediate revenue / integrity impact)
| Gap | Impact | Reason |
|-----|--------|--------|
| Lack of payment attempts/refunds | High | Required for financial auditing & dispute resolution |
| Missing discount/promotion system | High | Direct effect on merchant conversion strategies |
| Absent fulfillment entities | High | Necessary for operational scaling & partial shipments |
| No inventory reservations | High | Risk of overselling under concurrency |
| Lack of webhooks | Medium-High | Blocks integration channels (ERP, email marketing) |
| No RBAC granularity | Medium | Security & least privilege principle |
| No collections/bundles | Medium | Merchandising & AOV optimization |
| Missing analytics events | Medium | Data-driven iteration hindered |
| Internationalization absent | Medium | Limits global expansion |
| Marketing automation missing | Medium | Lifecycle retention & abandoned cart recovery |
| No translations / multi-currency | Medium | Core for cross-border scaling |
| No event sourcing/structured domain events | Low-Medium | Future resilience & debugging |

## Recommended Business Logic Evolution Phases
1. Lifecycle Completeness: PaymentAttempt, Refund, Fulfillment, ReturnRequest; Inventory reservations; DiscountCode.
2. Merchandising & Pricing: Collections, Bundles, ProductPrice multi-tier & multi-currency; PromotionRule engine.
3. Extensibility & Observability: WebhookSubscription, AnalyticsEvent, DomainEvent, RolePermission granularity.
4. Intelligence & Internationalization: Segmentation, ProductEmbedding, translations, currency conversion, Marketing automation.
5. Advanced Reliability: Event sourcing for inventory & order transitions, workflow orchestration (Temporal), fraud scoring.

## Cross-Cutting Concerns
- Consistency: Introduce service layer (e.g. `orderService.createOrder`) enforcing idempotency and business invariants.
- Validation: Central schema validation for complex updates (Zod or Valibot) with error classification (USER vs SYSTEM).
- Performance: Cache tagging (`product:{id}` / `category:{id}`) for rapid revalidation after updates.
- Observability: Correlation IDs passed from request → service → audit events for end-to-end tracing.

## Derived KPIs / Metrics To Enable
| KPI | Source Tables | Notes |
|-----|---------------|-------|
| Gross Merchandise Volume (GMV) | `Order` (totalAmount) | Exclude refunded/canceled |
| Average Order Value (AOV) | `Order` | totalAmount / paid orders |
| Conversion Rate | Sessions (future) vs `Order` | Requires storefront tracking |
| Inventory Turnover | `InventoryAdjustment`, `Product` | (COGS / Avg Inventory) approximation |
| Customer Lifetime Value (CLV) | `Customer` aggregated orders | Use predictive model later |
| Cart Abandonment Rate | `Cart`, `Order` | (# carts - orders) / carts |
| Promotion Effectiveness | `AppliedPromotion`, `Order` | Extra margin vs baseline |

## Immediate Model Additions (Schema Draft Snippets)
```prisma
model Collection {
  id        String @id @default(cuid())
  storeId   String
  store     Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  name      String
  slug      String
  description String?
  isPublished Boolean @default(true)
  sortStrategy String @default("manual") // manual|bestseller|newest
  products  CollectionProduct[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([storeId, slug])
}

model CollectionProduct {
  id           String @id @default(cuid())
  collectionId String
  productId    String
  position     Int @default(0)
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  product      Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([collectionId, productId])
  @@index([productId])
}

model DiscountCode {
  id        String @id @default(cuid())
  storeId   String
  code      String
  type      DiscountType
  value     Float
  usageLimit Int? // total redemption cap
  usedCount Int @default(0)
  minSpend  Float? 
  startsAt  DateTime?
  endsAt    DateTime?
  isStackable Boolean @default(false)
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([storeId, code])
  @@index([storeId, isActive])
}
```

(Additional drafts will appear in database schema analysis document.)

## Risks if Deferred
- Financial reconciliation complexity increases without payment/fulfillment granularity.
- Marketing performance stagnates absent promotions & automation.
- Hard retrofits: adding event sourcing later requires migration complexity; better to plan append-only adjustment tables now.

## Conclusion
StormCom has a strong foundational base but must expand horizontally (promotions, fulfillment lifecycle, pricing tiers, segmentation, extensibility) and vertically (observability, event sourcing, security) to achieve full SaaS competitiveness. The phased plan minimizes disruption while unlocking incremental merchant value. Subsequent documents detail schema evolution, API refactor strategy, and implementation roadmap.

---

# Deepened Research Addendum (Architecture, Security, Performance, Growth, Governance)

This addendum extends the initial review with competitor differentiation, security threat modeling (STRIDE), performance & cost optimization, advanced marketing automation patterns, permission taxonomy, data retention & compliance, observability baseline, and proposed model summary. It is intentionally high-density for architectural decision support.

## Executive Highlights
- Immediate priority: Implement permission system + inventory reservation + cache tagging to mitigate security & performance risks early.
- Introduce denormalized `ProductSummary` and partition-ready logs before data volume creates index bloat.
- Marketing automation & segmentation yield direct merchant value; schedule after lifecycle completeness and security hardening.

## Competitor Differentiation Summary (Condensed)
StormCom can differentiate by embedding segmentation, automation, fine-grained RBAC, and transparent domain event streams earlier than incumbents (Shopify, Saleor, Medusa, CommerceTools, BigCommerce) while maintaining lower operational complexity (single Postgres + Vercel deployment, edge caching strategies).

## Security Threat Model (STRIDE Condensed)
| Threat | Vector | Impact | Mitigation |
|--------|--------|--------|-----------|
| Tenant Spoofing | Forged storeId | Cross-tenant leak | Mandatory server-side scoping + RLS (future) |
| Inventory Race | Concurrent decrements | Oversell | Reservation + atomic decrement transaction |
| Discount Abuse | Rapid redemption race | Revenue loss | Concurrency control + usage counters locked |
| Payment Replay | Reused webhook payload | Double refund | Nonce + timestamp + processed-event ledger |
| SSRF via Webhook | Internal host target | Internal exposure | Host/IP validation + allowlist + rate limit |
| Privilege Escalation | Role misconfiguration | Data tamper | Permission taxonomy + audit of grants |
| Audit Repudiation | Deleted/altered entries | Forensic gap | Append-only hash-chained audit logs |

## Performance & Scaling Levers (Targets)
| Lever | Target Improvement | Action |
|-------|--------------------|--------|
| Edge Cache + Tags | 60–80% TTFB reduction | Implement tag invalidation hooks |
| RSC Streaming | 20–40% faster initial bytes | Introduce Suspense boundaries |
| Denormalized Reads | 2–4× faster product list | Create `ProductSummary` table |
| Image Optimization | 30–60% bandwidth savings | AVIF/WebP + responsive sizes |
| Reservation Service | Prevent oversell | New `InventoryReservation` table |

## Cost Optimization Quick Wins
1. Cache dynamic product/category pages (cut redundant SSR).  
2. Move old audit/inventory logs to partitions (reduce hot index scans).  
3. Introduce CDN image optimization pipeline (reduce LCP & bandwidth).  
4. Denormalize frequent aggregates (lower DB CPU).  

## Marketing Automation Data Requirements
| Feature | Required Fields | Supporting Models |
|---------|-----------------|------------------|
| RFM Scoring | lastOrderAt, totalSpent, totalOrders | `CustomerRFMSnapshot` |
| Abandoned Cart | cart items, lastActivityAt | `Cart`, `CartItem` |
| Churn Risk | inactivity duration, engagement | `CustomerLifecycleMetrics`, `EmailEvent` |
| Upsell/Cross-sell | order history, attributes | `RecommendationEvent`, existing product relations |

## Permission Taxonomy (Minimal Set)
`product.read`, `product.write`, `product.publish`, `inventory.adjust`, `order.fulfill`, `order.refund`, `promo.manage`, `customer.segment.manage`, `webhook.manage`, `analytics.view`, `settings.manage`, `billing.manage`, `admin.superuser`.

## Data Retention & Compliance (Abbreviated)
| Data | Retention | Action |
|------|-----------|--------|
| Audit Logs | 24m (hot 6m) | Partition + archive |
| Inventory Logs | 12–24m | Archive >12m |
| Orders | Indefinite | Pseudonymize on RTBF |
| Email Events | 12m | Aggregate older |
| PII | 24m inactivity | Anonymize sweep |

## Observability Baseline
Metrics: order throughput, payment failure %, inventory adjust p95, cache hit ratio.  
Traces: order creation pipeline (include `storeId`, `orderId`).  
Logs: structured JSON + correlationId.  
Synthetic: checkout flow, refund flow, webhook delivery.

## New / Extended Models (Snapshot)
`ProductSummary`, `InventoryReservation`, `CustomerSegment`, `CustomerRFMSnapshot`, `CustomerLifecycleMetrics`, `Cart`, `CartItem`, `EmailEvent`, `DomainEvent`, `Permission`, `RolePermission`, `ApiToken`.

## Immediate Action Checklist (Phase A)
1. Implement permission tables & enforcement layer.  
2. Add cache tags & invalidation for product/category mutations.  
3. Create reservation logic + adjustments service wrapper.  
4. Introduce OpenTelemetry instrumentation.  
5. Build `ProductSummary` migration & backfill task.  

## Risk Matrix (Condensed)
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Oversell | Med | High | Reservation + atomic decrement |
| Unscoped Query | Low-Med | High | Repo lint + mandatory tenant predicates |
| Promotion Miscalc | Med | Med | Deterministic rule engine + tests |
| Audit Tampering | Low | High | Hash chain + append-only storage |
| Partition Delay | Med | Med | Establish volume thresholds alerts |

## Architectural Decision Priorities
1. Adopt tag-based caching now (simple invalidation hooks).  
2. Implement permission system before expanding sensitive endpoints (refunds, webhook manage).  
3. Denormalize read-heavy product lists prior to marketing feature rollout.  
4. Lay groundwork for automation engine (event triggers + idempotent tasks).  

---
*Addendum integrated. Future updates should extend per-phase ADRs and reconcile with implementation roadmap.*

## 1. Competitor Architectural Patterns & Differentiators

| Competitor | Core Architectural Pattern | Strengths (Relevant) | Weaknesses / Trade‑offs | StormCom Differentiation Opportunities |
|------------|-----------------------------|----------------------|-------------------------|----------------------------------------|
| Shopify (Hydrogen + Oxygen) | Hydrogen = React storefront framework consuming Shopify Storefront GraphQL; Oxygen = global edge hosting; strong API + metafields; function extensibility via Shopify Functions | Mature global CDN, battle‑tested checkout, unified admin, metafields extensibility | Vendor lock‑in to Shopify data model; limited low‑level control over checkout & pricing engine internals; custom logic constrained by Function limits | Offer deeper domain customization (pricing rules engine, inventory reservation strategy) and first‑class multi‑tenant segmentation inside same deployment; open event stream for real-time integrations |
| Saleor | Modular headless GraphQL schema (Products, Checkout, Channel); plugin system; event webhooks | Clean GraphQL contract; channel concept built‑in (multi‑currency, regional catalogs) | Complexity of plugin lifecycle; heavy GraphQL dependency (over-fetch risk); operational overhead for scaling resolvers | Lean REST + selective GraphQL for high-demand resources; simpler channel abstraction via Store settings + Price matrix; integrate RSC streaming for lighter hydration |
| Medusa | Node microservice services + event bus (Redis) + subscribers; modular services (cart, order, product) | Clear domain service boundaries; event-driven extensibility; open-source flexibility | Redis event bus extra infra; possible eventual consistency pitfalls; multi-tenant story less prescriptive | Adopt lightweight domain events (append-only) without full microservice overhead; minimize infra (single Postgres + partitioning) while keeping extension points |
| CommerceTools | Cloud microservices, API-first (per domain), strong scalability & SLAs | Horizontal scalability; granular domain separation; powerful product modeling | Cost & operational complexity; customization via APIs only | Provide 80/20 domain coverage with lower complexity & cost for SMB; built-in marketing automation rather than third-party tooling |
| BigCommerce (Headless) | Multi-channel headless APIs + storefront tooling; separate catalog per channel; webhooks | Proven multi-channel features; broad ecosystem | Channel complexity overhead for early-stage merchants; some workflows require admin UI coupling | Progressive channel abstraction (activate advanced channel features only at higher plan); integrated lifecycle metrics & automation |

Actionable Differentiators:
- Unified Next.js 16 RSC + edge caching + tag invalidation pipeline for low-latency global product & merchandising changes.
- Built-in segmentation & marketing automation primitives (RFM, abandoned cart) vs external plugins.
- Transparent domain event log & analytics aggregation enabling self-serve data export (avoids vendor lock-in).
- Permission granularity and API token scopes earlier than incumbents (secure growth for multi-staff stores).
- Simpler deployment (single Vercel project + Postgres + object storage) until scale demands partitioning.

## 2. Security Threat Model (Multi-Tenant SaaS Commerce)

| Asset | Threat (STRIDE) | Vector Example | Impact | Mitigation (Technical) | Mitigation (Process) |
|-------|-----------------|---------------|--------|------------------------|----------------------|
| Tenant Data (Products, Orders) | Spoofing / Elevation | Forged `storeId` in API request | Cross-tenant data leak | Enforce server-side tenant scoping (where clauses: `storeId AND organizationId`); never trust client store identifiers; signed JWT with org claims | Periodic RBAC audit; automated query lint to detect missing tenant predicate |
| Pricing & Discount Rules | Tampering | Manipulating discount code usage count via race condition | Financial loss | Use optimistic concurrency / row-level locking on redemption; idempotent discount application service | Monitor abnormal redemption velocity; alert thresholds |
| Inventory Quantities | Tampering / DoS | Concurrent oversell update without atomic check | Negative stock / fulfillment failures | Transactional decrement with conditional check (`WHERE inventoryQty >= requested`); inventory reservation table | Reconciliation scheduled job; anomaly detection on rapid negative adjustments |
| Payment / Refund API | Replay / Spoofing | Reuse of signed webhook or payment callback payload | Double refunds / unauthorized status change | Include nonce + timestamp; store processed event IDs; signature (HMAC SHA256) with rotation | Manual refund verification for high-value orders |
| Webhook Endpoints | SSRF / DoS | Merchant registers internal service URL for test webhook | Internal network exposure; resource exhaustion | Validate webhook target host against allowed schemes; DNS & IP blacklist (RFC1918 ranges); rate limit per subscription | Webhook registration approval workflow (for elevated plans) |
| Admin Panel Actions | Elevation | Role misconfiguration grants `admin.superuser` inadvertently | Unintended destructive actions | Role-permission mapping table; deny-by-default for dangerous scopes (refund, fulfill) | Quarterly permission review; least-privilege training |
| Search / Filter Inputs | Injection | Unsafe string interpolation into Prisma raw query | Data corruption | Avoid raw SQL; use Prisma parameterization; centralized query builder | Code review checklist for any raw queries |
| File/Image Uploads | Information Disclosure | Malicious SVG with script to exfiltrate data on admin render | Admin XSS → token leakage | Sanitize uploads (image transcoding, strip scripts); CSP headers; serve via immutable CDN domain | Security scanning of assets periodically |
| Session Tokens | Spoofing / Disclosure | Token theft via XSS | Account compromise | HttpOnly, Secure cookies; rotate session on privilege change; CSP + strict input sanitization | Incident response playbook |
| Audit Logs | Repudiation | Attacker deletes audit entries via compromised admin | Forensic gap | Append-only (immutable) audit storage; cryptographic hash chain; restricted write API | Monthly integrity verification job |
| Catalog Update API | DoS | Flood variant creation to exhaust DB connections | Performance degradation | Rate limiting (sliding window / token bucket); background queue for bulk import | Usage quotas per plan; import size approval |

STRIDE Summary & Additional Mitigations:
- Spoofing: Strong auth (NextAuth), signed server actions, per-request correlation ID, mTLS optional for internal callbacks.
- Tampering: Row-level locking, version fields (optimistic concurrency), hashed diff logs.
- Repudiation: Immutable audit + hash chain + clock skew detection.
- Information Disclosure: Field-level encryption (customer PII), output encoding, RBAC on analytics exports.
- Denial of Service: Rate limits, circuit breakers for external APIs, backpressure on queues.
- Elevation of Privilege: Explicit permission grants, no implicit role inheritance beyond defined mapping, admin action MFA (high-risk operations).

## 3. Performance & Scaling Strategies (Next.js 16 / Vercel)

Key Levers:
1. Edge HTML & Data Caching: Tag-based invalidation (`product:{id}`, `category:{id}`, `price:list`) using Next.js Cache Tags. Typical improvement: Product detail TTFB reduced from ~400–800ms (dynamic SSR) to ~80–200ms (edge cached) — ~60–80% reduction. Category pages similar (~500–900ms → 120–250ms).
2. RSC Streaming: Server Components stream reduces time-to-first-byte vs full render by 20–40% on component-heavy pages (industry patterns from large React storefronts).
3. Segment Caching: Cache stable layout/menu fragments (brand list, top categories) separately; reuse across requests lowering server compute cost ~15–25% CPU.
4. Image Optimization: `next/image` + AVIF/WebP reduces bandwidth 30–60%; faster LCP improves conversion (studies show 100ms LCP gain can raise conversion 1–2%).
5. Database Connection Pooling: Use Prisma Data Proxy or PgBouncer. Guideline: Keep active serverless connection spikes < 20; pool size per function often 1–5 logical connections; use Data Proxy for burst absorption.
6. Query Shaping / Read Models: Precompute daily metrics & denormalized product summary table to drop per-request JOINs (reducing query latency from ~30–60ms multi-join to <10–15ms single-table fetch).
7. Partitioning & Archiving: Time-based partition on `AuditLog` & `InventoryLog` after 5–10M rows; keep “hot” partition (last 30 days) small (<5GB) for index efficiency.
8. Async Workflows: Offload indexing, email sends, large imports to queue (e.g., Vercel Cron + external queue or Durable Object). Avoid >1s blocking request time.
9. CDN & Static Asset Strategy: Long max-age immutable for images; shorter Edge TTL for product HTML (e.g., 60–300s) + manual tag invalidation on updates.
10. Concurrency Controls: Inventory reservation prevents race oversell; measure inventory adjust latency (target p95 < 50ms).

Targets & Monitoring (Reference Ranges):
- Product Page p95 TTFB: <250ms cached, <500ms uncached.
- Checkout API p95 latency: <350ms (includes payment gateway roundtrip stub when local test).
- Order creation throughput (SMB baseline): sustain 10–20 orders/minute; flash sale stress test 100–300 orders/min (queue assisted).
- DB Query p95 latency (primary read): <40ms (hot partition), <80ms (cold partitions).
- Error rate: <0.5% failed HTTP 5xx across commerce APIs.

StormCom Gaps & Actions:
- Implement Cache Tags + revalidation hooks after product/category mutation.
- Introduce denormalized read model table `ProductSummary`.
- Add connection pooling configuration & switch to Postgres (production) with Data Proxy.
- Create inventory reservation + atomic decrement service.
- Implement partition-ready schema for large append-only tables (add `partitionKey` or time-index).

## 4. Cost Optimization Framework

Cost Drivers:
- Compute (Serverless invocations & edge functions)
- Database (Postgres storage + connection overhead)
- CDN Bandwidth (images, product pages)
- External Services (Resend emails, payment gateway fees)
- Storage (Object store for images)

Optimization Levers:
| Lever | Cost Area | Mechanism | Expected Benefit |
|-------|-----------|-----------|------------------|
| Image Optimization (AVIF/WebP, responsive sizes) | CDN Bandwidth | Lower bytes transferred | 30–60% bandwidth reduction |
| Edge Caching & Tag Invalidation | Compute + DB | Fewer origin SSR renders | 50–80% reduction in dynamic render cost |
| Denormalized Read Models | DB CPU | Reduce complex joins per request | 2–4x faster reads; lower compute |
| Selective Async Queues | Compute | Short invocations avoid memory/time premium | Reduced tail latency & cold start cost |
| Connection Pool/Data Proxy | DB | Prevent connection exhaustion, right-size pool | Avoid forced plan upgrade |
| Compression & Minification | CDN | Smaller transfer for JS/JSON | 20–30% payload savings |
| Webhook Retry Backoff (exponential capped) | Compute | Avoid hot-loop retries for failing endpoints | Lower wasted invocation cost |
| Tiered Storage / Archiving Logs | DB | Move cold audit data to cheaper storage | 30–50% DB storage savings after year 1 |
| Caching Price Matrix | Compute + DB | Avoid recalculating multi-currency tiers | Predictable latency; lower DB hits |

StormCom Actions:
- Introduce `ProductSummary` + aggregated metrics to reduce frequent joins.
- Implement standardized exponential backoff for webhooks (persist retry schedule).
- Add daily archival job moving old `AuditLog` rows to cheaper storage / partition.
- Evaluate image CDN optimization & auto-format conversion.

## 5. Advanced Marketing Automation Patterns

Patterns & Required Data:
| Pattern | Description | Required Models/Fields | New Model Additions |
|---------|-------------|------------------------|---------------------|
| Lifecycle Funnel (Acquire → Activate → Retain → Expand → Reactivate) | Track customer stage transitions | `Customer.lastOrderAt`, `Customer.totalOrders`, `EmailEvent.engagement` | `CustomerLifecycleMetrics` (stage, enteredAt) |
| RFM Scoring | Score customers by Recency, Frequency, Monetary | `Customer.lastOrderAt`, `Customer.totalOrders`, `Customer.totalSpent` | `CustomerRFMSnapshot` (recencyScore, frequencyScore, monetaryScore) |
| Churn Prediction | Flag at-risk customers (no order in X days) | `Customer.lastOrderAt`, email engagement | Extend `CustomerLifecycleMetrics` with `riskScore` |
| Abandoned Cart Recovery | Trigger email after inactivity window | `Cart` (items, updatedAt), `Customer.email`, `EmailEvent` | `Cart`, `CartItem`, `CartRecoveryAttempt` |
| Upsell / Cross-sell | Suggest higher-margin or complementary products | `OrderItem`, `Product.costPrice`, `Product.attributes` | `RecommendationEvent` (context, suggestedIds) |
| Win-back Campaigns | Reactivate dormant customers | Lifecycle risk stage + RFM segments | Use `EmailCampaignSegment` join |
| Segmented Promotions | Target high-frequency buyers with loyalty perks | RFM segmentation + segment membership | `CustomerSegment`, `CustomerSegmentMember` |

Automation Engine Requirements:
- Event triggers: order created, cart updated inactivity > threshold, segment score updated.
- Idempotency keys per automation execution to avoid duplicate sends.
- Rate limiting per customer per campaign (e.g., max 1 abandoned cart email / 24h).
- Templates stored with variable substitution (product names, discount codes).

UI Integration Points:
- Product detail: display dynamic upsell (query `RecommendationEvent` cached segment).
- Cart page: indicate potential discount threshold (“Spend $X more for free shipping”).
- Dashboard: segment performance widget (RFM distribution, churn risk counts).

StormCom Gaps & Actions:
- Add `Cart`, `CartItem`, segmentation tables, RFM snapshot job.
- Implement automation scheduler (cron + queue) with idempotent rule execution.
- Add `EmailEvent` logging (sent, opened, clicked) for engagement metrics.

## 6. Role & Permission Granularity

Recommended Permission Taxonomy (Fine-Grained Scopes):
```
product.read, product.write, product.publish
inventory.read, inventory.adjust
order.read, order.write, order.fulfill, order.refund
customer.read, customer.write, customer.segment.manage
promo.manage, discount.create, discount.apply
webhook.manage, integration.manage
analytics.view, analytics.export
settings.manage, billing.manage
admin.superuser
```

Grouping Strategies:
- Core Operations: product.read, order.fulfill, inventory.adjust
- Merchandising: product.write, product.publish, promo.manage
- Marketing: customer.segment.manage, discount.create
- Finance: order.refund, billing.manage, analytics.export
- Technical / Integrations: webhook.manage, integration.manage
- Superuser: admin.superuser (+ all others) — use sparingly.

Model Extensions:
- `Permission` (id, code, description)
- `RolePermission` (roleId, permissionId)
- `ApiToken` (scopes: string[]; expiration; lastUsedAt)
- `UserOverridePermission` for exceptional case (optional; minimize usage).

Enforcement Pattern:
- Server action wrapper validates session → aggregates effective permissions (Role + overrides + token scopes) → caches in request context.
- Deny-by-default: endpoints enumerate required scopes.

StormCom Actions:
- Introduce permission tables & migration; refactor role checks in services to permission checks.
- Add audit logging specifically for permission grants/revocations.

## 7. Data Retention & Compliance Policies

Principles:
- PII Minimization: Store only necessary fields (avoid unnecessary phone, address duplication); support optional anonymization for historical orders (replace name/email with hash).
- Encryption: At rest rely on Postgres + optionally application-level encryption for sensitive fields (customer email, address) using libs (AES-256-GCM) with key rotation schedule (every 12 months).
- In Transit: HTTPS + HSTS + TLS 1.2+. Signed webhooks (HMAC).

Retention Guidelines:
| Data Type | Retention | Rationale | Action |
|----------|-----------|-----------|--------|
| Audit Logs | 24 months (hot 6 months, archived 18) | Compliance / forensic | Partition + archive to cold storage |
| Inventory Logs | 12–24 months | Operational reconciliation | Archive older than 12 months |
| Orders | Indefinite (legal/financial) | Tax & accounting | Pseudonymize customer on deletion request |
| Customer PII (inactive >24m) | 24 months post last order | Privacy & cost | Anonymize and detach segments |
| Email Events | 12 months | Marketing efficacy analysis | Aggregate older into summaries |
| Analytics Events | 6–12 months raw; aggregated indefinite | Cost management | Roll-up daily/weekly tables |

Right-to-Be-Forgotten Workflow:
1. Receive deletion request (verify identity).
2. Anonymize customer: replace email with irreversible hash + remove name/phone.
3. Detach from segments; mark in `CustomerLifecycleMetrics` as `erasedAt`.
4. Retain order financial records (legal) with anonymized reference.
5. Log irreversible hash & timestamp in secure table for audit (no recovery of original PII).

Backup Strategy:
- Daily full DB snapshot + hourly WAL/incremental (Postgres). Retain daily for 30d; weekly for 12w; monthly for 12m.
- Verify restore quarterly via automated DR drill (restore to staging & run integrity checks).

StormCom Actions:
- Add anonymization service & scheduled sweep for stale PII.
- Implement partition & archival pipeline for logs.
- Document RTBF runbook in compliance docs.

## 8. Observability & SRE Baseline

Telemetry Pillars:
- Metrics: Order throughput, payment failure rate, inventory adjust latency p95, product page TTFB, cache hit ratio, webhook success/failure counts.
- Traces: Order creation path (API → payment attempt → inventory decrement → fulfillment scheduling). Include span attributes: `storeId`, `organizationId`, `orderId`.
- Logs: Structured JSON (level, timestamp, correlationId, tenant identifiers, action, durationMs). Distinguish business vs technical events.
- Synthetic Tests: Scheduled flows (search → add to cart → checkout simulation; refund simulation) measuring pass/fail + latency.

Suggested Stack (Open Source Alignment):
| Layer | Tool | Usage |
|-------|------|-------|
| Instrumentation | OpenTelemetry (Node SDK + Prisma instrumentation) | Emit spans + metrics |
| Metrics Storage | Prometheus (remote-write or managed) | Scrape exported OTLP metrics |
| Dashboards | Grafana | Visualize SLA/SLO dashboards |
| Logs | Loki | Centralize structured application logs |
| Error Monitoring | Sentry | Track exceptions + release health |
| Profiling (optional) | Parca / Continuous Profiling | CPU/memory profile under load |

SLO Examples:
- Checkout API: p95 latency < 350ms; availability ≥ 99.9% monthly.
- Inventory adjustment: p95 latency < 50ms; error rate < 0.2%.
- Webhook delivery success ≥ 98% (after retries).

Alerting Rules (Initial):
- Payment failure rate > 5% over 5min.
- Cache hit ratio < 60% sustained 10min.
- DB connection utilization > 80% for 5min.
- Webhook retry backlog > N (config) items.

StormCom Gaps & Actions:
- Inject correlation ID middleware & propagate to AuditLog.
- Add OpenTelemetry instrumentation for DB queries & server actions.
- Create synthetic test scripts (cron triggered) for core flows.
- Implement metrics aggregation job writing to `DailyStoreMetrics` table.

## 9. Proposed New / Extended Models Summary

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| ProductSummary | Denormalized product read model | productId, storeId, price, inventoryStatus, featured, cachedAt |
| InventoryReservation | Reserve stock pre-payment | productId/variantId, qty, expiresAt, orderId? |
| DiscountCode (extended) | Track redemptions & rules | code, type, value, usageLimit, usedCount, conditions JSON |
| CustomerSegment | Dynamic segmentation | name, criteria JSON, isActive |
| CustomerSegmentMember | Membership mapping | segmentId, customerId, enteredAt |
| CustomerLifecycleMetrics | Track lifecycle & churn risk | customerId, stage, riskScore, lastEvaluatedAt |
| CustomerRFMSnapshot | RFM scoring snapshots | customerId, recencyScore, frequencyScore, monetaryScore, capturedAt |
| Cart / CartItem | Abandoned cart & checkout | customerId, status, items JSON (or CartItem relation), lastActivityAt |
| EmailEvent | Marketing engagement logging | customerId, campaignId, type (SENT/OPEN/CLICK), occurredAt |
| WebhookSubscription | Extensibility endpoint | storeId, targetUrl, eventTypes[], secret, isActive |
| WebhookDelivery | Delivery attempt tracking | subscriptionId, status, attemptCount, lastAttemptAt, signature |
| DomainEvent | Immutable business events | eventType, entityType, entityId, payload JSON, correlationId, occurredAt |
| Permission | Fine-grained auth | code, description |
| RolePermission | Role to permission mapping | roleId, permissionId |
| ApiToken | Scoped integration access | tokenHash, scopes[], lastUsedAt, expiresAt |
| RecommendationEvent | Generated recs | contextType, entityId, suggestions JSON, generatedAt |
| DailyStoreMetrics | Aggregated metrics | storeId, date, ordersCount, GMV, avgOrderValue, paymentFailureRate |

## 10. Implementation Roadmap (Derived from Addendum)

Phase A (Security & Performance): Reservation system, permission tables, cache tags + read model, telemetry instrumentation.
Phase B (Commerce Depth): DiscountCode extension, CustomerSegment, Cart + recovery, WebhookSubscription & Delivery.
Phase C (Marketing & Analytics): RFM snapshots, lifecycle metrics, EmailEvent + automation engine, RecommendationEvent.
Phase D (Observability & Compliance): Archival/partition pipelines, anonymization service, synthetic tests, DailyStoreMetrics.
Phase E (Internationalization & Expansion): Multi-currency price matrix, translation tables, advanced channel features toggle.

Each phase deliverable should include: migration scripts, service layer methods (idempotent), audit logging coverage, performance regression benchmarks, and update of documentation & runbooks.

---

## Summary Alignment to Existing StormCom Gaps
This addendum operationalizes earlier gaps with concrete models, performance targets, and security controls. Focus is on:
1. Securing multi-tenant boundaries (permission granularity, strict scoping, immutable logs).
2. Scaling read performance (cache tags, denormalized summaries, partitioning).
3. Enabling growth features (segmentation, automation, abandoned cart, recommendations).
4. Ensuring sustainability (cost levers, data retention, observability).

The outlined roadmap provides a pragmatic, staged approach ensuring merchant value increments while protecting system integrity and minimizing refactor risk.

---
## 2025-11-24 Cross-Reference & Operational Alignment Addendum
This section cross-maps business logic maturity with funnel acceleration goals and MACH architecture guidance.

### A. Funnel Impact Mapping
| Domain Enhancement | Funnel Stage | Outcome Metric |
|--------------------|-------------|---------------|
| Collections & Bundles | Consideration / Conversion | AOV uplift, product discovery CTR |
| Promotion Engine | Conversion | Promotion adoption %, discount ROI |
| Segmentation + RFM | Loyalty | Repeat purchase rate, churn reduction |
| Abandoned Cart Workflow | Conversion | Recovery % |
| Recommendations | Consideration | Suggested product CTR |
| Analytics Events & Attribution | Measurement | Cohort retention, channel ROI |

### B. MACH Principles Intersection
| Domain Layer | Current Strength | Gap | Action |
|--------------|------------------|-----|-------|
| Microservices (logical) | Service abstraction planned | Limited boundary checks | Formal service interface & domain events |
| API-first | REST endpoints emerging | Missing public spec & version root | Publish `/api/v1` OpenAPI + changelog |
| Cloud-native | Stateless Next.js functions | Missing adaptive scaling metrics | Emit cost + latency metrics (DailyStoreMetrics) |
| Headless | App Router + potential GraphQL | No storefront schema | Implement minimal product/collection GraphQL queries |

### C. Cost-Efficient Evolution Guardrails
| Pattern | Avoid Premature | Use Instead |
|--------|-----------------|------------|
| Per-tenant DB | Added complexity | Row-level multi-tenancy w/ partition triggers |
| Full microservices | Operational overhead | Modular service layer + events |
| Dedicated search cluster | Cost & ops | pg_trgm + partial indexes initially |
| Complex ML recommendations | Engineering lift | Rule-based + embeddings stored in Postgres |

### D. Implementation Risk Updates
| Risk | Newly Surfaced Impact | Mitigation |
|------|----------------------|-----------|
| Dual-write pricing mismatch | Incorrect totals → merchant trust loss | Nightly reconciliation + alert threshold |
| Segment criteria explosion | Performance degradation | Segment creation quotas + indexed criteria fields |
| Promotion stacking abuse | Margin erosion | Deterministic evaluation ordering + `isStackable` checks |

### E. Success Metrics Extension
| Metric | Target |
|--------|-------|
| Collections contribution to GMV | >15% within 60d of launch |
| Segmented order share | >25% of orders using segment/tier pricing |
| Abandoned cart recovery rate | >12% |
| Recommendation CTR | >8% |

### F. Immediate Actions Checklist
1. Migrate DiscountCode & PromotionRule tables.
2. Build ProductSummary denormalization job.
3. Implement StockReservation & reconciliation script.
4. Add Permission + RolePermission models; refactor service auth checks.
5. Introduce AnalyticsEvent ingestion for order/product lifecycle.

### G. Alignment Statement
Business logic evolution directly increases funnel efficiency while staying within a lean MACH-aligned architecture. Each enhancement is tied to measureable KPIs to validate ROI and prevent scope drift.

*Addendum authored 2025-11-24; append future deltas below.*

