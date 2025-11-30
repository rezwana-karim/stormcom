/**
 * Admin Store Creation Page
 * 
 * Create a new store for an approved user.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateStoreForm } from "@/components/admin/create-store-form";

interface CreateStorePageProps {
  searchParams: Promise<{ userId?: string }>;
}

async function getApprovedUsers() {
  return prisma.user.findMany({
    where: {
      accountStatus: 'APPROVED',
      // Exclude users who already have a store
      storeStaff: { none: {} },
    },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      businessCategory: true,
    },
    orderBy: { name: 'asc' },
  });
}

async function getUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      businessCategory: true,
      businessDescription: true,
      phoneNumber: true,
      accountStatus: true,
      storeStaff: {
        select: { store: { select: { name: true } } },
        take: 1,
      },
    },
  });
}

async function CreateStoreContent({ userId }: { userId?: string }) {
  const [approvedUsers, selectedUser] = await Promise.all([
    getApprovedUsers(),
    userId ? getUser(userId) : null,
  ]);

  if (userId && !selectedUser) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  if (selectedUser && selectedUser.accountStatus !== 'APPROVED') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">User must be approved before creating a store</p>
      </div>
    );
  }

  if (selectedUser && selectedUser.storeStaff.length > 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          User already has a store: {selectedUser.storeStaff[0].store.name}
        </p>
      </div>
    );
  }

  return (
    <CreateStoreForm 
      approvedUsers={approvedUsers} 
      selectedUser={selectedUser || undefined}
    />
  );
}

export default async function CreateStorePage({ searchParams }: CreateStorePageProps) {
  const params = await searchParams;
  const userId = params.userId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Store</h1>
        <p className="text-muted-foreground">
          Create a new store for an approved user
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Details</CardTitle>
          <CardDescription>
            Fill in the store information. The user will be assigned as the store owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          }>
            <CreateStoreContent userId={userId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
