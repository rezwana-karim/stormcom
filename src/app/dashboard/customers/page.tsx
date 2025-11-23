/**
 * Customers Dashboard Page
 * 
 * Displays customer list with CRUD operations, search, and filters.
 * 
 * @module app/dashboard/customers/page
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CustomersList } from '@/components/customers/customers-list';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Customers | Dashboard | StormCom',
  description: 'Manage your customers',
};

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your customer base
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CustomersList />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
