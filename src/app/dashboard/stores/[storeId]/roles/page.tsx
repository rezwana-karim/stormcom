/**
 * Store Roles Page
 * 
 * Lists custom roles and allows store owners to create or request new ones
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  IconUserShield, 
  IconPlus,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RolesList } from './roles-list';
import { RoleRequestsList } from './role-requests-list';
import { RoleUsageIndicator } from '@/components/store/roles/role-usage-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export const metadata: Metadata = {
  title: 'Roles & Permissions | Store',
  description: 'Manage custom roles and permissions for your store',
};

export default async function StoreRolesPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  const { storeId } = await params;
  const { tab } = await searchParams;
  
  // Check if user is owner via organization membership
  const ownerMembership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      role: 'OWNER',
      organization: {
        store: { id: storeId }
      }
    },
  });
  
  const isOwner = !!ownerMembership;
  
  // Check store staff access if not owner
  let hasAccess = isOwner;
  if (!isOwner) {
    const staffAccess = await prisma.storeStaff.findFirst({
      where: {
        userId: session.user.id,
        storeId,
        isActive: true,
      },
    });
    hasAccess = !!staffAccess;
  }
  
  if (!hasAccess) {
    notFound();
  }
  
  // Get store details with role count
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { 
      id: true, 
      name: true,
      customRoleLimit: true,
      _count: {
        select: { customRoles: true },
      },
    },
  });
  
  if (!store) {
    notFound();
  }
  
  const usage = {
    current: store._count.customRoles,
    limit: store.customRoleLimit,
    remaining: Math.max(0, store.customRoleLimit - store._count.customRoles),
  };
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/stores" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <IconArrowLeft className="h-4 w-4 mr-1" />
            Back to stores
          </Link>
          <div className="flex items-center gap-2">
            <IconUserShield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage custom roles for {store.name}
          </p>
        </div>
        
        {isOwner && usage.remaining > 0 && (
          <Link href={`/dashboard/stores/${storeId}/roles/create`}>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Custom Role
            </Button>
          </Link>
        )}
      </div>
      
      {/* Usage Indicator */}
      {isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleUsageIndicator 
              current={usage.current} 
              limit={usage.limit} 
            />
          </CardContent>
        </Card>
      )}
      
      {/* Tabs */}
      <Tabs defaultValue={tab || 'roles'} className="w-full">
        <TabsList>
          <TabsTrigger value="roles">Custom Roles</TabsTrigger>
          <TabsTrigger value="requests">Role Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="mt-6">
          <Suspense fallback={<RolesListSkeleton />}>
            <RolesList storeId={storeId} isOwner={isOwner} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <Suspense fallback={<RolesListSkeleton />}>
            <RoleRequestsList storeId={storeId} userId={session.user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RolesListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
