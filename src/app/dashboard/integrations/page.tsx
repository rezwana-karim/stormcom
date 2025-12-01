/**
 * Integrations Management Page
 * 
 * Dashboard page for managing third-party integrations.
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { IntegrationsList } from '@/components/integrations/integrations-list';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'Integrations | Dashboard',
  description: 'Manage third-party integrations and connections',
};

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
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
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                    <p className="text-muted-foreground">
                      Connect your store with popular services and tools
                    </p>
                  </div>

                  <Suspense fallback={<div>Loading integrations...</div>}>
                    <IntegrationsList />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
