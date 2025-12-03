/**
 * Products Page Loading State
 * 
 * Shows skeleton UI while products data is being fetched.
 * Improves perceived performance with Next.js 16 streaming.
 */

import { TableSkeleton } from '@/components/ui/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <TableSkeleton rows={10} columns={6} showHeader />
    </div>
  );
}
