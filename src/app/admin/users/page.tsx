/**
 * All Users Admin Page
 * 
 * Lists all users in the system with filters and management actions.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersDataTable } from "@/components/admin/users-data-table";

async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isSuperAdmin: true,
      accountStatus: true,
      businessName: true,
      businessCategory: true,
      phoneNumber: true,
      emailVerified: true,
      createdAt: true,
      approvedAt: true,
      storeStaff: {
        where: { isActive: true },
        select: {
          store: { select: { id: true, name: true } },
          role: true,
        },
        take: 1,
      },
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function UsersContent() {
  const users = await getAllUsers();
  
  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isSuperAdmin: user.isSuperAdmin,
    accountStatus: user.accountStatus,
    businessName: user.businessName,
    businessCategory: user.businessCategory,
    phoneNumber: user.phoneNumber,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    approvedAt: user.approvedAt?.toISOString() || null,
    store: user.storeStaff[0]?.store || null,
    storeRole: user.storeStaff[0]?.role || null,
    organizationCount: user._count.memberships,
  }));
  
  return <UsersDataTable users={formattedUsers} />;
}

export default async function AllUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground">
          Manage all users on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View, filter, and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          }>
            <UsersContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
