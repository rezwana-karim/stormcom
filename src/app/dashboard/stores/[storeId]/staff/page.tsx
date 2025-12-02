/**
 * Store Staff Management Page
 * 
 * Lists and manages staff members for a store
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  IconUsers,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffList } from './staff-list';
import { InviteStaffDialog } from './invite-staff-dialog';

interface PageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string }>;
}

export const metadata: Metadata = {
  title: 'Staff Management | Store',
  description: 'Manage staff members and their roles',
};

export default async function StoreStaffPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  const { storeId } = await params;
  const { status } = await searchParams;
  
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
  
  // Check if user is admin via store staff if not owner
  let hasAccess = isOwner;
  if (!isOwner) {
    const staffAccess = await prisma.storeStaff.findFirst({
      where: {
        userId: session.user.id,
        storeId,
        isActive: true,
        role: 'ADMIN',
      },
    });
    hasAccess = !!staffAccess;
  }
  
  if (!hasAccess) {
    notFound();
  }
  
  // Get store details
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { 
      id: true, 
      name: true, 
      _count: {
        select: { staff: true },
      },
    },
  });
  
  if (!store) {
    notFound();
  }
  
  // Get custom roles for invite dialog
  const customRoles = await prisma.customRole.findMany({
    where: { 
      storeId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
  
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
            <IconUsers className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage staff members for {store.name}
          </p>
        </div>
        
        {isOwner && (
          <InviteStaffDialog storeId={storeId} customRoles={customRoles} />
        )}
      </div>
      
      {/* Staff List */}
      <Suspense fallback={<StaffListSkeleton />}>
        <StaffList 
          storeId={storeId} 
          isOwner={isOwner}
          statusFilter={status}
          currentUserId={session.user.id}
          customRoles={customRoles}
        />
      </Suspense>
    </div>
  );
}

function StaffListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
