// src/app/dashboard/products/new/page.tsx
// Product creation page

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProductForm } from '@/components/product-form';
import { AppSidebar } from "@/components/app-sidebar";
import ClientOnly from '@/components/ClientOnly'
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata = {
  title: 'Create Product | Dashboard',
  description: 'Create a new product',
};

export default async function NewProductPage() {
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
      <ClientOnly>
        <AppSidebar variant="inset" />
      </ClientOnly>
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                  <p className="text-muted-foreground">
                    Add a new product to your store catalog
                  </p>
                </div>

                <ProductForm />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
