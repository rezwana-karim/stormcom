"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPackage,
  IconReport,
  IconSearch,
  IconSettings,
  IconShieldCog,
  IconUsers,
} from "@tabler/icons-react"

import { usePermissions } from "@/hooks/use-permissions"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const getNavConfig = (session: { user?: { name?: string | null; email?: string | null; image?: string | null } } | null) => ({
  user: {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "/avatars/default.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      permission: undefined, // Everyone can access dashboard
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: IconPackage,
      permission: "products:read",
      items: [
        {
          title: "All Products",
          url: "/dashboard/products",
          permission: "products:read",
        },
        {
          title: "New Product",
          url: "/dashboard/products/new",
          permission: "products:create",
        },
        {
          title: "Categories",
          url: "/dashboard/categories",
          permission: "categories:read",
        },
        {
          title: "Brands",
          url: "/dashboard/brands",
          permission: "brands:read",
        },
        {
          title: "Attributes",
          url: "/dashboard/attributes",
          permission: "attributes:read",
        },
        {
          title: "Inventory",
          url: "/dashboard/inventory",
          permission: "inventory:read",
        },
        {
          title: "Reviews",
          url: "/dashboard/reviews",
          permission: "reviews:read",
        },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: IconListDetails,
      permission: "orders:read",
      items: [
        {
          title: "All Orders",
          url: "/dashboard/orders",
          permission: "orders:read",
        },
        {
          title: "Cart",
          url: "/dashboard/cart",
          permission: "orders:read",
        },
      ],
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: IconUsers,
      permission: "customers:read",
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
      permission: "analytics:read",
    },
    {
      title: "Stores",
      url: "/dashboard/stores",
      icon: IconDatabase,
      permission: "store:read",
      items: [
        {
          title: "All Stores",
          url: "/dashboard/stores",
          permission: "store:read",
        },
        {
          title: "Subscriptions",
          url: "/dashboard/subscriptions",
          permission: "subscriptions:read",
        },
      ],
    },
    {
      title: "Marketing",
      url: "#",
      icon: IconReport,
      permission: "marketing:read",
      items: [
        {
          title: "Coupons",
          url: "/dashboard/coupons",
          permission: "coupons:read",
        },
        {
          title: "Emails",
          url: "/dashboard/emails",
          permission: "marketing:read",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: IconFolder,
      permission: undefined, // Basic access
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
      permission: "organization:read",
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
      permission: undefined, // Everyone can access settings
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: IconReport,
      permission: undefined,
    },
    {
      title: "Webhooks",
      url: "/dashboard/webhooks",
      icon: IconInnerShadowTop,
      permission: "webhooks:read",
    },
    {
      title: "Integrations",
      url: "/dashboard/integrations",
      icon: IconDatabase,
      permission: "integrations:read",
    },
    {
      title: "Admin Panel",
      url: "/admin",
      icon: IconShieldCog,
      requireSuperAdmin: true, // Only super admin
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
      permission: undefined,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
      permission: undefined,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const navConfig = getNavConfig(session)
  const { can, isSuperAdmin, isLoading } = usePermissions()

  // Filter menu items based on permissions
  const filteredNavMain = React.useMemo(() => {
    if (isLoading) return []
    
    return navConfig.navMain.filter((item) => {
      // If no permission required or user has permission, include
      if (!item.permission || can(item.permission)) {
        // Filter sub-items if they exist
        if (item.items) {
          const filteredItems = item.items.filter((subItem) => 
            !subItem.permission || can(subItem.permission)
          )
          return {
            ...item,
            items: filteredItems.length > 0 ? filteredItems : undefined,
          }
        }
        return item
      }
      return false
    }).filter(Boolean)
  }, [can, isLoading, navConfig.navMain])

  const filteredNavSecondary = React.useMemo(() => {
    if (isLoading) return []
    
    return navConfig.navSecondary.filter((item) => {
      // Check super admin requirement
      if (item.requireSuperAdmin) {
        return isSuperAdmin
      }
      // Check permission
      return !item.permission || can(item.permission)
    })
  }, [can, isSuperAdmin, isLoading, navConfig.navSecondary])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">StormCom</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavDocuments items={navConfig.documents} />
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navConfig.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
