# StormCom MVP Scope Definition

**Document Version**: 1.0  
**Created**: November 25, 2025  
**Author**: StormCom Engineering Team  
**Status**: ✅ Finalized  
**Phase**: 0 - Foundation Assessment  
**Epic**: Codebase Audit & Gap Analysis

---

## 📋 Document Purpose

This document defines the MVP scope for StormCom based on market validation needs and realistic development capacity. The target is an aggressive 2.5-month (10 weeks) delivery with a realistic 3-month (12-14 weeks) timeline including buffer. It ensures focus on high-impact features and prevents scope creep.

---

## 🎯 Executive Summary

### MVP Overview
- **Total Features**: 12 core features (within 20-feature maximum)
- **Timeline**: 12-14 weeks (3-3.5 months realistic, 2.5 months aggressive)
- **Total Effort**: 57 days (~10-11 weeks calendar time with 2 devs)
- **Target Market**: Bangladesh e-commerce vendors
- **Launch Type**: Beta launch with 5 pilot stores

### Key Decisions
1. ✅ Focus on standalone platform first, integrations later
2. ✅ Include foundational integrity features (PaymentAttempt, InventoryReservation, Idempotency, RBAC) before external integrations
3. ✅ Prioritize bKash over Stripe for Bangladesh market (Stripe as fallback)
4. ✅ Marketing automation deferred to Phase 4 (not critical for initial validation)
5. ✅ External website integration (WordPress, Shopify) deferred to Phase 2

---

## ✅ MVP Feature List (12 Features)

### Phase 1: E-Commerce Core (6 weeks, 8 features, 40 days)

| # | Feature | Issue Ref | Effort | Critical Path | User Impact |
|---|---------|-----------|--------|---------------|-------------|
| **1** | Product CRUD API & UI | #1.1, #1.2 | 9 days | YES | HIGH - Core catalog management for vendors |
| **2** | Inventory Management | #1.3 | 3 days | YES | HIGH - Prevent overselling, track stock |
| **3** | Dynamic Subdomain Routing | #1.4 | 4 days | YES | HIGH - Unique store URLs (vendor.stormcom.app) |
| **4** | Basic Storefront Template | #1.5 | 6 days | YES | HIGH - Customer-facing product display |
| **5** | Shopping Cart & Checkout | #1.6 | 5 days | YES | HIGH - Enable purchases |
| **6** | Order Processing API | #1.7 | 4 days | YES | HIGH - Order creation and management |
| **7** | Order Dashboard UI | #1.8 | 4 days | YES | HIGH - Vendor order management interface |
| **8** | Stripe Payment Integration | #1.9 | 5 days | YES | HIGH - International payment fallback |

**Sub-total**: 8 features, 40 days effort (~6 weeks with 2 devs)

---

### Phase 1.5: Bangladesh Features (4 weeks, 4 features, 17 days)

| # | Feature | Issue Ref | Effort | Critical Path | User Impact |
|---|---------|-----------|--------|---------------|-------------|
| **9** | bKash Payment Gateway | #1.10 | 6 days | YES | HIGH (BD) - Primary payment method for 60%+ of Bangladesh users |
| **10** | Cash on Delivery (COD) | #1.11 | 2 days | YES | HIGH (BD) - Required for 30%+ of Bangladesh orders |
| **11** | Bengali Localization | #1.12 | 4 days | NO | MEDIUM (BD) - Improves accessibility for local vendors |
| **12** | Pathao Shipping Integration | #1.13 | 5 days | NO | MEDIUM (BD) - Primary shipping partner in Bangladesh |

**Sub-total**: 4 features, 17 days effort (~4 weeks with 1 dev)

---

### MVP Totals

| Metric | Value |
|--------|-------|
| **Total Features** | 12 |
| **Total Effort** | 57 person-days |
| **Calendar Time** | 10-11 weeks (with 2 devs) |
| **Buffer** | 1-2 weeks |
| **Final Timeline** | 12-14 weeks |

---

## 🏗️ Foundational Integrity Features (Mandatory Prerequisites)

Based on the Risk Matrix analysis (Nov 25, 2025), the following foundational integrity features MUST be completed before external integrations:

### Required Before Phase 2 (External Integrations)

| Feature | Type | Rationale | Issue Reference |
|---------|------|-----------|-----------------|
| **PaymentAttempt Table** | Schema | Track all payment attempts, failures, and retries for audit and refund support | Phase 1, Step 2 |
| **InventoryReservation** | Schema + Logic | Prevent overselling during concurrent checkouts via temporary stock holds | Phase 1, Step 5 |
| **Idempotency Keys** | API Logic | Ensure retry safety for order creation and payment endpoints | Phase 1, Step 1 |
| **RBAC Permissions** | Schema + Logic | Granular staff permissions (product.write, refund.issue, etc.) beyond current enum roles | Phase 1, Step 7 |

### Implementation Timeline

These features are embedded within the MVP timeline:

```
Week 1-2:   PaymentAttempt + Idempotency (during Order Processing API)
Week 3-4:   InventoryReservation (during Inventory Management)
Week 5-6:   RBAC Foundation (parallel with Storefront Template)
Week 7-8:   Validation & Testing
```

---

## ❌ Features DEFERRED to Post-MVP

### Deferred to Phase 2-3 (Weeks 13-20)

| Feature | Original Phase | Days | Rationale |
|---------|----------------|------|-----------|
| WordPress Plugin (#2.1-2.3) | Phase 2 | 16 days | External site integration complexity; MVP validates standalone platform first |
| Shopify Integration (#2.4-2.6) | Phase 2 | 15 days | Bidirectional sync requires stable core; focus on direct store first |
| Instagram/Facebook Shopping (#3.1-3.2) | Phase 3 | 12 days | Social commerce layer after core e-commerce proven |
| Multi-channel Inventory (#3.3) | Phase 3 | 10 days | Advanced sync after single-channel stability |
| External Integration API v1 (#2.4) | Phase 2 | 4 days | API consumers need stable endpoints first |

**Total Deferred**: 57 days → Scheduled for Weeks 13-20

---

### Deferred to Phase 4 (Weeks 21-28)

| Feature | Days | Rationale |
|---------|------|-----------|
| Email Marketing Campaigns (#4.1-4.7) | 35 days | Automation not critical for initial validation; focus on core transactions |
| Abandoned Cart Recovery | 5 days | Requires customer tracking and email infrastructure |
| SMS/WhatsApp Marketing | 10 days | Multi-channel engagement after core marketing proven |
| Customer Segmentation | 8 days | Advanced analytics after sufficient order data collected |
| RFM Analysis | 5 days | Requires 3+ months of order history |
| Vendor Analytics Dashboard (#4.10) | 5 days | Basic analytics exists; advanced reporting after MVP |

**Total Deferred**: 68 days → Scheduled for Weeks 21-28

---

### Deferred to Phase 5 (Weeks 29+)

| Feature | Days | Rationale |
|---------|------|-----------|
| Event Sourcing (#5.1) | 15 days | Advanced architecture for scale, not validation |
| Workflow Orchestration (#5.2) | 10 days | Complex automations after process maturity |
| Fraud Detection (#5.3) | 10 days | ML-based security requires sufficient transaction data |
| Predictive Analytics (#5.4) | 15 days | AI-driven insights after 6+ months of data |

**Total Deferred**: 50 days → Scheduled for Weeks 29+

---

## 📊 Success Metrics for Each MVP Feature

### Feature-Level Success Criteria

| Feature | Metric | Target | Measurement Method |
|---------|--------|--------|-------------------|
| **Product CRUD** | Products created per store | 10+ in <2 min | Timing test during onboarding |
| **Inventory Management** | Oversell incidents | 0 | Reconciliation job (nightly) |
| **Subdomain Routing** | Store load time | <500ms | Lighthouse performance audit |
| **Storefront Template** | Mobile responsiveness | Pass on 3+ devices | Manual testing (iPhone, Android, tablet) |
| **Shopping Cart** | Cart persistence | 100% across sessions | Session storage validation |
| **Order Processing** | Order creation p95 latency | <400ms | API monitoring (OpenTelemetry) |
| **Order Dashboard** | Order visibility | 100+ orders performant | Load test with 500+ orders |
| **Stripe Payments** | Test payment success | 100% in sandbox | Stripe test dashboard |
| **bKash Payments** | Sandbox success rate | 95%+ | bKash sandbox environment |
| **Cash on Delivery** | COD order tracking | 100% marked correctly | Dashboard status verification |
| **Bengali Localization** | UI translation coverage | 100% core UI | Manual walkthrough |
| **Pathao Shipping** | Parcel creation success | 90%+ | Pathao sandbox testing |

---

## 🚀 MVP Launch Criteria (Beta Ready)

### Technical Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Products created per store | 10+ in <2 minutes | ⏳ Pending |
| Checkout flow completion | <60 seconds | ⏳ Pending |
| Stripe test payment success | 100% in sandbox | ⏳ Pending |
| bKash sandbox payment success | 95%+ (known API instability) | ⏳ Pending |
| Mobile responsive | Pass on 3+ devices (iPhone, Android, tablet) | ⏳ Pending |
| Page load times | <2s on 3G connection | ⏳ Pending |
| Critical security vulnerabilities | 0 (OWASP Top 10 compliant) | ⏳ Pending |
| Order creation latency p95 | <400ms | ⏳ Pending |
| Cache hit ratio | >65% | ⏳ Pending |
| Inventory reconciliation errors | 0 | ⏳ Pending |

### Operational Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Beta stores operational | 5 stores for 2 weeks | ⏳ Pending |
| Critical bugs in beta | 0 blocking issues | ⏳ Pending |
| Documentation complete | API docs, user guide, admin guide | ⏳ Pending |
| Support process defined | Issue reporting, escalation path | ⏳ Pending |
| Rollback procedure tested | Successful rollback within 30 min | ⏳ Pending |

### Business Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Beta vendor feedback | Positive from 4/5 vendors | ⏳ Pending |
| Payment completion rate | >80% of attempted checkouts | ⏳ Pending |
| Order fulfillment time | <24 hours for beta stores | ⏳ Pending |

---

## 📅 Timeline with Buffer

### Detailed Week-by-Week Schedule

```
Phase 0: Foundation Assessment
────────────────────────────────────────────────────────
Week 1:    Codebase Audit (#0.1) + Schema Validation (#0.2)
Week 2:    MVP Scope Definition (#0.3) + Stakeholder Sign-off
           CURRENT ← You are here

Phase 1: E-Commerce Core (6 weeks)
────────────────────────────────────────────────────────
Week 3:    Product CRUD API (#1.1) - Day 1-5
Week 4:    Product CRUD API (#1.1) - Day 6-9 + Product UI (#1.2) - Day 1-2
Week 5:    Product UI (#1.2) - Day 3-5 + Inventory Management (#1.3)
Week 6:    Subdomain Routing (#1.4) + Storefront Template Start (#1.5)
Week 7:    Storefront Template (#1.5) + Shopping Cart (#1.6)
Week 8:    Order Processing (#1.7) + Order Dashboard (#1.8)
           Stripe Integration (#1.9) - Parallel track

Phase 1.5: Bangladesh Features (4 weeks)
────────────────────────────────────────────────────────
Week 9:    bKash Integration (#1.10) - Day 1-4
Week 10:   bKash Integration (#1.10) - Day 5-6 + COD (#1.11)
Week 11:   Bengali Localization (#1.12)
Week 12:   Pathao Shipping (#1.13)

Buffer & Launch Prep (2 weeks)
────────────────────────────────────────────────────────
Week 13:   Buffer / Bug Fixes / Testing / Documentation
Week 14:   Beta Launch Preparation / Vendor Onboarding

TOTAL: 14 weeks (3.5 months)
────────────────────────────────────────────────────────
```

### Timeline Options

| Scenario | Duration | Risk Level | Notes |
|----------|----------|------------|-------|
| **Aggressive** | 10 weeks | 🔴 HIGH | No buffer, tight schedules, risk of burnout |
| **Realistic** | 12-14 weeks | 🟡 MEDIUM | 1-2 week buffer, recommended |
| **Conservative** | 16 weeks | 🟢 LOW | 4 week buffer, accounts for unknowns |

**Recommendation**: Communicate **3-month timeline** to stakeholders with **2.5-month stretch goal**.

---

## ⚠️ Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| bKash API instability | HIGH | HIGH | Use COD as fallback; parallel Stripe integration | Backend Lead |
| Subdomain routing complexity | MEDIUM | HIGH | Early spike (Week 5); fallback to path-based routing | Full-stack Dev |
| Database migration issues | LOW | HIGH | Test migrations on staging; maintain rollback scripts | DevOps |
| Performance degradation | MEDIUM | MEDIUM | Early performance testing (Week 8); cache optimization | Backend Lead |

### Timeline Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Scope creep | MEDIUM | HIGH | Strict feature freeze after Week 2; change request process | Product Owner |
| Developer availability | LOW | HIGH | Cross-train on critical features; documentation | Tech Lead |
| Third-party delays | MEDIUM | MEDIUM | Early API access requests; mock implementations | Integration Lead |
| Testing delays | MEDIUM | MEDIUM | Parallel testing track; automated test suite | QA Lead |

### Resource Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| bKash merchant approval delay | HIGH | HIGH | Apply NOW (2-3 weeks processing); use sandbox until approved | Business Lead |
| Pathao API access | MEDIUM | MEDIUM | Apply during Week 1; manual shipping as backup | Business Lead |
| Infrastructure costs | LOW | LOW | Use Vercel free tier; upgrade only when needed | DevOps |

### External Risks

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Bangladesh regulatory changes | LOW | HIGH | Monitor e-commerce regulations; legal review | Legal/Compliance |
| Currency fluctuation (BDT) | LOW | LOW | Fixed pricing; regular review | Finance |
| Competitive pressure | MEDIUM | MEDIUM | Focus on MVP; iterate based on feedback | Product Owner |

---

## 👥 Stakeholder Sign-off

### MVP Scope Agreement

**MVP Features** (12 total):
1. ✅ Product CRUD API & UI
2. ✅ Inventory Management
3. ✅ Dynamic Subdomain Routing
4. ✅ Basic Storefront Template
5. ✅ Shopping Cart & Checkout
6. ✅ Order Processing API
7. ✅ Order Dashboard UI
8. ✅ Stripe Payment Integration
9. ✅ bKash Payment Gateway
10. ✅ Cash on Delivery
11. ✅ Bengali Localization
12. ✅ Pathao Shipping Integration

**Foundational Integrity Features** (Mandatory Prerequisites):
- ✅ PaymentAttempt Table (audit trail, refund support)
- ✅ InventoryReservation (prevent overselling)
- ✅ Idempotency Keys (retry safety)
- ✅ RBAC Permissions (granular staff access)

**Deferred Features** (Phase 2-5):
- ❌ WordPress/Shopify Integration → Phase 2
- ❌ Instagram/Facebook Shopping → Phase 3
- ❌ Email/SMS/WhatsApp Marketing → Phase 4
- ❌ Event Sourcing/Fraud Detection → Phase 5

**Timeline**: 12-14 weeks from Phase 0 completion (Phase 0 ends Week 2 of December 2025; estimated beta launch: February-March 2026)

**Launch Criteria**: See "MVP Launch Criteria" section above

---

### Sign-off Section

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Owner** | ___________________ | ___________________ | _______/______/2025 |
| **Tech Lead** | ___________________ | ___________________ | _______/______/2025 |
| **Business Owner** | ___________________ | ___________________ | _______/______/2025 |
| **Engineering Lead** | ___________________ | ___________________ | _______/______/2025 |

---

## 📚 References

### Primary Documentation
- `docs/PROJECT_PLAN.md` - High-level project overview
- `docs/EXECUTIVE_SUMMARY.md` - Business goals and vision
- `docs/research/feature_roadmap_user_stories.md` - 5-phase roadmap
- `docs/research/implementation_plan.md` - 14-step execution guide
- `docs/GITHUB_ISSUES_PLAN_V2.md` - 130 issues across all phases
- `docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md` - Current progress (35%)

### Technical Documentation
- `docs/research/database_schema_analysis.md` - Schema evolution plan
- `docs/research/threat_model.md` - Security considerations
- `docs/research/performance_scaling.md` - Performance targets
- `docs/research/cost_optimization.md` - Cost management

### Codebase References
- `prisma/schema.sqlite.prisma` - Current database schema
- `src/app/api/` - Existing API routes
- `src/lib/services/` - Service layer
- `src/components/` - UI components

---

## 📈 Post-MVP Roadmap Preview

### Phase 2: External Website Integration (Weeks 13-16)
- WordPress Plugin
- Shopify Integration
- External API v1

### Phase 3: Multi-Channel Sales (Weeks 17-22)
- Facebook Shop Integration
- Instagram Shopping
- Multi-channel Inventory Sync

### Phase 4: Marketing Automation (Weeks 23-31)
- Email Campaign Builder
- SMS/WhatsApp Integration
- Abandoned Cart Recovery
- Customer Segmentation

### Phase 5: Advanced Reliability (Weeks 32+)
- Event Sourcing
- Fraud Detection
- Predictive Analytics

---

## ✅ Document Approval

This MVP Scope Definition document has been reviewed and approved for implementation.

**Document Control**:
- **Version**: 1.0
- **Created**: November 25, 2025
- **Last Updated**: November 25, 2025
- **Next Review**: After Week 2 (MVP scope freeze)
- **Owner**: StormCom Engineering Team

---

**Let's build the future of Bangladesh e-commerce! 🚀**
