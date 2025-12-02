/**
 * Admin Role Request Detail Page
 * 
 * View and manage a specific custom role request
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { format } from 'date-fns';
import { 
  IconArrowLeft,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconBan,
  IconBuildingStore,
  IconUser,
  IconShieldCheck,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleRequestDetailActions } from './role-request-detail-actions';
import { getPermissionsByCategory } from '@/lib/custom-role-permissions';

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusConfig = {
  PENDING: {
    label: 'Pending Review',
    icon: IconClock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    description: 'This request is awaiting your review.',
  },
  INFO_REQUESTED: {
    label: 'Info Requested',
    icon: IconAlertCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Additional information has been requested from the store owner.',
  },
  APPROVED: {
    label: 'Approved',
    icon: IconCheck,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    description: 'This role has been approved and created.',
  },
  REJECTED: {
    label: 'Rejected',
    icon: IconX,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    description: 'This request has been rejected.',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: IconBan,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    description: 'This request was cancelled by the store owner.',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const request = await prisma.customRoleRequest.findUnique({
    where: { id },
    select: { roleName: true },
  });
  
  return {
    title: request ? `${request.roleName} | Role Request` : 'Role Request',
    description: 'Review custom role request details',
  };
}

export default async function RoleRequestDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  const { id } = await params;
  
  const request = await prisma.customRoleRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: { 
          id: true, 
          name: true, 
          email: true, 
          image: true,
          createdAt: true,
        },
      },
      store: {
        select: { 
          id: true, 
          name: true, 
          slug: true,
          createdAt: true,
          _count: {
            select: { staff: true },
          },
        },
      },
      reviewer: {
        select: { id: true, name: true, email: true },
      },
      customRole: {
        select: {
          id: true,
          name: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { staffAssignments: true },
          },
        },
      },
    },
  });
  
  if (!request) {
    notFound();
  }
  
  const config = statusConfig[request.status as keyof typeof statusConfig];
  const StatusIcon = config?.icon || IconClock;
  
  // Parse permissions
  let requestedPermissions: string[] = [];
  try {
    requestedPermissions = JSON.parse(request.permissions);
  } catch {
    requestedPermissions = [];
  }
  
  let approvedPermissions: string[] = [];
  if (request.customRole) {
    try {
      approvedPermissions = JSON.parse(request.customRole.permissions);
    } catch {
      approvedPermissions = [];
    }
  }
  
  // Group permissions by category
  const permissionsByCategory = getPermissionsByCategory();
  
  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <div>
        <Link href="/admin/roles/requests">
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Role Requests
          </Button>
        </Link>
      </div>
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{request.roleName}</h1>
          <p className="text-muted-foreground mt-1">
            Custom role request for {request.store.name}
          </p>
        </div>
        
        <Badge className={`${config?.className} h-fit`}>
          <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
          {config?.label || request.status}
        </Badge>
      </div>
      
      {/* Status Alert */}
      {config?.description && (
        <div className={`p-4 rounded-lg ${config.className}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            <span className="font-medium">{config.description}</span>
          </div>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Request Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>Information about the requested custom role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                <p className="text-lg font-semibold">{request.roleName}</p>
              </div>
              
              {request.roleDescription && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{request.roleDescription}</p>
                </div>
              )}
              
              {request.justification && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Justification</label>
                  <p className="text-sm">{request.justification}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Requested Permissions ({requestedPermissions.length})
                </label>
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => {
                    const categoryPerms = requestedPermissions.filter(p => 
                      perms.some(cp => cp.key === p)
                    );
                    
                    if (categoryPerms.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium mb-2">{category}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {categoryPerms.map(perm => {
                            const permInfo = perms.find(p => p.key === perm);
                            return (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {permInfo?.label || perm}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Review History */}
          {(request.reviewedAt || request.rejectionReason || request.adminNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.reviewer && request.reviewedAt && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {request.reviewer.name?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {request.reviewer.name || request.reviewer.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reviewed on {format(new Date(request.reviewedAt), 'PPP p')}
                      </p>
                    </div>
                  </div>
                )}
                
                {request.rejectionReason && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <label className="text-sm font-medium text-red-800 dark:text-red-400">
                      Rejection Reason
                    </label>
                    <p className="text-sm mt-1">{request.rejectionReason}</p>
                  </div>
                )}
                
                {request.adminNotes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <label className="text-sm font-medium">Admin Notes</label>
                    <p className="text-sm mt-1">{request.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Created Role Info */}
          {request.customRole && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShieldCheck className="h-5 w-5 text-green-600" />
                  Created Custom Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{request.customRole.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {approvedPermissions.length} permissions • 
                      {request.customRole._count.staffAssignments} staff assigned
                    </p>
                  </div>
                  <Badge variant={request.customRole.isActive ? 'default' : 'secondary'}>
                    {request.customRole.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          {(request.status === 'PENDING' || request.status === 'INFO_REQUESTED') && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <RoleRequestDetailActions 
                  requestId={request.id}
                  requestedPermissions={requestedPermissions}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Store Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuildingStore className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Store Name</label>
                <p className="font-medium">{request.store.name}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Slug</label>
                <p className="text-sm font-mono">{request.store.slug}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Staff Members</label>
                <p className="text-sm">{request.store._count.staff}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Created</label>
                <p className="text-sm">{format(new Date(request.store.createdAt), 'PPP')}</p>
              </div>
              
              <Link href={`/admin/stores/${request.store.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Store
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Requester Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.user.image || undefined} />
                  <AvatarFallback>
                    {request.user.name?.[0] || request.user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.user.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{request.user.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Member Since</label>
                <p className="text-sm">{format(new Date(request.user.createdAt), 'PPP')}</p>
              </div>
              
              <Link href={`/admin/users/${request.user.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View User
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TimelineItem
                  title="Request Submitted"
                  date={request.createdAt}
                  isFirst
                />
                {request.reviewedAt && (
                  <TimelineItem
                    title={`Request ${request.status === 'APPROVED' ? 'Approved' : request.status === 'REJECTED' ? 'Rejected' : 'Updated'}`}
                    date={request.reviewedAt}
                  />
                )}
                {request.customRole && (
                  <TimelineItem
                    title="Custom Role Created"
                    date={request.customRole.createdAt}
                    isLast
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ 
  title, 
  date, 
  isLast 
}: { 
  title: string; 
  date: Date | string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        {!isLast && <div className="flex-1 w-px bg-border" />}
      </div>
      <div className={isLast ? '' : 'pb-3'}>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(date), 'PPP p')}
        </p>
      </div>
    </div>
  );
}
