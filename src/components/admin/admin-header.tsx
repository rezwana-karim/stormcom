"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationBell } from "./notification-bell";
import { usePathname } from "next/navigation";
import React from "react";

const routeLabels: Record<string, string> = {
  "/admin": "Overview",
  "/admin/users": "All Users",
  "/admin/users/pending": "Pending Approvals",
  "/admin/stores": "Stores",
  "/admin/stores/create": "Create Store",
  "/admin/activity": "Activity",
  "/admin/analytics": "Analytics",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
  "/admin/security": "Security",
};

export function AdminHeader() {
  const pathname = usePathname();
  
  // Build breadcrumb from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((_, index) => {
    const path = "/" + pathParts.slice(0, index + 1).join("/");
    return {
      path,
      label: routeLabels[path] || pathParts[index].charAt(0).toUpperCase() + pathParts[index].slice(1),
      isLast: index === pathParts.length - 1,
    };
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.path}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.path}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
