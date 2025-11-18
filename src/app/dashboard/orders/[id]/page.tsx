/**
 * Order Detail Page - Server Component
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentStoreId } from '@/lib/get-current-user';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { OrderDetailClient } from '@/components/order-detail-client';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const storeId = await getCurrentStoreId();
  if (!storeId) redirect('/onboarding');

  const { id } = await params;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <OrderDetailClient orderId={id} storeId={storeId} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}