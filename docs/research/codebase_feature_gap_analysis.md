# StormCom Codebase Feature & Gap Analysis (Comprehensive Cross-Reference)

Date: 2025-11-24

## 1. Purpose
This document provides a consolidated analysis of the current StormCom Next.js 16 codebase, cross-referenced against: (a) internal research docs in `docs/research`, and (b) strategic patterns outlined in `Modern E-Commerce Funnelling and MACH Commerce in Multi-Tenant SaaS.md`. It enumerates what is implemented, what is partially implemented, and what is still missing to achieve a competitive multi-tenant SaaS commerce platform in 2025.

---
## 2. Executive Summary
StormCom already possesses a strong schema foundation (products, variants, categories, brands, orders, customers, reviews, inventory & audit logs, store subscription metadata). Missing or immature areas include: lifecycle completeness (refunds, returns, fulfillment splits), advanced pricing & promotions, segmentation & marketing automation, observability instrumentation, granular RBAC, extensibility (webhooks, GraphQL storefront), internationalization, multi-currency, performance read models, and cost governance automation.

Immediate value accelerators (high ROI vs effort):
1. Lifecycle fidelity (PaymentAttempt, Refund, Fulfillment, ReturnRequest)
2. Permission & token system (least privilege, secure integrations)
3. Cache Tags + ProductSummary read model (performance & cost)
4. DiscountCode + PromotionRule (conversion uplift)
5. InventoryReservation + atomic adjustment (data integrity)

---
## 3. Feature Coverage Matrix
| Category | Current Implementation | Status | Key Gaps | Priority |
|----------|-----------------------|--------|----------|---------|
| Multi-Tenancy | Organization, Membership, Store, storeId scoping | Strong | Usage metering, overage alerts | M |
| Catalog | Product, Variant, Category, Brand, Attributes, Reviews | Good | Collections, Bundles, ProductImage normalization | H |
| Pricing | price fields on Product/Variant | Basic | Tiered, segment, multi-currency via ProductPrice | H |
| Promotions | None | Missing | DiscountCode, PromotionRule, stacking rules | H |
| Inventory | Inline qty + InventoryLog | Foundational | Reservation, Adjustment events separation | H |
| Orders | Order + OrderItem | Good | PaymentAttempt, Fulfillment, ReturnRequest, Refund | H |
| Customers | Customer model (basic metrics) | Basic | Segments, RFM snapshot, lifecycle metrics | M |
| Reviews | Review + approval flag | Functional | Moderation statuses, verification expansion | L |
| Marketing Automation | Absent | Missing | Cart, CartItem, EmailCampaign, EmailEvent | M |
| Analytics | None (no events) | Missing | AnalyticsEvent, DailyStoreMetrics, CohortMetrics | M |
| RBAC | Role enum only | Limited | Permission, RolePermission, ApiToken | H |
| Extensibility | Absent | Missing | WebhookSubscription, WebhookDelivery, DomainEvent | H |
| Internationalization | Absent | Missing | Translation tables, CurrencyRate | M |
| Search & Discovery | Basic product access | Limited | ProductEmbedding, advanced search indices | M |
| Observability | AuditLog & InventoryLog only | Limited | Metrics, traces, structured logs with correlationId | H |
| Cost Optimization | Strategy doc only | Planning | Actual instrumentation, archiving jobs, ProductSummary | M |
| Fraud / Risk | None | Missing | FraudAssessment table, scoring pipeline | L |
| Recommendation | None | Missing | RecommendationEvent + embedding generation | M |
| Event Sourcing | Partial (logs) | Planning | InventoryAdjustment + DomainEvent baseline | M |

Priority Legend: H = High, M = Medium, L = Low (short-term impact vs effort).

---
## 4. Customer Funnel Support (2025 Trends)
| Funnel Stage | Current Support | Missing Enhancements | Impact if Added |
|--------------|-----------------|---------------------|-----------------|
| Awareness | Schema enables brand & product listing | SEO metadata expansion, dynamic collections, social feed integration | Increases organic discovery |
| Consideration | Variants, reviews basics | Rich media gallery, bundles, recommendation engine, personalization | Higher engagement & dwell time |
| Conversion | Order + basic checkout API | Promotions, cart recovery, fulfillment clarity, flexible payment attempts | Lower cart abandonment, higher conversion |
| Loyalty | Customer totals, acceptsMarketing | Segmentation, lifecycle automation, RFM scoring, reward campaigns | Repeat purchase uplift |
| Measurement | No analytics events | AnalyticsEvent, DailyStoreMetrics, promotion attribution | Data-driven optimization loop |

---
## 5. MACH Compliance Snapshot
| MACH Pillar | Current State | Gap | Planned Additions |
|-------------|--------------|-----|------------------|
| Microservices | Single monolith (modular services planned) | None critical early | Service layer segmentation; later optional extraction |
| API-first | REST routes emerging (products/orders) | Incomplete public surface & versioning | REST v1 spec, tRPC internal, GraphQL composition layer |
| Cloud-Native | Next.js 16 + Vercel ready (edge cached potential) | Lacking automated scaling heuristics | Tag caching, queue offload, partition strategy |
| Headless | App Router + potential GraphQL; product schema prepared | Missing storefront GraphQL gateway & CMS integration | GraphQL schema + persisted queries + domain events |

---
## 6. Gap to Model Mapping (Schema Adds)
| Gap | Proposed Tables |
|-----|-----------------|
| Promotions | DiscountCode, PromotionRule, AppliedPromotion |
| Pricing | ProductPrice, CurrencyRate |
| Fulfillment & Returns | Fulfillment, FulfillmentItem, ReturnRequest, ReturnItem, Refund, PaymentAttempt |
| Inventory Integrity | InventoryAdjustment, StockReservation |
| Segmentation | CustomerSegment, CustomerSegmentMember, CustomerRFMSnapshot, CustomerLifecycleMetrics |
| Marketing | Cart, CartItem, EmailCampaign, EmailEvent, RecommendationEvent |
| Analytics | AnalyticsEvent, DailyStoreMetrics, CohortMetrics, OrderAttribution |
| RBAC & Integrations | Permission, RolePermission, ApiToken, WebhookSubscription, WebhookDelivery, DomainEvent |
| Performance Read Models | ProductSummary |
| Search & Recommendations | ProductEmbedding |
| Internationalization | ProductTranslation, CategoryTranslation, BrandTranslation |

---
## 7. Implementation Wave Plan (Condensed)
| Wave | Focus | Success Metrics |
|------|-------|----------------|
| A | Lifecycle (payment, fulfillment, returns) + RBAC + cache tags | 0 oversell incidents; p95 order creation <400ms |
| B | Promotions + tiered/multi-currency pricing + ProductSummary | >20% orders with promotion; product list p95 <250ms |
| C | Webhooks + analytics events + domain events + segmentation base | Webhook success >98%; daily metrics available |
| D | Marketing automation (RFM, abandoned cart) + recommendations | Abandoned cart recovery >12% |
| E | Internationalization + advanced search + event sourcing pilot | Multi-locale conversion uplift >5% |

---
## 8. Coding Practice Recommendations (Cross-Cutting)
| Concern | Best Practice | Justification |
|---------|--------------|--------------|
| Tenant Isolation | Repository pattern auto-injects storeId predicates | Prevents accidental cross-tenant leakage |
| Validation | Central Zod schemas reused across REST/tRPC/GraphQL | Uniform error envelopes & type safety |
| Idempotency | Idempotency-Key header on critical financial endpoints | Safe retries & reduced duplicate processing |
| Observability | Mandatory correlationId propagation + structured logs | Faster incident forensics |
| Performance | Tag-based caching + denormalized read models | Reduced DB load & SSR cost |
| Security | Fine-grained permissions + hash-chained audit log | Least privilege & tamper resistance |
| Cost | Archival & partition thresholds baked into schema design | Controlled long-term storage & index health |
| Deployment | Single Vercel project + managed Postgres (Neon/PlanetScale) | Low ops overhead; elastic scaling |
| Extensibility | DomainEvent emission + webhook queue w/ backoff | Reliable integration surface |
| Internationalization | Locale & currency abstraction early in pricing service | Avoid retrofitting complexity |

---
## 9. Cost-Effective Deployment Strategy
| Layer | Recommendation | Cost Benefit |
|-------|---------------|-------------|
| Hosting | Vercel (Edge + Serverless Functions) | Auto scaling, reduced ops headcount |
| Database | Neon Postgres (row-level tenancy) | Serverless autoscaling, storage tiering |
| Caching | Next.js Cache Tags + CDN (Vercel) | Avoid Redis cost initially |
| Background Jobs | Vercel Cron + lightweight external queue (Upstash Redis) | Pay-as-you-go; defer full queue infra |
| Images | Vercel Image Optimization + S3/Cloudflare R2 for originals | Lower bandwidth & storage costs |
| Analytics & Logs | Managed (Sentry + Log aggregation w/ sampling) | Faster time to value, reduced maintenance |
| Search/Recs | Postgres pg_trgm + embeddings stored in DB | Avoid dedicated search cluster until scale |
| Partitioning | Add only after threshold triggers (scripted audit) | Prevent premature complexity |

---
## 10. Funnel-Centric Enhancement Mapping
| Enhancement | Funnel Stage Impact | Metric |
|------------|---------------------|--------|
| Collections/Bundles | Consideration & Conversion | AOV uplift |
| Promotions Engine | Conversion | Promotion adoption rate |
| RFM Segmentation | Loyalty | Repeat purchase rate |
| Abandoned Cart Automation | Conversion | Recovery rate |
| Recommendations (embedding) | Consideration | CTR on suggested products |
| Multi-Currency + Localization | Conversion (international) | Localized conversion uplift |
| Analytics Attribution | Measurement | Channel ROI clarity |

---
## 11. Risk Register Snapshot
| Risk | Phase | Mitigation |
|------|-------|-----------|
| Pricing Dual-Write Divergence | B | Nightly consistency job; alert threshold |
| Webhook Storm | C | Queue backoff + per-subscription rate limits |
| Promotion Rule Explosion | B | Complexity limiter + precompiled predicate cache |
| Inventory Race Conditions | A | Reservation + atomic decrement transaction |
| Tenant Data Leak | All | Repository enforced scoping + audit of missing predicates |

---
## 12. Success Metrics Rollup
| Metric | Baseline | Target |
|--------|----------|--------|
| Product List p95 | N/A (not measured) | <250ms after ProductSummary & caching |
| Order Creation p95 | Unknown | <400ms Wave A |
| Promotion Adoption | 0% | >20% Wave B |
| Webhook Delivery Success | 0% | >98% Wave C |
| Abandoned Cart Recovery | 0% | >12% Wave D |
| Localized Conversion Uplift | 0% | >5% Wave E |
| Cache Hit Ratio | 0% | >65% Wave A |

---
## 13. Dependency Graph (Condensed)
- PaymentAttempt → Refund
- Fulfillment → ReturnRequest / ReturnItem
- DiscountCode + PromotionRule → Pricing Service integration
- ProductPrice → Multi-currency + segmentation pricing
- InventoryAdjustment + StockReservation → Accurate order pipeline
- DomainEvent → Webhooks + analytics + automation triggers

---
## 14. Recommended Immediate Backlog (Actionable Sprint Items)
| Sprint Item | Type | Effort | Impact |
|-------------|------|--------|--------|
| Implement PaymentAttempt & Refund tables + service logic | Schema/Service | M | Financial integrity |
| Add Fulfillment / ReturnRequest base models | Schema | M | Lifecycle completeness |
| Introduce Permission / RolePermission / ApiToken | Security | M | Least privilege & integration readiness |
| Implement cache tags + invalidation hooks (product/category) | Performance | S | Reduced SSR latency |
| Create ProductSummary denormalized table & listing endpoint switch | Performance | M | p95 list latency improvement |
| Add DiscountCode + PromotionRule evaluation (simple conditions) | Conversion | M | Merchant revenue lever |
| Implement StockReservation + atomic inventory adjust | Integrity | M | Prevent oversell |
| CorrelationId middleware + structured logging | Observability | S | Incident traceability |

Effort legend: S = Small (<1 day), M = Medium (1–3 days), L = Large (>3 days).

---
## 15. Alignment with Modern E-Commerce Funnelling & MACH Commerce Report
The architecture plan prioritizes funnel acceleration (collections, recommendations, promotions) while preserving MACH principles: API-first expansions (REST + GraphQL), composable microservice-ready service layer, and headless storefront capabilities via GraphQL/persisted queries. Cloud-native resource efficiency is reinforced by cost optimization (Edge caching, denormalization, deferred infrastructure like search clusters). Personalization (segmentation, RFM, abandoned cart flows) directly maps to Consideration, Conversion, and Loyalty stages in the 2025 omnichannel funnel evolution.

---
## 16. Maintainability & Governance Recommendations
| Practice | Implementation |
|----------|---------------|
| ADRs per migration | Short template capturing rationale, alternatives, rollback |
| Feature flags for new domains | Gradual rollout; fallback switch |
| Nightly health jobs | Reconciliation (inventory, pricing dual-write, audit hash chain) |
| Policy of tenant scoping test | Static analysis / lint scanning for queries missing storeId filter |
| Deprecation manifest | List endpoints slated for removal + usage metrics |

---
## 17. Future Strategic Extensions (Beyond Current Roadmap)
| Extension | Rationale |
|----------|-----------|
| Temporal / Workflow Engine | Reliable long-running flows (returns, subscription renewals) |
| ML-based Fraud Scoring | Minimize chargebacks & false positives |
| Predictive CLV & Churn Models | Optimize retention and campaign ROI |
| Marketplace App Framework | Ecosystem growth, partner integrations |
| Real User Monitoring (RUM) | Frontend performance → funnel optimization |

---
## 18. Conclusion
StormCom is architecturally well-positioned for rapid capability expansion. By executing the outlined high-priority gaps with disciplined observability, cost governance, and security foundations, the platform can reach competitive parity and differentiation (automation, segmentation, transparency) within staged waves, minimizing refactor risk while compounding merchant value.

---
## 19. Changelog
- 2025-11-24: Initial comprehensive feature & gap analysis document created.
