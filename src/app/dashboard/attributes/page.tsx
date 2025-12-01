// src/app/dashboard/attributes/page.tsx
// Attributes List Page

import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributesPageClient } from '@/components/attributes-page-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'Attributes | Dashboard',
  description: 'Manage product attributes',
};

export default async function AttributesPage() {
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
                    <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
                    <p className="text-muted-foreground">
                      Manage product attributes like color, size, and material
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Product Attributes</CardTitle>
                      <CardDescription>
                        Create and manage attributes that define product variations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AttributesPageClient />
                      </Suspense>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
