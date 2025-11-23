/**
 * Reviews Management Page
 * 
 * Displays and manages product reviews with moderation capabilities.
 * 
 * @module app/dashboard/reviews/page
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReviewsList } from '@/components/reviews/reviews-list';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Reviews | Dashboard | StormCom',
  description: 'Manage product reviews and ratings',
};

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Moderate and manage customer product reviews
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ReviewsList />
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
