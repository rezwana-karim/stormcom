# StormCom Observability Strategy (Metrics, Tracing, Logging, Synthetic)

## 1. Objectives
| Objective | Description |
|-----------|-------------|
| End-to-End Traceability | Follow request from ingress to DB & external calls |
| Actionable Metrics | SLO/SLA dashboards driving alerts & capacity planning |
| Structured Audit Correlation | Link audit/domain events with traces via correlationId |
| Low Overhead | Minimal performance penalty (<5% CPU) |

## 2. Pillars & Tooling
| Pillar | Tool | Notes |
|--------|------|------|
| Tracing | OpenTelemetry Node SDK | Auto instrumentation (HTTP, Prisma), manual spans for services |
| Metrics | OpenTelemetry → Prometheus | Export aggregated counters & histograms |
| Logs | Structured JSON → Loki | Correlation ID & context fields |
| Errors | Sentry | Captures stack, release, environment |
| Profiling (Future) | Parca / Pyroscope | Continuous CPU/memory sampling |
| Synthetic | Cron-based scripts | Checkout & refund flows validation |

## 3. Core Metrics & Definitions
| Metric | Type | Description |
|--------|------|-------------|
| http_request_duration_seconds | Histogram | Request latency by route & method |
| order_create_duration_ms | Histogram | Span timing for order creation pipeline |
| inventory_adjust_duration_ms | Histogram | Span timing for inventory adjustments |
| webhook_delivery_attempts_total | Counter | Attempt count (success/failure labels) |
| cache_hit_ratio | Gauge | Calculated from `X-Cache` header statistics |
| payment_failure_rate | Gauge | Failed attempts / total attempts (rolling) |
| promotion_evaluation_duration_ms | Histogram | Rule engine performance |
| db_query_duration_ms | Histogram | Prisma instrumentation grouped by model |
| domain_events_emitted_total | Counter | Business events throughput |

## 4. Tracing Conventions
| Span | Attributes |
|------|-----------|
| http.server.request | method, path, correlationId, storeId |
| service.order.create | storeId, orderId, itemCount, paymentAttemptId |
| service.inventory.adjust | productId, variantId, delta |
| service.promotion.evaluate | storeId, ruleCount, appliedCount |
| webhook.delivery.attempt | subscriptionId, eventType, attempt, statusCode |
| pricing.resolve | productId, segmentId, tierCount |

Naming: `service.<domain>.<action>` for domain logic; `http.*` auto; `db.*` auto by instrumentation.

## 5. Logging Schema
```json
{
  "ts":"2025-11-24T12:34:56.789Z",
  "level":"info",
  "cid":"c-12345",
  "storeId":"s-9",
  "orgId":"o-3",
  "userId":"u-7",
  "event":"order.created",
  "durationMs":212,
  "orderId":"o-555",
  "message":"Order created successfully"
}
```
- Levels: debug, info, warn, error.
- Sensitive fields redacted; email & addresses omitted or hashed.

## 6. Alerting Rules (Initial)
| Alert | Condition | Action |
|-------|----------|--------|
| High Payment Failure | payment_failure_rate > 5% for 5m | Investigate gateway/logs |
| Slow Checkout | p95 order_create_duration_ms > 500ms for 3 intervals | Profile queries, optimize indexes |
| Cache Degradation | cache_hit_ratio < 55% for 10m | Review invalidation patterns |
| Webhook Failure Spike | webhook_delivery_attempts_total{status="failed"} / total > 10% | Backoff & notify merchants |
| Inventory Adjust Latency | p95 inventory_adjust_duration_ms > 120ms | Investigate lock contention |
| Promotion Eval Latency | p95 promotion_evaluation_duration_ms > 200ms | Precompute/caching review |

## 7. Synthetic Monitoring
Scripts (cron / scheduled):
1. Checkout Simulation: create test order with mock payment, assert status transitions.
2. Refund Simulation: issue refund against test order, validate audit & domain events.
3. Webhook Delivery: ping a test subscription endpoint & check delivery latency.
4. Product Browse: fetch cached vs uncached product page; record TTFB.

Results logged to `SyntheticResult` table & metrics emitted for pass/fail.

## 8. Data Retention & Storage
| Data | Retention | Strategy |
|------|-----------|----------|
| Raw Traces | 7 days (dev), 3 days (prod) | Sampling 100% errors, 10–30% normal |
| Metrics | 15m high-res (30d), 1h roll-up (12m) | Downsample rules |
| Logs | 30d hot, archive 90d | Compress & store in object storage |
| Synthetic Results | 90d | Trend analysis for reliability |

## 9. Sampling Strategy
- Head-based initial: 20% default sample rate, always sample error spans.
- Tail-based (future): Promote outliers (high latency) for deeper analysis.

## 10. Correlation & Forensics
- Correlation ID generated per inbound request if absent; returned in `X-Correlation-Id` header.
- AuditLog rows include correlationId & requestId for forensic alignment.
- DomainEvent includes correlationId enabling multi-system chain reconstruction.

## 11. Dashboards (Suggested Panels)
| Panel | Metrics |
|-------|--------|
| Checkout Performance | order_create_duration_ms p95/p99, payment_failure_rate |
| Inventory Operations | inventory_adjust_duration_ms, drift count |
| Webhook Delivery | success vs failed attempts, average latency |
| Cache Efficiency | cache_hit_ratio over time, invalidation count |
| Promotion Engine | evaluation count, latency percentiles |
| Error Overview | Top exceptions, error rate trend |

## 12. SLO & Error Budgets
| SLO | Target | Budget (monthly) |
|-----|--------|------------------|
| Checkout Availability | 99.9% | 43m downtime |
| Webhook Delivery Success | 98% | 2% failure budget |
| Promotion Evaluation Latency p95 | <120ms | 10% of time above threshold |

## 13. Incident Workflow Integration
- Alerts → Pager → triage (severity classification).
- Pull correlated traces & logs via correlationId.
- Document root cause & remediation in ADR follow-up.

## 14. Future Enhancements
| Enhancement | Value |
|------------|-------|
| Adaptive Sampling | Capture rare anomalies without cost explosion |
| Real User Monitoring (RUM) | Client performance → correlate with conversion |
| Log Anomaly Detection (ML) | Early detection of emerging issues |
| SLO Burn Rate Alerts | Proactive exhaustion notification |

---
*Observability ensures rapid detection & diagnosis, informing scaling and optimization decisions across the commerce lifecycle.*