"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCamera,
  IconChartBar,
  IconCreditCard,
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
  IconUsers,
} from "@tabler/icons-react"

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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
        {
          title: "All Products",
          url: "/dashboard/products",
        },
        {
          title: "New Product",
          url: "/dashboard/products/new",
        },
        {
          title: "Categories",
          url: "/dashboard/categories",
        },
        {
          title: "Brands",
          url: "/dashboard/brands",
        },
        {
          title: "Attributes",
          url: "/dashboard/attributes",
        },
        {
          title: "Inventory",
          url: "/dashboard/inventory",
        },
        {
          title: "Reviews",
          url: "/dashboard/reviews",
        },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: IconListDetails,
      items: [
        {
          title: "All Orders",
          url: "/dashboard/orders",
        },
        {
          title: "Cart",
          url: "/dashboard/cart",
        },
      ],
    },
    {
      title: "Payments",
      url: "/dashboard/payments",
      icon: IconCreditCard,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
    },
    {
      title: "Stores",
      url: "/dashboard/stores",
      icon: IconDatabase,
      items: [
        {
          title: "All Stores",
          url: "/dashboard/stores",
        },
        {
          title: "Subscriptions",
          url: "/dashboard/subscriptions",
        },
      ],
    },
    {
      title: "Marketing",
      url: "#",
      icon: IconReport,
      items: [
        {
          title: "Coupons",
          url: "/dashboard/coupons",
        },
        {
          title: "Emails",
          url: "/dashboard/emails",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
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
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: IconReport,
    },
    {
      title: "Webhooks",
      url: "/dashboard/webhooks",
      icon: IconInnerShadowTop,
    },
    {
      title: "Integrations",
      url: "/dashboard/integrations",
      icon: IconDatabase,
    },
    {
      title: "Admin",
      url: "/dashboard/admin",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
