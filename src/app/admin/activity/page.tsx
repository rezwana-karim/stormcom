/**
 * Admin Activity Page
 * 
 * Shows platform-wide activity feed.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Store, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Activity,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

async function getActivity() {
  return prisma.platformActivity.findMany({
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

const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  USER_REGISTERED: {
    icon: <UserPlus className="h-5 w-5" />,
    color: "text-blue-500 bg-blue-100",
    label: "User Registered",
  },
  USER_APPROVED: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-500 bg-green-100",
    label: "User Approved",
  },
  USER_REJECTED: {
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-500 bg-red-100",
    label: "User Rejected",
  },
  USER_SUSPENDED: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-orange-500 bg-orange-100",
    label: "User Suspended",
  },
  USER_UNSUSPENDED: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-500 bg-green-100",
    label: "User Reactivated",
  },
  STORE_CREATED: {
    icon: <Store className="h-5 w-5" />,
    color: "text-purple-500 bg-purple-100",
    label: "Store Created",
  },
};

async function ActivityContent() {
  const activities = await getActivity();

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Activity Yet</h3>
        <p className="text-muted-foreground">
          Platform activities will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = actionConfig[activity.action] || {
          icon: <Activity className="h-5 w-5" />,
          color: "text-gray-500 bg-gray-100",
          label: activity.action,
        };

        return (
          <div 
            key={activity.id} 
            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className={`p-2 rounded-full ${config.color}`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{config.label}</Badge>
                {activity.store && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {activity.store.name}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm">{activity.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {activity.actor && (
                  <span>
                    By: {activity.actor.name || activity.actor.email}
                  </span>
                )}
                {activity.targetUser && (
                  <span>
                    Target: {activity.targetUser.name || activity.targetUser.email}
                  </span>
                )}
                <span>
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminActivityPage() {
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
            Recent platform-wide activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <ActivitySkeleton key={i} />)}
            </div>
          }>
            <ActivityContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
