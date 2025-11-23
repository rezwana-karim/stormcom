# StormCom Performance & Scaling Strategy

## 1. Goals & Guardrails
| Objective | Target | Rationale |
|-----------|--------|-----------|
| Product Detail p95 TTFB (cached) | < 200ms | Fast browse experience boosts conversion |
| Category/List p95 TTFB (cached) | < 250ms | Reduce bounce on discovery pages |
| Checkout API p95 | < 350ms | Maintain low friction for purchase |
| Order Creation Throughput Burst | 300 orders/min | Flash sale resilience |
| Cache Hit Ratio (product/category) | > 65% | Minimize origin compute cost |
| Pricing Resolve p95 | < 120ms | Complex tier & segment evaluation |
| Inventory Adjust p95 | < 50ms | Smooth operational workflow |

## 2. Key Levers & Techniques
| Lever | Description | Expected Impact |
|-------|-------------|-----------------|
| Edge Cache Tags | Cache SSR / RSC fragments with targeted invalidation | 60–80% TTFB reduction on repeat views |
| RSC Streaming & Suspense | Stream server component sections progressively | 20–40% time-to-first-byte improvement |
| Denormalized Read Models | `ProductSummary` eliminates multi-join queries | 2–4× faster product list queries |
| DataLoader / Batching | Collapse duplicate resolver calls | Lower DB round trips / improved p95 |
| Partitioning (Logs) | Reduce index size for hot queries | Consistent index seek latency |
| Connection Pooling / Proxy | Stabilize serverless concurrency to DB | Avoid connection exhaustion & timeouts |
| Async Job Offload | Move heavy work (webhook delivery, embeddings) out of request path | Lower tail latency |
| Image Optimization (AVIF/WebP) | Smaller payloads; faster LCP | 30–60% bandwidth saving |
| Partial Indexes | Narrow indexes (e.g., active promotions) | Reduced write & scan overhead |

## 3. Caching Architecture
```
Request → Cache Layer (Edge / RSC) → Miss? → Origin (Next.js) → DB (Prisma)
                           ↑                 ↓
                      Tag Invalidations  Denormalized Sources
```
Tag Scheme:
- product:{id}
- category:{id}
- collection:{id}
- price:{productId}
- promotion:list
- segment:{segmentId}

Invalidation Triggers:
| Trigger | Tags |
|---------|------|
| Product Update | product:{id}, category:{categoryId}, collection:{collectionId} |
| Price Change | price:{productId} |
| Promotion Rule Change | promotion:list |
| Segment Recompute | segment:{segmentId} |

## 4. Database Optimization
### Index Strategy Examples
```sql
-- ProductSummary hot path
CREATE INDEX product_summary_store_featured_idx ON ProductSummary (storeId, featured);
CREATE INDEX product_summary_store_status_idx ON ProductSummary (storeId, inventoryStatus);

-- Promotion active filtering
CREATE INDEX promotion_active_idx ON PromotionRule (storeId) WHERE isActive = true;
```

### Partitioning Thresholds
| Table | Partition Key | Trigger |
|-------|---------------|---------|
| AuditLog | month(createdAt) | > 5M rows total |
| InventoryAdjustment | month(createdAt) | > 10M rows |
| AnalyticsEvent | day(createdAt) | > 100M rows |

## 5. Monitoring & Metrics
| Metric | Collection Method | Alert Threshold |
|--------|-------------------|----------------|
| p95 Latency per Endpoint | OpenTelemetry spans | > defined SLO for 3 intervals |
| Cache Hit Ratio | Aggregated response header | < 60% for 10m |
| DB Connection Utilization | Proxy metrics (PgBouncer/Data Proxy) | > 80% persistent |
| Queue Depth (Webhook) | Job queue metrics | > backlog threshold |
| Partition Growth | Nightly partition scan | Unpartitioned table past threshold |

## 6. Synthetic Tests
Scripts executed on schedule:
- Product browse (random product IDs) measuring TTFB & FCP simulation.
- Checkout flow simulation (create order with reservation logic) measuring latency & success.
- Promotion evaluation scenario (complex rule set) measuring evaluation time.

## 7. Performance Budget Table
| Component | Budget |
|-----------|-------|
| Product Card SSR compute | < 40ms |
| Promotion Evaluation | < 120ms |
| Inventory Adjustment | < 50ms |
| Webhook Dispatch Overhead | < 30ms per event |
| GraphQL Resolver (simple) | < 15ms |
| GraphQL Resolver (complex) | < 60ms |

## 8. Capacity Planning Inputs
| Dimension | Driver | Scaling Strategy |
|----------|--------|------------------|
| Orders/min | Merchant campaigns | Queue + horizontal autoscale |
| Product count | Catalog growth | Read model build parallelization |
| Promotions active | Seasonal spikes | Promotion rule index caching |
| Segments | Personalization breadth | Precompute segment membership diff |

## 9. Load Test Scenarios (Future)
1. Flash Sale: 300 orders/min with concurrent product page views.
2. Promotion Explosion: 500 complex promotion evaluations/min.
3. Abandoned Cart Recovery Batch: 50k cart emails queued.
4. Webhook Storm: 10k deliveries/min with backoff engaged.

## 10. Continuous Improvement Loop
1. Collect telemetry → 2. Compare against budgets → 3. Identify hotspots → 4. Optimize (schema/index/cache) → 5. Re-measure & update budgets.

---
*Performance strategy focuses on early low-effort wins (cache tags, denormalized reads) before heavier structural changes (partitioning, microservices).*