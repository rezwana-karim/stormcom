# StormCom UI/UX Improvements & Component Strategy

## Current Observations (Inferred From Signup Page & Project Structure)
- Uses shadcn UI primitives; consistent design tokens possible.
- Signup page includes tabbed auth method (Password vs Email Link) – good affordance.
- Missing visible dashboard pages verification due to navigation aborts; suggests auth redirect flows may need clearer loading states.
- Sidebar / navigation components likely exist but not evaluated due to dev tooling limitations.

## UX Design Principles for Multi-Tenant Merchant Dashboard
1. Progressive disclosure: Show basic metrics first, allow drilling into advanced analytics.
2. Contextual inline actions: Editable rows (inventory adjustments) with modals limited to high-risk changes (refund issuance).
3. Feedback loops: Toasts for async operations (fulfillment creation), optimistic UI with rollback on failure.
4. Accessibility: WCAG-compliant contrast, focus outlines, correct ARIA for lists, tablists (already present), role-based content hiding.
5. Performance perception: Skeletons + streaming for heavy product pages; keep initial HTML payload minimal.

## Component Architecture Enhancements
| Component Category | Improvement | Notes |
|--------------------|------------|-------|
| Navigation | Role-aware menu items; dynamic badge counts (low-stock, pending returns) | Use server component + `cacheTag` invalidation |
| Tables (DataTable) | Column-level skeletons, bulk selection actions, sticky headers | Integrate TanStack Table virtualization |
| Forms | Unified `Form` abstraction with zod schema integration & diff highlighting on edit | Avoid repeated validation logic |
| Product Media | Gallery component with lazy loading & blur placeholders | Precompute image dimensions for CLS reduction |
| Pricing Editor | Tier & currency matrix UI (grid with add/remove row) | Inline validation of overlapping tiers |
| Promotion Builder | Rule + action builder (condition chips) | JSON rule schema serialization |
| Inventory | Adjustment drawer (slide-over) + reason quick-select | Mirror event sourcing concept |
| Fulfillment | Multi-select order items, automatic package weight calc | Provide recommended carrier rates |
| Returns | RMA wizard with status timeline component | Visual state transitions to reduce support load |
| Analytics | Card components (GMV, AOV, Conversion) + trend sparkline; Cohort chart | Streaming secondary queries behind Suspense |
| Permissions | Matrix UI (roles vs permissions) with toggle diff preview | Persist changes atomically |
| Webhooks | Delivery log viewer with retry action | Status filtering & exponential backoff visualization |
| Theming | Live preview iframe with draft/publish toggle | Provide version history (later) |

## shadcn Component Additions
Consider adding (if not present):
- `@shadcn/hover-card` for product quick view.
- `@shadcn/toast` or existing `sonner` integration for feedback.
- `@shadcn/command` for global command palette (quick nav, actions).
- `@shadcn/context-menu` for right-click inventory operations.
- `@shadcn/scroll-area` for large lists.

(Suggested add command: `npx shadcn@latest add hover-card toast command context-menu scroll-area`)

## Accessibility & Internationalization Checklist
| Item | Action |
|------|--------|
| Language attributes | Set `<html lang>` dynamically per store locale |
| Currency formatting | Use Intl.NumberFormat with store currency | 
| Date & time | Normalize timezone per store settings |
| Keyboard navigation | Ensure modals/traps release focus correctly |
| ARIA labels | Provide descriptive alt text (enabled by ProductImage normalization) |

## Visual Hierarchy & Information Density
- Dashboard hero metrics (GMV, Orders Today, Low Stock Count).
- Secondary panels: Top selling products, recent orders, pending returns.
- Avoid overcrowding: apply progressive disclosure (accordion for advanced filters).

## Loading & Caching Patterns
| Pattern | Implementation |
|---------|---------------|
| Product List | Server component fetch + streaming facets under Suspense |
| Dashboard Metrics | `use cache` for static daily aggregates; revalidate every 60s |
| Price Matrix | Client component with optimistic row addition |
| Promotion Evaluation (Preview) | On-demand server action returning computed discount breakdown |

## Error Handling UX
- Inline field errors below inputs (shadcn `FormMessage`).
- Toast for non-field errors (network, server exceptions).
- Retry affordances (webhook delivery re-run, payment retry) via contextual buttons.

## Example UI Story (Inventory Adjustment)
1. User opens Product detail.
2. Clicks "Adjust Inventory" → slide-over panel.
3. Enters delta, chooses reason from select (`sale`, `manual correction`, `return`).
4. UI optimistically updates stock badge; if server rejects (validation or concurrency), rollback & show toast.
5. InventoryLog list updates (revalidated tag `inventory:{productId}`).

## Component Code Sketch (Promotion Rule Builder)
```tsx
"use client";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { ConditionEditor } from "./condition-editor";
import { ActionEditor } from "./action-editor";

export function PromotionBuilder({ onSave }: { onSave: (rule: any) => void }) {
  const [conditions, setConditions] = useState([]);
  const [actions, setActions] = useState([]);
  return (
    <Card className="space-y-4">
      <ConditionEditor value={conditions} onChange={setConditions} />
      <ActionEditor value={actions} onChange={setActions} />
      <Button onClick={() => onSave({ conditions, actions })}>Save Rule</Button>
    </Card>
  );
}
```

## Risk Mitigation Via UX
| Risk | UX Mitigation |
|------|---------------|
| Dangerous operations (refund full order) | Confirmation modal with summary & irreversible warning |
| Overselling due to manual stock edit | Validation and warning if adjustment leads to negative available stock |
| Hidden permissions confusion | Permission matrix with tooltips explaining scope |
| Complex returns | Timeline component visually representing progress |

## Success Metrics
- Time to create promotion < 2 minutes after implementation.
- Inventory adjustment error rate < 1%.
- Dashboard initial content FCP < 1s with skeletons.
- Task success (finding low-stock products) within 3 clicks.

## Conclusion
Enhancing UI/UX centers on structured component patterns, role-aware navigation, performance perception (streaming + skeletons), and rich merchandising/operational tooling. Normalizing media and pricing data in schema directly unlocks new UI components (gallery, price matrix). Phased adoption ensures minimal disruption while progressively elevating merchant experience.
