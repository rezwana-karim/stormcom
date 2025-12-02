/**
 * Pending Users Page
 * 
 * Lists all users with PENDING status awaiting approval.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingUsersList } from "@/components/admin/pending-users-list";

async function getPendingUsers() {
  return prisma.user.findMany({
    where: { accountStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      businessName: true,
      businessDescription: true,
      businessCategory: true,
      phoneNumber: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function PendingUsersContent() {
  const pendingUsers = await getPendingUsers();
  
  return <PendingUsersList users={pendingUsers} />;
}

export default async function PendingUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve new user registrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Users</CardTitle>
          <CardDescription>
            Users who have registered and are waiting for account approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          }>
            <PendingUsersContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
