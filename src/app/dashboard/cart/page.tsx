import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CartList } from '@/components/cart/cart-list';
import { CartProvider } from '@/contexts/cart-context';
import type { Metadata } from 'next';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'View and manage your shopping cart',
};

// TODO: Get actual storeId from user's organization/store
const STORE_ID = 'default-store-id';

export default async function CartPage() {
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
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Shopping Cart</h2>
                  </div>
                  <CartProvider storeId={STORE_ID}>
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    }>
                      <CartList />
                    </Suspense>
                  </CartProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
