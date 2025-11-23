/**
 * Analytics Dashboard Page
 * 
 * Displays comprehensive business analytics including revenue, sales, 
 * top products, and customer metrics with interactive charts.
 * 
 * @module app/dashboard/analytics/page
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Analytics | Dashboard | StormCom',
  description: 'Business analytics and insights',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your business performance and growth
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-96 col-span-4" />
        <Skeleton className="h-96 col-span-3" />
      </div>
    </div>
  );
}
