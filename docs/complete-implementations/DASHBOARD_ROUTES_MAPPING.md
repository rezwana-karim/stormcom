# Dashboard Routes Mapping & Layout Analysis

**Date**: November 23, 2025  
**Analysis**: Complete dashboard route structure and layout consistency check

---

## Complete Route Structure

### ✅ Routes WITH Proper Layout (SidebarProvider + AppSidebar + SiteHeader)

| Route | File | Layout Status |
|-------|------|---------------|
| `/dashboard` | `src/app/dashboard/page.tsx` | ✅ Has Layout |
| `/dashboard/products` | `src/app/dashboard/products/page.tsx` | ✅ Has Layout |
| `/dashboard/products/new` | `src/app/dashboard/products/new/page.tsx` | ✅ Has Layout |
| `/dashboard/products/[id]` | `src/app/dashboard/products/[id]/page.tsx` | ✅ Has Layout |
| `/dashboard/orders` | `src/app/dashboard/orders/page.tsx` | ✅ Has Layout |
| `/dashboard/orders/[id]` | `src/app/dashboard/orders/[id]/page.tsx` | ✅ Has Layout |
| `/dashboard/categories` | `src/app/dashboard/categories/page.tsx` | ✅ Has Layout |
| `/dashboard/categories/new` | `src/app/dashboard/categories/new/page.tsx` | ✅ Has Layout |
| `/dashboard/categories/[slug]` | `src/app/dashboard/categories/[slug]/page.tsx` | ✅ Has Layout |
| `/dashboard/brands` | `src/app/dashboard/brands/page.tsx` | ✅ Has Layout |
| `/dashboard/brands/new` | `src/app/dashboard/brands/new/page.tsx` | ✅ Has Layout |
| `/dashboard/brands/[slug]` | `src/app/dashboard/brands/[slug]/page.tsx` | ✅ Has Layout |

**Total with Layout**: 12 pages

---

## ❌ Routes MISSING Proper Layout

| Route | File | Missing Components | Priority |
|-------|------|--------------------|----------|
| `/dashboard/customers` | `src/app/dashboard/customers/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/inventory` | `src/app/dashboard/inventory/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/reviews` | `src/app/dashboard/reviews/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/stores` | `src/app/dashboard/stores/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/webhooks` | `src/app/dashboard/webhooks/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/subscriptions` | `src/app/dashboard/subscriptions/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/coupons` | `src/app/dashboard/coupons/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🔴 High |
| `/dashboard/cart` | `src/app/dashboard/cart/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/emails` | `src/app/dashboard/emails/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/notifications` | `src/app/dashboard/notifications/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/integrations` | `src/app/dashboard/integrations/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/attributes` | `src/app/dashboard/attributes/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/attributes/new` | `src/app/dashboard/attributes/new/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/attributes/[id]` | `src/app/dashboard/attributes/[id]/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |
| `/dashboard/admin` | `src/app/dashboard/admin/page.tsx` | SidebarProvider, AppSidebar, SiteHeader | 🟡 Medium |

**Total Missing Layout**: 16 pages

---

## Navigation Component Analysis

### AppSidebar (`src/components/app-sidebar.tsx`)

**Current Navigation Items**:
```typescript
navMain: [
  { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
  { 
    title: "Products", 
    url: "/dashboard/products", 
    icon: IconPackage,
    items: [
      { title: "All Products", url: "/dashboard/products" },
      { title: "New Product", url: "/dashboard/products/new" },
      { title: "Categories", url: "/dashboard/categories" },
      { title: "Brands", url: "/dashboard/brands" },
      { title: "Attributes", url: "/dashboard/attributes" },
    ]
  },
  { title: "Orders", url: "/dashboard/orders", icon: IconListDetails },
  { title: "Analytics", url: "/dashboard", icon: IconChartBar },
  { title: "Projects", url: "/projects", icon: IconFolder },
  { title: "Team", url: "/team", icon: IconUsers },
]
```

**✅ Using Next.js Link**: YES (in NavMain component)

---

## Missing Navigation Items

The following routes exist but are NOT in the sidebar navigation:

| Route | Should Be In | Suggested Parent |
|-------|--------------|------------------|
| `/dashboard/customers` | Main Nav | New "Customers" item |
| `/dashboard/inventory` | Main Nav | "Products" submenu |
| `/dashboard/reviews` | Main Nav | "Products" submenu or separate |
| `/dashboard/stores` | Main Nav | New "Stores" item |
| `/dashboard/webhooks` | Main Nav | "Settings" submenu |
| `/dashboard/subscriptions` | Main Nav | "Stores" submenu |
| `/dashboard/coupons` | Main Nav | "Marketing" submenu |
| `/dashboard/cart` | Main Nav | "Orders" submenu |
| `/dashboard/emails` | Main Nav | "Marketing" submenu |
| `/dashboard/notifications` | Main Nav | "Settings" submenu |
| `/dashboard/integrations` | Main Nav | "Settings" submenu |
| `/dashboard/analytics` | Main Nav | Fix existing (points to wrong URL) |
| `/dashboard/admin` | Main Nav | New "Admin" item |

---

## Standard Layout Pattern

**Consistent Layout Structure** (from products/page.tsx):

```tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default async function PageName() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Page content here */}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Recommended Navigation Structure

```typescript
navMain: [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: IconPackage,
    items: [
      { title: "All Products", url: "/dashboard/products" },
      { title: "New Product", url: "/dashboard/products/new" },
      { title: "Categories", url: "/dashboard/categories" },
      { title: "Brands", url: "/dashboard/brands" },
      { title: "Attributes", url: "/dashboard/attributes" },
      { title: "Inventory", url: "/dashboard/inventory" },
      { title: "Reviews", url: "/dashboard/reviews" },
    ],
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: IconListDetails,
    items: [
      { title: "All Orders", url: "/dashboard/orders" },
      { title: "Cart", url: "/dashboard/cart" },
    ],
  },
  {
    title: "Customers",
    url: "/dashboard/customers",
    icon: IconUsers,
  },
  {
    title: "Marketing",
    url: "#",
    icon: IconMail,
    items: [
      { title: "Coupons", url: "/dashboard/coupons" },
      { title: "Emails", url: "/dashboard/emails" },
    ],
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: IconChartBar,
  },
  {
    title: "Stores",
    url: "/dashboard/stores",
    icon: IconShop,
    items: [
      { title: "All Stores", url: "/dashboard/stores" },
      { title: "Subscriptions", url: "/dashboard/subscriptions" },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    items: [
      { title: "General", url: "/settings" },
      { title: "Notifications", url: "/dashboard/notifications" },
      { title: "Webhooks", url: "/dashboard/webhooks" },
      { title: "Integrations", url: "/dashboard/integrations" },
    ],
  },
  {
    title: "Admin",
    url: "/dashboard/admin",
    icon: IconShield,
  },
]
```

---

## Implementation Checklist

### Phase 1: Fix Missing Layouts (Priority 🔴 High)
- [ ] `/dashboard/customers` - Add layout wrapper
- [ ] `/dashboard/inventory` - Add layout wrapper
- [ ] `/dashboard/reviews` - Add layout wrapper
- [ ] `/dashboard/stores` - Add layout wrapper
- [ ] `/dashboard/webhooks` - Add layout wrapper
- [ ] `/dashboard/subscriptions` - Add layout wrapper
- [ ] `/dashboard/coupons` - Add layout wrapper

### Phase 2: Fix Missing Layouts (Priority 🟡 Medium)
- [ ] `/dashboard/cart` - Add layout wrapper
- [ ] `/dashboard/emails` - Add layout wrapper
- [ ] `/dashboard/notifications` - Add layout wrapper
- [ ] `/dashboard/integrations` - Add layout wrapper
- [ ] `/dashboard/attributes` - Add layout wrapper
- [ ] `/dashboard/attributes/new` - Add layout wrapper
- [ ] `/dashboard/attributes/[id]` - Add layout wrapper
- [ ] `/dashboard/analytics` - Add layout wrapper
- [ ] `/dashboard/admin` - Add layout wrapper

### Phase 3: Update Navigation
- [ ] Update `app-sidebar.tsx` with complete navigation structure
- [ ] Add missing icons (IconShop, IconMail, IconShield, etc.)
- [ ] Verify all Links are using Next.js `<Link>` component
- [ ] Test collapsible submenu functionality

### Phase 4: Validation
- [ ] Build project (`npm run build`)
- [ ] Type check (`npm run type-check`)
- [ ] Test all routes in browser
- [ ] Verify sidebar navigation works
- [ ] Verify active route highlighting

---

## Summary

- **Total Dashboard Routes**: 28 pages
- **With Proper Layout**: 12 pages (43%)
- **Missing Layout**: 16 pages (57%)
- **Navigation Items Missing**: 10+ routes not in sidebar
- **Action Required**: Add consistent layout to 16 pages + update navigation

---

**Next Steps**: Implement Phase 1 (High Priority) layout fixes first.
