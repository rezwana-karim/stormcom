// src/app/dashboard/categories/new/page.tsx
// Create new category page

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

export const metadata = {
  title: 'New Category | Dashboard',
  description: 'Create a new product category',
};

export default async function NewCategoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const storeId = await getCurrentStoreId();
  if (!storeId) {
    redirect('/dashboard/categories');
  }

  const categoryService = CategoryService.getInstance();
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
