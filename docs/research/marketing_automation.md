# StormCom Marketing Automation & Segmentation Strategy

## 1. Objectives
| Objective | Outcome |
|-----------|--------|
| Reduce Abandoned Carts | Recover revenue via targeted reminder flows |
| Increase Repeat Purchases | Personalized offers based on RFM & lifecycle stage |
| Improve Promotion ROI | Target segments most responsive to discount type |
| Build Customer Intelligence | Data foundation for predictive CLV & churn risk |
| Enable Merchants Self-Serve | UI to configure campaigns & review performance |

## 2. Core Models & Data Flows
| Model | Purpose |
|-------|--------|
| Cart / CartItem | Track in-progress purchase intent |
| CustomerRFMSnapshot | Periodic scoring snapshot (Recency, Frequency, Monetary) |
| CustomerSegment | Persistent segment definition (criteria JSON) |
| CustomerSegmentMember | Mapping of customers to segments |
| CustomerLifecycleMetrics | Stage tracking & churn risk score |
| EmailCampaign | Campaign metadata & targeting configuration |
| EmailEvent | Engagement logging (SENT, OPEN, CLICK, BOUNCE) |
| RecommendationEvent | Generated upsell/cross-sell suggestions |
| AppliedPromotion | Reflects promotions used; feed ROI analysis |

## 3. RFM Scoring
- Recency: Days since last completed order.
- Frequency: Orders in last N days (e.g., 180).
- Monetary: Total spend in rolling window.
- Score bucket mapping (1–5) per dimension; composite = weighted sum (e.g., 4R + 3F + 3M).
- Snapshot Job: Nightly compute → insert `CustomerRFMSnapshot` → update segment membership.

## 4. Segment Definition Examples
| Segment | Criteria JSON (Conceptual) |
|---------|----------------------------|
| VIP | `{"rfm.composite": {"gte": 38}}` |
| Churn Risk | `{"lifecycle.stage": "ACTIVE", "daysSinceLastOrder": {"gte": 45}}` |
| New Customers | `{"orders.count": {"lte": 1}, "daysSinceFirstOrder": {"lte": 14}}` |
| High Discount Sensitivity | `{"promotions.redeemedRatio": {"gte": 0.5}}` |
| Cross-Sell Opportunity | `{"categories.lastOrderMissing": ["Accessories"]}` |

## 5. Automation Triggers
| Trigger | Condition | Action |
|---------|----------|--------|
| Abandoned Cart | `cart.updatedAt` inactivity > 1h & not converted | Send cart reminder email w/ dynamic product list |
| Churn Risk | Lifecycle stage ACTIVE + last order > 45d | Send win-back offer (e.g., discount code) |
| VIP Milestone | Composite RFM crosses threshold | Send loyalty reward / early access promotion |
| Post-Purchase | Order status PAID | Send upsell recommendations after 2d |
| Segment Entry | Customer added to segment | Fire onboarding sequence |

## 6. Campaign Execution Flow
1. Trigger detection writes queued automation task (idempotent key = customerId + triggerType + date bucket).
2. Worker resolves segment & personalization data (recommended products, discount code if applicable).
3. Email content templated (liquid / handlebars) + variable substitution.
4. Dispatch via Resend (or provider) with metadata (campaignId, correlationId).
5. EmailEvent entries recorded asynchronously on feedback (open, click, bounce) via webhook ingestion.

## 7. Idempotency & Rate Limits
| Aspect | Rule |
|--------|------|
| Same Trigger & Customer | Max 1 execution per 24h |
| Campaign Flood Control | Max X emails/customer/day (configurable) |
| High-Value Offer | Cooldown (e.g., 14d) before re-offering similar incentive |
| Abandoned Cart | Stop sending once order created or cart cleared |

## 8. Metrics & KPIs
| KPI | Description | Source |
|-----|-------------|--------|
| Cart Recovery Rate | Recovered carts / total abandoned | Cart + Order linkage |
| Churn Win-back Rate | % churn-risk recipients who order within 14d | Lifecycle metrics + orders |
| Segment Conversion Uplift | Delta conversion vs baseline | Segment membership & order data |
| Campaign Open Rate | OPEN / SENT | EmailEvent |
| Campaign Click Rate | CLICK / SENT | EmailEvent |
| Promotion Attribution | Order revenue influenced by campaign promos | AppliedPromotion + campaign mapping |

## 9. UI Components
| Component | Function |
|-----------|----------|
| SegmentBuilder | Visual criteria editor (chips, dropdowns) |
| CampaignWizard | Multi-step setup (trigger, template, audience) |
| EmailTemplatePreview | Render personalization variables & test data |
| PerformanceDashboard | Charts: recovery %, open/click rates, RFM distribution |
| AutomationLogViewer | List of recent trigger executions & statuses |

## 10. Data Quality & Governance
- Snapshot Integrity: Validate RFM snapshot count equals active customer count.
- Segment Drift: Alert if segment population changes > X% daily (unexpected).
- Campaign Effectiveness: A/B framework placeholder (store variant groups for template comparison).
- Privacy: Honor opt-out flags; filter segmentation query builder to exclude unsubscribed customers.

## 11. Recommendation Strategy (Early)
- Rule-based (same category, top-selling complimentary). Later: embedding similarity.
- Cache suggestions per product context; expire daily.
- Avoid duplicates with items already in cart or purchased in last N days.

## 12. Event Taxonomy (DomainEvent)
| Event | Purpose |
|-------|--------|
| order.created | Post-purchase automation trigger |
| cart.updated | Abandoned cart inactivity tracking |
| customer.segmented | Segment entry/exit notifications |
| promotion.redeemed | Promotion performance metrics |
| email.sent / email.open / email.click | Engagement metrics feeding lifecycle stage |

## 13. Roadmap Phases
| Phase | Focus |
|-------|-------|
| A | RFM Snapshot + SegmentBuilder + Cart model |
| B | Abandoned Cart + Churn Risk triggers |
| C | RecommendationEvent + Post-purchase upsell |
| D | A/B testing scaffolding + advanced lifecycle metrics |
| E | Predictive churn & CLV model integration |

## 14. Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Over-email fatigue | Rate limits + preference center |
| Segment explosion (too many) | Segment creation quotas + review UI |
| Personalization data stale | Daily refresh job + cache TTL | 
| Performance degradation from segment queries | Precomputed membership table + indexed criteria fields |

## 15. Success Metrics (Initial Targets)
| Metric | Target |
|--------|--------|
| Abandoned Cart Recovery | > 12% recovered |
| Churn Win-back | > 8% reactivated |
| VIP Segment Accuracy | <1% misclassification audits |
| Average Campaign Open Rate | > 30% |
| Average Campaign Click Rate | > 6% |

---
*Marketing automation foundation prioritizes reliable data collection (RFM, segments) before complex predictive modeling.*