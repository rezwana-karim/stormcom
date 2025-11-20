// src/app/dashboard/categories/[slug]/page.tsx
// Category detail/edit page

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CategoryService } from '@/lib/services/category.service';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getCurrentStoreId } from '@/lib/get-current-user';
import { CategoryFormClient } from '@/components/category-form-client';

export default async function CategoryDetailPage({
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
    redirect('/dashboard/categories');
  }

  const categoryService = CategoryService.getInstance();
  const category = await categoryService.getCategoryBySlug(params.slug, storeId);

  if (!category) {
    redirect('/dashboard/categories');
  }

  // Get all categories for parent selection (excluding this category and its descendants)
  const { categories: allCategories } = await categoryService.getCategories(
    storeId,
    {},
    1,
    100
  );

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
                <CategoryFormClient
                  category={category}
                  allCategories={allCategories}
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
