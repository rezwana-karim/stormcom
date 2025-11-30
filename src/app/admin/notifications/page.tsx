/**
 * Admin Notifications Page
 * 
 * View and manage platform-wide notifications.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  UserPlus,
  Store,
  AlertTriangle,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NotificationsList } from "@/components/admin/notifications-list";

async function getNotifications() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // Get admin's notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Get platform stats for context
  const pendingUsersCount = await prisma.user.count({
    where: { accountStatus: 'PENDING' },
  });

  return {
    notifications,
    unreadCount,
    pendingUsersCount,
  };
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function NotificationsContent() {
  const data = await getNotifications();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              Unread Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="size-4 text-amber-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingUsersCount}</div>
            {data.pendingUsersCount > 0 && (
              <a href="/admin/users/pending" className="text-xs text-primary hover:underline">
                Review now →
              </a>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="size-4 text-muted-foreground" />
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.notifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <NotificationsList notifications={data.notifications} />
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          View and manage your notifications
        </p>
      </div>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent />
      </Suspense>
    </div>
  );
}
