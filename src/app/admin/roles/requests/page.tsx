/**
 * Admin Role Requests Page
 * 
 * Lists all custom role requests for Super Admin review
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { RoleRequestsList } from './role-requests-list';
import { RoleRequestsHeader } from './role-requests-header';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Role Requests | Admin',
  description: 'Review and manage custom role requests from store owners',
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    storeId?: string;
    page?: string;
  }>;
}

export default async function RoleRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  return (
    <div className="flex flex-col gap-6">
      <RoleRequestsHeader />
      
      <Suspense fallback={<RoleRequestsListSkeleton />}>
        <RoleRequestsList 
          status={params.status}
          storeId={params.storeId}
          page={params.page ? parseInt(params.page) : 1}
        />
      </Suspense>
    </div>
  );
}

function RoleRequestsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
