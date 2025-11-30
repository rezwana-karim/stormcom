/**
 * Super Admin Dashboard Page
 * 
 * Overview of platform statistics, pending approvals, and recent activity.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Store, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";
import Link from "next/link";

async function getAdminStats() {
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    suspendedUsers,
    totalStores,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: 'PENDING' } }),
    prisma.user.count({ where: { accountStatus: 'APPROVED' } }),
    prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
    prisma.store.count(),
    prisma.platformActivity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { name: true, email: true } },
        targetUser: { select: { name: true, email: true } },
        store: { select: { name: true } },
      },
    }),
  ]);

  // Get recent registrations (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRegistrations = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  return {
    totalUsers,
    pendingUsers,
    approvedUsers,
    suspendedUsers,
    totalStores,
    recentRegistrations,
    recentActivity,
  };
}

async function getPendingUsers() {
  return prisma.user.findMany({
    where: { accountStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px]" />
        <Skeleton className="h-3 w-[120px] mt-1" />
      </CardContent>
    </Card>
  );
}

async function StatsCards() {
  const stats = await getAdminStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.recentRegistrations} this week
          </p>
        </CardContent>
      </Card>

      <Card className={stats.pendingUsers > 0 ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingUsers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingUsers > 0 ? "Awaiting review" : "All caught up!"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalStores}</div>
          <p className="text-xs text-muted-foreground">
            Running on platform
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvedUsers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.suspendedUsers > 0 && `${stats.suspendedUsers} suspended`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function PendingUsersCard() {
  const pendingUsers = await getPendingUsers();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Users waiting for account review</CardDescription>
          </div>
          <Link href="/admin/users/pending">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="space-y-1">
                  <p className="font-medium">{user.name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.businessName && (
                    <p className="text-xs text-muted-foreground">
                      Business: {user.businessName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Pending
                  </Badge>
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function RecentActivityCard() {
  const stats = await getAdminStats();

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'USER_REGISTERED':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'USER_APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'USER_REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'USER_SUSPENDED':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'STORE_CREATED':
        return <Store className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </div>
          <Link href="/admin/activity">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {stats.recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                {getActivityIcon(activity.action)}
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.actor?.name || activity.actor?.email || 'System'}
                    {' · '}
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      }>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-[300px]" /></CardContent></Card>}>
          <PendingUsersCard />
        </Suspense>

        <Suspense fallback={<Card><CardContent className="p-6"><Skeleton className="h-[300px]" /></CardContent></Card>}>
          <RecentActivityCard />
        </Suspense>
      </div>
    </div>
  );
}
