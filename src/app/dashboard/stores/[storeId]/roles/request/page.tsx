/**
 * Request Custom Role Page
 * 
 * Form for store owners to request a new custom role
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { IconArrowLeft, IconUserShield } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { RequestRoleForm } from './request-role-form';

interface PageProps {
  params: Promise<{ storeId: string }>;
}

export const metadata: Metadata = {
  title: 'Request Custom Role | Store',
  description: 'Submit a request for a new custom role',
};

export default async function RequestRolePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  const { storeId } = await params;
  
  // Verify user is store owner via organization membership
  const ownerMembership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      role: 'OWNER',
      organization: {
        store: { id: storeId }
      }
    },
    include: {
      organization: {
        include: {
          store: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
  
  if (!ownerMembership?.organization?.store) {
    notFound();
  }
  
  const store = ownerMembership.organization.store;
  
  // Check existing custom roles count
  const existingRolesCount = await prisma.customRole.count({
    where: { storeId },
  });
  
  // Check pending requests count
  const pendingRequestsCount = await prisma.customRoleRequest.count({
    where: {
      storeId,
      status: { in: ['PENDING', 'INFO_REQUESTED'] },
    },
  });
  
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link href={`/dashboard/stores/${storeId}/roles`}>
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        </Link>
      </div>
      
      <div>
        <div className="flex items-center gap-2">
          <IconUserShield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Request Custom Role</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Submit a request for a new custom role for {store.name}
        </p>
      </div>
      
      {/* Limits Info */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>Current Usage:</strong> {existingRolesCount}/10 custom roles • 
          {pendingRequestsCount} pending requests
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          You can have up to 10 custom roles per store. Requests are reviewed by Super Admins.
        </p>
      </div>
      
      {/* Form */}
      {existingRolesCount >= 10 ? (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">
            Maximum Roles Reached
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            You have reached the maximum of 10 custom roles. 
            Please contact support if you need additional roles.
          </p>
        </div>
      ) : (
        <RequestRoleForm storeId={storeId} />
      )}
    </div>
  );
}
