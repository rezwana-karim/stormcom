# StormCom Permissions Taxonomy & RBAC Strategy

## 1. Goals
| Goal | Description |
|------|-------------|
| Least Privilege | Grant only necessary scopes to each role |
| Auditability | All permission changes logged with actor & correlationId |
| Extensibility | Support API tokens & future marketplace app scopes |
| Performance | Fast permission resolution (microseconds scale) |

## 2. Core Models
```prisma
model Permission {
  id          String @id @default(cuid())
  code        String @unique
  description String?
  createdAt   DateTime @default(now())
}

model RolePermission {
  id           String @id @default(cuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  @@unique([role, permissionId])
}

model ApiToken {
  id          String @id @default(cuid())
  storeId     String
  tokenHash   String @unique
  scopes      String // JSON array of permission codes
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  revokedAt   DateTime?
  @@index([storeId])
}
```

## 3. Permission Codes
| Category | Codes |
|----------|-------|
| Product | product.read, product.write, product.publish |
| Inventory | inventory.read, inventory.adjust |
| Order | order.read, order.write, order.fulfill, order.refund |
| Customer | customer.read, customer.write, customer.segment.manage |
| Promotion | promo.manage, discount.create, discount.apply |
| Webhook & Integration | webhook.manage, integration.manage |
| Analytics | analytics.view, analytics.export |
| Settings & Billing | settings.manage, billing.manage |
| Admin | admin.superuser |

## 4. Role → Permission Mapping (Initial)
| Role | Permissions |
|------|------------|
| VIEWER | product.read, inventory.read, order.read, customer.read, analytics.view |
| MEMBER | VIEWER + product.write, inventory.adjust, order.fulfill |
| ADMIN | MEMBER + product.publish, order.refund, promo.manage, discount.create, webhook.manage, settings.manage, billing.manage |
| OWNER | ADMIN + admin.superuser, integration.manage, analytics.export |

## 5. Resolution Algorithm
1. Resolve base role permissions.
2. Merge API token scopes (subset only; cannot elevate beyond role unless OWNER configured override policy).
3. Apply user override permissions (rare; stored separately if needed).
4. Remove revoked or expired token scopes.
5. Cache combined set in request context.

```ts
export function buildPermissionSet(ctx: RequestCtx): Set<string> {
  const rolePerms = rolePermissions[ctx.session.role];
  const tokenPerms = ctx.apiToken?.scopes.filter(s => rolePerms.includes(s)) ?? [];
  const overridePerms = ctx.userOverrides ?? [];
  return new Set([...rolePerms, ...tokenPerms, ...overridePerms]);
}
```

## 6. Enforcement Pattern
```ts
function requirePermissions(required: string[], ctx: RequestCtx) {
  for (const p of required) {
    if (!ctx.perms.has(p)) throw new ForbiddenError(p);
  }
}
```
Applied at service layer entry to centralize logic (avoid scattering across routes).

## 7. API Token Lifecycle
| Stage | Action |
|-------|--------|
| Create | Generate random secret → hash (bcrypt/argon) → store scopes |
| Use | Extract token; hash; lookup; verify not revoked/expired |
| Rotate | Issue new token; revoke old (set `revokedAt`) |
| Revoke | Set `revokedAt`; remove from cache; log audit entry |

Security: Display token only once (post-create); merchants instructed to store securely.

## 8. Audit Logging
| Event | Fields |
|-------|-------|
| permission.granted | actorId, targetUserId, permissionCode, correlationId |
| permission.revoked | actorId, targetUserId, permissionCode |
| api_token.created | actorId, tokenId, scopes |
| api_token.revoked | actorId, tokenId |

Hash chain ensures forensic integrity of permission change timeline.

## 9. Performance Considerations
- Preload role→permission mapping in memory on server start.
- Use Set for O(1) permission lookup.
- Maintain lightweight cache keyed by `session.user.id` + token hash; TTL short (5–15m).

## 10. Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Token Scope Abuse | Scopes cannot exceed role baseline; monitor unusual usage |
| Stale Overrides | Include expiration timestamp on override entries |
| Permission Drift | Scheduled audit compares DB role mapping with code manifest |
| Excessive Permission Codes | Group logically; avoid micro-scopes prematurely |

## 11. Future Enhancements
- Dynamic permission grants via feature flags.
- Tenant-specific custom roles (with guardrail validation).
- Attribute-based access control (ABAC) for contextual restrictions (e.g., `order.refund` only if status=PAID & amount < threshold).

## 12. Success Metrics
| Metric | Target |
|--------|--------|
| Unauthorized Endpoint Access Attempts | <0.5% of total secured requests |
| Permission Grant Audit Discrepancies | 0 per monthly review |
| Token Revocation Latency | < 5s (propagation) |
| Permission Lookup Time | < 1ms average |

---
*Permission taxonomy establishes scalable RBAC foundation; future extensions can layer ABAC or policy engine without redesign.*

---
## 2025-11-24 Cross-Reference & RBAC Expansion Addendum
Links permission strategy to funnel outcomes, MACH guidance, and cost/security efficiency.

### A. Funnel Linkage
| Permission Scope | Funnel Stage Impact | Example Action |
|------------------|---------------------|----------------|
| promo.manage | Conversion | Create promotion driving discount adoption |
| customer.segment.manage | Loyalty | Configure segment for retention campaign |
| analytics.export | Measurement | Export cohort data for optimization |
| order.refund | Loyalty / Trust | Process refund promptly |
| inventory.adjust | Conversion (availability) | Maintain accurate stock preventing oversell |

### B. MACH Principle Reinforcement
| Principle | RBAC Contribution |
|----------|-------------------|
| API-first | Clear scopes for external token access |
| Microservices-ready | Permission codes map cleanly to future service boundaries |
| Cloud-native | Low-overhead in-memory permission resolution |
| Headless | Storefront tokens restricted to read-only catalog scopes |

### C. Cost & Governance Safeguards
| Safeguard | Description |
|----------|-------------|
| Permission manifest checksum | Detect drift between DB and code list |
| High-risk scope MFA (refund.issue, admin.superuser) | Prevent fraudulent elevated operations |
| Token scope limiter | Enforce subset-of-role invariant |
| Permission grant anomaly alert | Notify on sudden grant spikes |

### D. Success Metrics Extension
| Metric | Target |
|--------|-------|
| Permission resolution median time | < 0.5ms |
| High-risk permission misuse incidents | 0 |
| Drift discrepancies per audit | 0 |
| Token scope elevation attempts blocked | 100% |

### E. Immediate Actions
1. Implement permission manifest export & checksum verification.
2. Add MFA requirement stub for high-risk operations.
3. Introduce anomaly detection on grant events (rate over baseline).
4. Create automated report of unused permissions per 30 days.

### F. Alignment Statement
RBAC evolution secures multi-tenant integrity and enables safe rapid feature rollout (promotions, segmentation) while minimizing overhead and supporting future microservice extraction.

*Addendum authored 2025-11-24.*