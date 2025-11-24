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

---

## Extended Addendum: Phase Alignment, Instrumentation, Partitioning & Compliance

### A. Phase Alignment with Addendum Roadmap
| Phase | Original Focus | Added Enhancements |
|-------|----------------|--------------------|
| 1 | Repos + Order Service | Correlation IDs, hash-chained audit, ProductSummary backfill |
| 2 | Schema Batch 1 | Permission tables + enforcement layer |
| 3 | Order Lifecycle | DomainEvent emission + webhook subscription scaffold |
| 4 | Pricing & Promotion | Promotion evaluator performance instrumentation |
| 5 | Inventory Event Model | Reservation reconciliation nightly job |
| 6 | Extensibility & Observability | Partition threshold monitoring, OpenTelemetry spans |
| 7 | RBAC Granularity | Permission matrix UI + audit of grants |
| 8 | Webhook Worker & Rate Limiting | Backoff policies + delivery latency SLO |
| 9 | GraphQL Gateway | Persisted queries + complexity limiter |
| 10 | Internationalization | CurrencyRate refresh & translation fallback |
| 11 | Recommendation & Search | Embedding generation queue + latency metrics |
| 12 | Inventory Event Sourcing | Projection verification script + drift alert |
| 13 | Hardening & Performance | Cache hit ratio monitoring; index bloat audit |
| 14 | Documentation & DX | Deprecation manifest + usage reports |

### B. Instrumentation Checklist
| Component | Span Name | Attributes |
|-----------|-----------|------------|
| Order Creation | service.order.create | storeId, orderId, paymentAttemptId |
| Inventory Adjust | service.inventory.adjust | productId, variantId, delta |
| Promotion Evaluate | service.promotion.evaluate | ruleCount, appliedCount, durationMs |
| Webhook Dispatch | webhook.delivery.attempt | subscriptionId, eventType, attempt, status |
| Pricing Resolve | service.pricing.resolve | productId, segmentId, tierCount |
| GraphQL Resolver | graphql.resolver | fieldName, typename, durationMs |

### C. Partition Threshold Policy
| Table | Monitor Metric | Threshold | Action |
|-------|----------------|----------|--------|
| AuditLog | Row count/month | > 5M | Create monthly partition |
| InventoryAdjustment | Row count | > 10M | Partition + archive >12m |
| WebhookDelivery | Failed retries | > 10% last 1h | Investigate endpoints |
| DomainEvent | Daily volume | Growth > 30% week-over-week | Capacity planning |

Automated partition script runs nightly, logs summary metrics & raises alert if action pending > 48h.

### D. Compliance & Retention Workflow Hooks
1. RTBF request triggers anonymization service (`customerAnonymizer.run(customerId)`).
2. Post-anonymization event emitted (`customer.anonymized`) updating segments & metrics.
3. Archive job moves old partitions to cold storage bucket (object store) while preserving minimal metadata (counts, hash). 

### E. Dual-Write Verification Pattern
For pricing and inventory transitions:
```ts
async function verifyDualWrite() {
  const mismatches = await prisma.$queryRaw`SELECT p.id FROM Product p LEFT JOIN ProductPrice pr ON pr.productId = p.id WHERE p.storeId = ${storeId} AND pr.isPrimary = true AND p.price != pr.amount`;
  if (mismatches.length > 0) alert("PRICE_DUAL_WRITE_MISMATCH", mismatches.length);
}
```
Scheduled to run nightly until legacy column removal sign-off.

### F. ADR Template (Concise)
```
Title: Introduce InventoryReservation Table
Date: 2025-11-24
Context: Oversell risk under concurrent order creation.
Decision: Add reservation table with expiresAt and reconciliation job.
Alternatives: MVCC locking only (higher contention), external queue.
Consequences: Slight storage overhead; clear invariant formula for stock.
Rollback: Drop table and revert service logic; maintain adjustments only.
```

### G. Success Metric Expansion
| Metric | Phase Introduced | Target |
|--------|------------------|--------|
| Cache Hit Ratio (Product) | 1 | >65% |
| Order Create p95 | 3 | <400ms |
| Webhook Success Rate | 6 | >98% after retry |
| Promotion Eval p95 | 4 | <120ms |
| Inventory Drift Incident Count | 5 | 0 per month |
| Partition Action SLA | 6 | <48h from threshold |

### H. Risk Reassessment Additions
| Risk | Updated Mitigation |
|------|--------------------|
| Hash Chain Break | Immediate integrity alert + isolate affected partition |
| Promotion Rule Explosion | Pre-compilation & caching + complexity guard |
| Embedding Generation Backlog | Queue depth metric + auto-scaling worker count |

---
*Extended addendum integrates phase alignment, instrumentation, partition policy, compliance hooks, and enhanced success metrics.*

---
## 2025-11-24 Cross-Reference & Execution Guardrail Addendum
This addendum reconciles the implementation plan with funnel priorities, MACH aims, and cost governance while introducing operational guardrails.

### A. Funnel & Phase Correlation
| Implementation Step | Funnel Impact | Measurement |
|---------------------|---------------|------------|
| Order lifecycle tables | Conversion trust | Fulfillment latency, refund turnaround |
| Promotions & pricing foundation | Conversion uplift | Promotion adoption %, AOV |
| Segmentation & analytics events | Loyalty / Measurement | Repeat purchase rate, churn metrics |
| Cache tags + ProductSummary | Consideration / Conversion | Product list p95 latency |

### B. MACH Reinforcement Matrix
| Step | MACH Principle Boost | Note |
|------|----------------------|------|
| Service layer foundation | Microservices-ready | Clear domain boundaries |
| REST + GraphQL expansion | API-first / Headless | Composable storefront support |
| Cache tagging & read models | Cloud-native | Efficient resource usage |
| DomainEvent emission | Microservices-ready / API-first | Future external consumers |

### C. Operational Guardrails
| Guardrail | Description | Enforced By |
|----------|-------------|-------------|
| Tenant predicate lint | Detect missing `storeId` filters | Static analysis script |
| Migration ADR requirement | Document each schema change | CI check for ADR presence |
| Dual-write verification | Nightly mismatch alert | Cron job + metrics |
| Promotion rule complexity limit | Cap evaluation overhead | Validation logic |
| Segment creation quota | Prevent combinatorial explosion | Admin UI & server check |

### D. Additional Success Metrics
| Metric | Target |
|--------|-------|
| Order creation p95 | < 400ms |
| Product list p95 (cached) | < 250ms |
| Promotion evaluation p95 | < 120ms |
| Inventory reconciliation incidents | 0 |
| Webhook delivery success | > 98% |

### E. Updated Immediate Action Stack (Sprint 0)
1. Repository + tenant lint rule.
2. Cache tags + ProductSummary migration.
3. CorrelationId middleware + structured logger.
4. PaymentAttempt & Refund tables + service wiring.
5. Basic DiscountCode validation endpoint.

### F. Cost Governance Hooks
| Hook | Purpose |
|------|--------|
| Tag invalidation counter | Detect thrash potential |
| Promotion rule eval histogram | Capacity planning |
| Segment population change metric | Guard against runaway growth |
| Read model refresh duration | Optimize backfill & incremental update |

### G. Alignment Statement
These guardrails ensure iterative delivery remains secure, observable, and cost-aware while directly supporting funnel acceleration (conversion & retention). The addendum intentionally shifts performance & observability earlier in execution to de-risk subsequent complexity layers.

*Addendum authored 2025-11-24; future revisions appended below.*
