/**
 * Super Admin Custom Roles Dashboard
 * 
 * Overview of custom roles across all stores
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  IconUserShield, 
  IconBuildingStore,
  IconShieldCheck,
  IconAlertTriangle,
  IconActivity,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Custom Roles Dashboard | Admin",
  description: "Manage custom roles across all stores",
};

async function getDashboardData() {
  // Get summary statistics
  const [
    totalCustomRoles,
    activeRoles,
    totalStoresWithRoles,
  ] = await Promise.all([
    prisma.customRole.count(),
    prisma.customRole.count({ where: { isActive: true } }),
    prisma.store.count({
      where: {
        customRoles: {
          some: {},
        },
      },
    }),
  ]);
  
  // Get top stores by role count
  const topStores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      customRoleLimit: true,
      subscriptionPlan: true,
      _count: {
        select: { customRoles: true },
      },
    },
    orderBy: {
      customRoles: {
        _count: "desc",
      },
    },
    take: 10,
  });
  
  // Get recent activity
  const recentActivity = await prisma.customRoleActivity.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
      store: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
  
  // Count stores at limit
  const storesAtLimit = topStores.filter(
    (s) => s._count.customRoles >= s.customRoleLimit
  ).length;
  
  return {
    summary: {
      totalCustomRoles,
      activeRoles,
      inactiveRoles: totalCustomRoles - activeRoles,
      storesWithRoles: totalStoresWithRoles,
      storesAtLimit,
    },
    topStores,
    recentActivity,
  };
}

export default async function AdminCustomRolesDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  // Check if user is Super Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });
  
  if (!user?.isSuperAdmin) {
    notFound();
  }
  
  const data = await getDashboardData();
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <IconUserShield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Custom Roles Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Monitor and manage custom roles across all stores
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/admin/custom-roles/stores">
            <Button variant="outline">
              <IconBuildingStore className="h-4 w-4 mr-2" />
              View All Stores
            </Button>
          </Link>
          <Link href="/admin/custom-roles/settings">
            <Button>
              Platform Settings
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Custom Roles</CardTitle>
            <IconUserShield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCustomRoles}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.activeRoles} active, {data.summary.inactiveRoles} inactive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stores with Roles</CardTitle>
            <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.storesWithRoles}</div>
            <p className="text-xs text-muted-foreground">
              Stores using custom roles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <IconShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeRoles}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>
        
        <Card className={data.summary.storesAtLimit > 0 ? "border-amber-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stores at Limit</CardTitle>
            <IconAlertTriangle className={`h-4 w-4 ${data.summary.storesAtLimit > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.storesAtLimit}</div>
            <p className="text-xs text-muted-foreground">
              May need limit increase
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Stores and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Stores */}
        <Card>
          <CardHeader>
            <CardTitle>Top Stores by Role Count</CardTitle>
            <CardDescription>
              Stores with the most custom roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topStores.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No stores have created custom roles yet.
                </p>
              ) : (
                data.topStores.map((store) => {
                  const isAtLimit = store._count.customRoles >= store.customRoleLimit;
                  
                  return (
                    <div
                      key={store.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <IconBuildingStore className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <Link 
                            href={`/admin/custom-roles/stores/${store.id}`}
                            className="font-medium hover:underline"
                          >
                            {store.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {store.subscriptionPlan}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={isAtLimit ? "destructive" : "secondary"}
                        >
                          {store._count.customRoles} / {store.customRoleLimit}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest custom role changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No recent activity.
                </p>
              ) : (
                data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <IconActivity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.actor?.name || "Unknown"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {formatAction(activity.action)}
                        </span>{" "}
                        <span className="font-medium">
                          {activity.roleName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.store?.name} • {format(new Date(activity.createdAt), "PPp")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    ROLE_CREATED: "created role",
    ROLE_UPDATED: "updated role",
    ROLE_DELETED: "deleted role",
    ROLE_DEACTIVATED: "deactivated role",
    ROLE_REACTIVATED: "reactivated role",
    PERMISSIONS_CHANGED: "changed permissions for",
    LIMIT_CHANGED: "changed limit for",
    ROLE_ASSIGNED: "assigned",
    ROLE_UNASSIGNED: "unassigned",
  };
  return actionMap[action] || action.toLowerCase().replace(/_/g, " ");
}
