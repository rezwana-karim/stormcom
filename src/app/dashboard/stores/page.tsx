/**
 * Stores Management Page
 * 
 * Lists all stores with pagination, search, and filters.
 * Provides store creation and edit dialogs.
 * 
 * @module app/dashboard/stores/page
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StoresList } from '@/components/stores/stores-list';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Stores Management | StormCom',
  description: 'Manage your stores and subscriptions',
};

export default async function StoresPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground mt-2">
            Manage your stores and subscription plans
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <StoresList />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="border rounded-lg">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
