// src/app/dashboard/attributes/new/page.tsx
// Create New Attribute Page

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributeNewClient } from '@/components/attribute-new-client';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'New Attribute | Dashboard',
  description: 'Create a new product attribute',
};

export default async function NewAttributePage() {
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
                <div className="flex flex-col gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Attribute</h1>
                    <p className="text-muted-foreground">
                      Add a new product attribute like color or size
                    </p>
                  </div>

                  <AttributeNewClient />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
