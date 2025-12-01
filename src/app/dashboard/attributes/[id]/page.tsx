// src/app/dashboard/attributes/[id]/page.tsx
// Edit Attribute Page

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributeEditClient } from '@/components/attribute-edit-client';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'Edit Attribute | Dashboard',
  description: 'Edit product attribute',
};

export default async function EditAttributePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

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
                    <h1 className="text-3xl font-bold tracking-tight">Edit Attribute</h1>
                    <p className="text-muted-foreground">
                      Update attribute details and values
                    </p>
                  </div>

                  <AttributeEditClient id={id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
