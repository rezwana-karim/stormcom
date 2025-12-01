/**
 * Webhooks Management Page
 * 
 * Dashboard page for managing webhooks and webhook subscriptions.
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WebhooksList } from '@/components/webhooks/webhooks-list';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'Webhooks | Dashboard',
  description: 'Manage webhooks and event subscriptions',
};

export default async function WebhooksPage() {
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
                    <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
                    <p className="text-muted-foreground">
                      Configure webhooks to receive real-time event notifications
                    </p>
                  </div>

                  <Suspense fallback={<div>Loading webhooks...</div>}>
                    <WebhooksList />
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
