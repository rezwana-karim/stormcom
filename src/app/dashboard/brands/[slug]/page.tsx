// src/app/dashboard/brands/[slug]/page.tsx
// Brand detail/edit page

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BrandService } from '@/lib/services/brand.service';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getCurrentStoreId } from '@/lib/get-current-user';
import { BrandFormClient } from '@/components/brand-form-client';

export default async function BrandDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const storeId = await getCurrentStoreId();
  if (!storeId) {
    redirect('/dashboard/brands');
  }

  const brandService = BrandService.getInstance();
  const brand = await brandService.getBrandBySlug(params.slug, storeId);

  if (!brand) {
    redirect('/dashboard/brands');
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <BrandFormClient
                  brand={brand}
                  _storeId={storeId}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
