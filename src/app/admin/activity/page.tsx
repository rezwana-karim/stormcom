/**
 * Admin Activity Page
 * 
 * Shows platform-wide activity feed with filters and export.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { ActivityFilters } from "@/components/admin/activity-filters";
import { ActivityFeed } from "@/components/admin/activity-feed";

interface PageProps {
  searchParams: Promise<{
    action?: string;
    actor?: string;
    store?: string;
    from?: string;
    to?: string;
  }>;
}

async function getFilterOptions() {
  const [actors, stores] = await Promise.all([
    prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true, name: true, email: true },
      take: 100,
    }),
    prisma.store.findMany({
      select: { id: true, name: true },
      take: 100,
    }),
  ]);

  return { actors, stores };
}

async function getActivity(filters: {
  action?: string;
  actor?: string;
  store?: string;
  from?: string;
  to?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.actor) {
    where.actorId = filters.actor;
  }

  if (filters.store) {
    where.storeId = filters.store;
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      (where.createdAt as Record<string, Date>).gte = new Date(filters.from);
    }
    if (filters.to) {
      (where.createdAt as Record<string, Date>).lte = new Date(filters.to);
    }
  }

  return prisma.platformActivity.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { id: true, name: true, email: true, image: true } },
      targetUser: { select: { id: true, name: true, email: true } },
      store: { select: { id: true, name: true } },
    },
  });
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[300px]" />
        <Skeleton className="h-3 w-[100px]" />
      </div>
    </div>
  );
}

async function ActivityContent({ filters }: { filters: PageProps["searchParams"] }) {
  const resolvedFilters = await filters;
  const [activities, filterOptions] = await Promise.all([
    getActivity(resolvedFilters),
    getFilterOptions(),
  ]);

  return (
    <>
      <ActivityFilters 
        actorOptions={filterOptions.actors} 
        storeOptions={filterOptions.stores} 
      />
      
      <div className="mt-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Activity Found</h3>
            <p className="text-muted-foreground">
              {Object.values(resolvedFilters).some(Boolean) 
                ? "No activities match your filters"
                : "Platform activities will appear here"}
            </p>
          </div>
        ) : (
          <ActivityFeed activities={activities} />
        )}
      </div>
    </>
  );
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Activity</h1>
        <p className="text-muted-foreground">
          Track all user and store management activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>
            Recent platform-wide activities with filters and export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => <ActivitySkeleton key={i} />)}
            </div>
          }>
            <ActivityContent filters={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
