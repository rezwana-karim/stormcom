# StormCom Threat Model (Multi-Tenant SaaS Commerce)

## 1. Scope & Assets
| Asset | Description | Sensitivity |
|-------|------------|-------------|
| Tenant Catalog Data | Products, variants, pricing, promotions | High (competitive) |
| Order & Payment Data | Order totals, payment status, refunds | High (financial) |
| Customer PII | Emails, addresses (future) | High (privacy) |
| Inventory Balances | Quantities, reservations | Medium (operational) |
| Discount Codes & Promotions | Value rules & usage limits | Medium-High |
| Credentials & Sessions | JWT/NextAuth session tokens | High (account takeover) |
| Webhook Endpoints & Secrets | Third-party integration URLs & HMAC secrets | High |
| Audit & Domain Events | Immutable operational trail | High (forensic) |
| API Tokens | Scoped external access | High |

## 2. STRIDE Analysis Summary
| STRIDE Category | Threat Example | Impact | Likely Vector | Mitigations |
|-----------------|---------------|--------|--------------|-------------|
| Spoofing | Forged storeId/org claims | Cross-tenant data leak | Tampered request body | Server-side enforced tenant scoping; session claim validation; (future) RLS |
| Tampering | Promotion usage count race | Revenue loss | Concurrent redemptions | Row-level locking, atomic increments, idempotent evaluator |
| Repudiation | Deleted audit log entry | Forensic gap | Direct delete/alter | Append-only + hash chain + restricted write surface |
| Information Disclosure | Exposed PII via debug log | Privacy breach | Over-logging sensitive fields | Structured logging w/ redaction, field-level encryption |
| Denial of Service | Flood product create | Resource exhaustion | Bot script / abuse | Sliding window rate limiting + quota per plan |
| Elevation of Privilege | Role escalation to superuser | Full control | Insecure role assignment API | Permission tables, deny-by-default, audit grants |

## 3. Detailed Threats & Controls
### 3.1 Tenant Boundary Violations
- Risk: Attackers attempt cross-store queries by manipulating identifiers.
- Technical Controls: Repository pattern auto-injects `WHERE storeId = ?`; no direct Prisma model access in service layer.
- Future Control: PostgreSQL Row-Level Security (RLS) policies after schema stabilization.

### 3.2 Inventory Oversell Races
- Risk: Two simultaneous orders decrement stock causing negative available quantity.
- Control: Introduce `InventoryReservation` then atomic adjustment transaction verifying remaining stock; nightly reconciliation script.

### 3.3 Discount & Promotion Abuse
- Risk: Rapid multi-use exploiting race conditions before `usageLimit` updates.
- Control: SELECT FOR UPDATE on DiscountCode row; idempotent application service storing applied code keys.
- Monitoring: Redemption velocity anomaly alert (e.g. > X / minute threshold).

### 3.4 Payment Replay Attacks
- Risk: Replayed gateway callback or refund webhook triggers duplicate financial operation.
- Control: `processed_webhook_events` ledger storing event ID + HMAC signature check + timestamp freshness (<5m).

### 3.5 Webhook SSRF / Malicious Targets
- Risk: Merchant registers internal IP (e.g., 169.254.*, 10.*, localhost) to pivot SSRF.
- Control: Host/IP validation & deny RFC1918 ranges; optional verification ping before activation; per-subscription rate limit.

### 3.6 Privilege Escalation via Role Misconfiguration
- Risk: Role modifications grant unintended `admin.superuser` access.
- Control: Explicit permission grants table; change audit entries; optional MFA for critical elevation requests.

### 3.7 Audit Log Tampering
- Risk: Attacker deletes or edits historical audit trails.
- Control: Immutable append-only table (no UPDATE/DELETE) + hash chain linking entries; integrity verification job.

### 3.8 Sensitive Data Exposure in Logs
- Risk: PII fields appear in structured logs or frontend error messages.
- Control: Log sanitizer middleware removes email/address; encryption applied at persistence for selected fields.

### 3.9 Excessive GraphQL Query Complexity (Future Gateway)
- Risk: Deep nested queries cause resource exhaustion.
- Control: Complexity scoring (depth * node cost) + max threshold; persisted queries for public storefront.

## 4. Security Architecture Roadmap
| Phase | Control Introduced | Outcome |
|-------|--------------------|---------|
| A | Scoped repositories, rate limiting | Baseline tenant isolation |
| B | Permissions + audit hash chain | Least privilege + tamper resistance |
| C | Inventory reservations + discount locking | Integrity of commerce operations |
| D | Webhook host validation + replay ledger | Secure integrations |
| E | GraphQL complexity limits + persisted queries | Controlled query resource usage |
| F | RLS (optional) + MFA flows | Defense-in-depth |

## 5. Metrics & Alerts
| Metric | Threshold | Action |
|--------|----------|--------|
| Failed Auth Attempts | Spike > 5x baseline | Investigate possible brute force |
| Promotion Redemption Velocity | > configured rate | Temporarily disable code + alert |
| Inventory Drift Variance | Non-zero after reconciliation | Block new fulfillments for impacted SKU until resolved |
| Webhook Failure Rate | >10% over 15m | Backoff & notify merchants |
| Permission Grant Events | Unusual high count | Manual review |

## 6. Incident Response Quick Outline
1. Detection (alert fired / anomaly panel).
2. Triage severity (data integrity vs availability vs confidentiality).
3. Containment: revoke API tokens, freeze promotions, temporarily disable writes.
4. Eradication: patch vulnerability (code/config), rotate secrets.
5. Recovery: replay domain events to rebuild state if needed; verify audit chain.
6. Postmortem: root cause analysis + action items + knowledge base update.

## 7. Open Items / Future Enhancements
- Evaluate integrating Temporal for reliable orchestration & compensation flows.
- Add optional WAF rules (rate, pattern match) on high-risk endpoints.
- Deploy secret scanning for repository & environment variables.

---
*Threat model establishes baseline for iterative security reviews; updates accompany new domain surfaces (e.g., subscriptions, marketplace features).*