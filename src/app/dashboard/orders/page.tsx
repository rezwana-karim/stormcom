// src/app/dashboard/orders/page.tsx
// Orders listing page

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OrdersPageClient } from '@/components/orders-page-client';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'Orders | Dashboard',
  description: 'Manage your orders',
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col min-h-0 overflow-auto">
          <div className="@container/main flex flex-col gap-2 p-4 pb-8 md:p-6 md:pb-12">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground">
                  Manage and track all your orders across stores.
                </p>
              </div>
            </div>

            <OrdersPageClient />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
