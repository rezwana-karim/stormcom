/**
 * Super Admin - Store Custom Roles Detail
 * 
 * View and manage custom roles for a specific store
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  IconBuildingStore,
  IconChevronLeft,
  IconUserShield,
  IconUsers,
  IconActivity,
  IconSettings,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { RoleLimitEditor } from "@/components/admin/role-limit-editor";

export const metadata: Metadata = {
  title: "Store Custom Roles | Admin",
  description: "Manage custom roles for a store",
};

interface PageProps {
  params: Promise<{ storeId: string }>;
}

async function getStoreData(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      customRoles: {
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true },
          },
          lastModifiedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { staffAssignments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      customRoleActivities: {
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
  
  if (!store) return null;
  
  const activeRoles = store.customRoles.filter((r) => r.isActive).length;
  const usagePercent = (store.customRoles.length / store.customRoleLimit) * 100;
  const totalStaffWithRoles = store.customRoles.reduce((sum, r) => sum + r._count.staffAssignments, 0);
  
  return {
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      subscriptionPlan: store.subscriptionPlan,
      customRoleLimit: store.customRoleLimit,
      owner: store.owner,
      createdAt: store.createdAt,
    },
    stats: {
      totalRoles: store.customRoles.length,
      activeRoles,
      inactiveRoles: store.customRoles.length - activeRoles,
      usagePercent,
      remainingSlots: store.customRoleLimit - store.customRoles.length,
      totalStaffWithRoles,
    },
    roles: store.customRoles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as unknown as string[],
      isActive: role.isActive,
      staffCount: role._count.staffAssignments,
      createdBy: role.createdByUser,
      createdAt: role.createdAt,
      lastModifiedBy: role.lastModifiedBy,
      lastModifiedAt: role.lastModifiedAt,
    })),
    activities: store.customRoleActivities.map((a) => ({
      id: a.id,
      action: a.action,
      roleName: a.roleName,
      changes: a.changes as Record<string, unknown> | null,
      actor: a.actor,
      createdAt: a.createdAt,
    })),
  };
}

export default async function AdminStoreCustomRolesPage({ params }: PageProps) {
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
  
  const { storeId } = await params;
  const data = await getStoreData(storeId);
  
  if (!data) {
    notFound();
  }
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link 
            href="/admin/custom-roles/stores" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <IconChevronLeft className="h-4 w-4" />
            Back to Stores
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <IconBuildingStore className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{data.store.name}</h1>
              <p className="text-muted-foreground">
                {data.store.slug} • {data.store.subscriptionPlan}
              </p>
            </div>
          </div>
        </div>
        
        <RoleLimitEditor 
          storeId={data.store.id}
          storeName={data.store.name}
          currentLimit={data.store.customRoleLimit}
          currentUsage={data.stats.totalRoles}
        />
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Usage</CardTitle>
            <IconUserShield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.totalRoles} / {data.store.customRoleLimit}
            </div>
            <Progress value={data.stats.usagePercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.remainingSlots} slots remaining
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Badge variant="default" className="h-5">{data.stats.activeRoles}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeRoles}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Roles</CardTitle>
            <Badge variant="secondary" className="h-5">{data.stats.inactiveRoles}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.inactiveRoles}</div>
            <p className="text-xs text-muted-foreground">
              Disabled roles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff with Roles</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalStaffWithRoles}</div>
            <p className="text-xs text-muted-foreground">
              Using custom roles
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for Roles and Activity */}
      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">
            <IconUserShield className="h-4 w-4 mr-2" />
            Custom Roles ({data.stats.totalRoles})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <IconActivity className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
              <CardDescription>
                All custom roles created for this store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.roles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No custom roles have been created for this store.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.roles.map((role) => (
                    <div 
                      key={role.id} 
                      className={`border rounded-lg p-4 ${!role.isActive ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            <Badge variant={role.isActive ? "default" : "secondary"}>
                              {role.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {role.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.permissions.slice(0, 5).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                            {role.permissions.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <IconUsers className="h-3 w-3" />
                            {role.staffCount} staff
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {format(new Date(role.createdAt), "PP")}
                          </p>
                          {role.createdBy && (
                            <p className="text-xs text-muted-foreground">
                              by {role.createdBy.name || role.createdBy.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent changes to custom roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <IconActivity className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.actor?.name || activity.actor?.email || "Unknown"}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {formatAction(activity.action)}
                          </span>{" "}
                          <span className="font-medium">{activity.roleName}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "PPp")}
                        </p>
                        {activity.changes && (
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(activity.changes, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Owner</dt>
              <dd className="font-medium">
                {data.store.owner?.name || data.store.owner?.email || "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Subscription Plan</dt>
              <dd className="font-medium">{data.store.subscriptionPlan}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Role Limit</dt>
              <dd className="font-medium">{data.store.customRoleLimit}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Created</dt>
              <dd className="font-medium">{format(new Date(data.store.createdAt), "PPP")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
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
