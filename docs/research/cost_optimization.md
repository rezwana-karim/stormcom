# StormCom Cost Optimization Strategy

## 1. Cost Drivers
| Driver | Components | Notes |
|--------|------------|-------|
| Compute (Serverless/Edge) | SSR renders, API endpoints, webhook workers | High variance with catalog mutation frequency |
| Database (Postgres) | Storage, IO, connection concurrency | Growth in append-only logs & events |
| CDN Bandwidth | Product images, large JS bundles | Bandwidth scales with traffic; optimization crucial |
| Third-Party Services | Email (Resend), Payment gateways | Volume-based pricing & per-transaction fees |
| Storage (Object / DB) | Images, archived partitions | Long-term retention influences storage tiering |

## 2. High-Impact Levers
| Lever | Cost Area | Mechanism | Expected Reduction |
|-------|-----------|-----------|--------------------|
| Edge Cache + Tag Invalidation | Compute + DB | Avoid repeat dynamic execution | 50–80% SSR cost drop |
| Denormalized Product Read Table | DB CPU | Reduce multi-join overhead | 30–60% query CPU reduction |
| Image Optimization (AVIF/WebP) | CDN Bandwidth | Smaller transfer sizes | 30–60% bandwidth saving |
| Partition & Archive Logs | DB Storage | Move cold data off primary | 30–50% storage reclaimed |
| Webhook Backoff Strategy | Compute | Avoid hot-loop retries | Lower wasted invocations |
| Async Batch Jobs | Compute | Shorter request duration | Lower per-request cost & tail latency |
| Connection Pooling/Data Proxy | DB | Reduce idle connection overhead | Avoid forced plan upgrade |
| Price Matrix Caching | CPU | Skip recalculation | Stable CPU usage under load |

## 3. Prioritized Actions (Next 8 Weeks)
| Priority | Action | Owner | Success Metric |
|----------|--------|-------|---------------|
| P0 | Implement cache tags & measure hit ratio | Platform | >65% hit ratio |
| P0 | Add ProductSummary table & migrate listing endpoints | Backend | p95 list latency <250ms |
| P1 | Integrate image optimization pipeline | Frontend | Avg image size ↓ 40% |
| P1 | Introduce webhook backoff & retry limit | Platform | Failed deliveries <2% |
| P2 | Partition AuditLog & InventoryAdjustment when threshold reached | DBA | Partition creation SLA <48h |
| P2 | Add Price matrix caching layer | Backend | Recompute count ↓ 70% |

## 4. Measurement & Feedback Loop
1. Collect baseline metrics (cost dashboard from provider + internal counters).
2. Deploy optimization.
3. Measure delta after 1 week (statistical smoothing). 
4. Record result in `COST_OPTIMIZATION.md` changelog.

## 5. Metrics Instrumentation
| Metric | Source | Collection Cadence |
|--------|--------|--------------------|
| SSR Render Count | Edge function logs | Daily |
| Cache Hit Ratio | Response header aggregation | Real-time / 5m roll-up |
| Image Avg Payload | CDN logs → batch job | Daily |
| DB CPU Time | Cloud provider metrics | Hourly |
| Promotion Eval Count | Service spans | Daily |
| Price Recompute Count | Pricing cache stats | Daily |
| Webhook Retry Attempts | Delivery table | Daily |

## 6. Data Lifecycle & Storage Tiering
| Data | Hot Duration | Archive Format | Removal Policy |
|------|-------------|---------------|----------------|
| AuditLog | 6 months | Compressed JSON lines (object store) | Keep 24m then purge |
| InventoryAdjustment | 6 months | Compressed Parquet | Keep 12–24m then purge |
| AnalyticsEvent | 1 month | Aggregated daily metrics | Raw purged after roll-up |
| DomainEvent | 3 months | Parquet partitioned by month | Purge after 18m unless required by compliance |

## 7. Tooling & Automation
- Scheduled cron (Vercel / external) triggers archival script.
- Archival script: SELECT eligible rows → export → verify hash → delete from primary.
- Integrity check ensures counts & hash tallies match before deletion commit.

## 8. Guardrail Policies
| Policy | Description |
|--------|-------------|
| No Unbounded Growth | Any append-only table must declare partition threshold & archival plan |
| Index Hygiene | Quarterly review removing unused indexes (>30% unused threshold) |
| Query Cost Budget | Queries >100ms p95 flagged for optimization review |
| Feature Cost Review | New feature must include cost impact section & estimated incremental load |

## 9. Reporting & Transparency
Monthly cost optimization report sections:
- Metric Trends (hit ratio, DB CPU, bandwidth)
- Implemented Actions & Outcomes
- Upcoming Opportunities & ROI Estimates
- Regressions & Remediation Plan

## 10. Future Opportunities
| Idea | Description | Potential Benefit |
|------|------------|------------------|
| Intelligent Cache TTLs | Adaptive TTL based on mutation frequency | Higher hit ratio without stale risk |
| Predictive Autoscaling | Scale workers based on promotion schedule | Avoid latency spikes & overprovision |
| Tiered Storage per Tenant | High-value tenants remain longer in hot storage | SLA differentiation |
| Price Evaluation WASM Sandbox | Faster rule computation via precompiled WASM | Lower CPU per evaluation |

---
*Cost optimization remains iterative; early structural wins reduce baseline spend before advanced dynamic strategies.*

---
## 2025-11-24 Cross-Reference & Deployment Economy Addendum
This addendum aligns cost levers with funnel acceleration and MACH guidance while adding concrete instrumentation & guardrail recommendations.

### A. Funnel-Centric Cost Impact
| Enhancement | Cost Consideration | Net Effect |
|-------------|--------------------|-----------|
| Collections & Promotions | More dynamic invalidations | Use tag invalidation (cheap) vs full recompute |
| Segmentation/RFM | Batch compute overhead | Nightly scheduled job with incremental diffing |
| Abandoned Cart Emails | Increased external email cost | Rate limit + suppression logic based on predicted value |
| Recommendations | CPU for similarity calc | Cache embedding vectors; recompute off-peak |

### B. MACH Principle Cost Lens
| Pillar | Cost Strategy |
|--------|--------------|
| Microservices | Delay physical decomposition until organic latency or team scaling requires it |
| API-first | Generate OpenAPI schema automatically to prevent manual doc maintenance cost |
| Cloud-native | Autoscale serverless; track warm vs cold invocation ratio |
| Headless | GraphQL persisted queries to lower over-fetch and response size |

### C. Expanded Instrumentation Targets
| Metric | Purpose | Collection Method |
|--------|---------|------------------|
| Promotion invalidation count | Measure cache churn | Tag invalidation logger |
| RFM snapshot duration | Optimize batch performance | Job span metrics |
| Abandoned cart send suppression rate | Prevent spam cost | Campaign execution report |
| Embedding generation CPU time | Plan scaling | Worker span aggregation |

### D. Guardrail Enhancements
| Guardrail | Description |
|----------|-------------|
| Promotion Rule Complexity Limit | Cap JSON condition depth/size to avoid evaluation blowouts |
| Segment Count Quota | Prevent exponential segment proliferation |
| Email Daily Cap per Customer | Avoid negative brand impact & cost waste |
| Dynamic Feature Cost Checklist | New feature PR must include estimated compute/storage delta |

### E. Cost Failure Scenarios & Mitigations
| Scenario | Symptom | Mitigation |
|----------|---------|-----------|
| Cache Thrash | Hit ratio drops <50% | Investigate invalidation patterns; introduce debounce on rapid updates |
| Promotion Rule Storm | Spikes in evaluation latency | Precompile & shard evaluation by predicate type |
| Email Spend Surge | Sudden high volume sends | Adaptive throttling + prioritization (recover high-value carts first) |
| DB Storage Balloon | Audit/analytics raw tables > thresholds | Trigger archival early; compress & move to cold storage |

### F. Deployment Optimization Checklist
1. Implement tag invalidation metrics.
2. Add job duration histograms (RFM, archival, promotions precompute).
3. Configure adaptive email throttle (priority queue).
4. Introduce segment creation quota & admin override flow.
5. Automate monthly cost report generation from metrics snapshot.

### G. Success Metrics Extension
| Metric | Target |
|--------|-------|
| Promotion evaluation average CPU ms | < 30ms per request |
| Embedding generation cost per 1K products | < $X placeholder (monitor) |
| Email send suppression (low-value) | > 20% of potential raw volume |
| Cache thrash incidents per month | 0 |

*Addendum authored 2025-11-24; integrate metrics into cost dashboard roadmap.*