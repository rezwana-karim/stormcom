/**
 * Role Requests List Component
 */

import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { 
  IconClock, 
  IconCheck, 
  IconX, 
  IconAlertCircle,
  IconBan,
  IconChevronRight,
  IconBuildingStore,
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
import { RoleRequestActions } from './role-request-actions';

interface RoleRequestsListProps {
  status?: string;
  storeId?: string;
  page?: number;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: IconClock,
    variant: 'warning' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  INFO_REQUESTED: {
    label: 'Info Requested',
    icon: IconAlertCircle,
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  APPROVED: {
    label: 'Approved',
    icon: IconCheck,
    variant: 'success' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  REJECTED: {
    label: 'Rejected',
    icon: IconX,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: IconBan,
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  },
};

export async function RoleRequestsList({ status, storeId, page = 1 }: RoleRequestsListProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }
  
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  
  // Build where clause
  const where: Record<string, unknown> = {};
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (storeId) {
    where.storeId = storeId;
  }
  
  // Get role requests
  const [requests, totalCount] = await Promise.all([
    prisma.customRoleRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        store: {
          select: { id: true, name: true, slug: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
      skip,
      take: pageSize,
    }),
    prisma.customRoleRequest.count({ where }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconUserShield className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Role Requests</h3>
          <p className="text-muted-foreground text-center mt-2">
            {status && status !== 'all'
              ? `No ${status.toLowerCase().replace('_', ' ')} role requests found.`
              : 'No custom role requests have been submitted yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard 
          title="Pending" 
          count={requests.filter(r => r.status === 'PENDING').length}
        />
        <StatsCard 
          title="Info Requested" 
          count={requests.filter(r => r.status === 'INFO_REQUESTED').length}
        />
        <StatsCard 
          title="Approved" 
          count={requests.filter(r => r.status === 'APPROVED').length}
        />
        <StatsCard 
          title="Rejected" 
          count={requests.filter(r => r.status === 'REJECTED').length}
        />
      </div>
      
      {/* Request List */}
      <div className="space-y-3">
        {requests.map((request) => {
          const config = statusConfig[request.status as keyof typeof statusConfig];
          const StatusIcon = config?.icon || IconClock;
          let permissions: string[] = [];
          try {
            permissions = JSON.parse(request.permissions);
          } catch {
            permissions = [];
          }
          
          return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg">
                        {request.roleName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <IconBuildingStore className="h-3.5 w-3.5" />
                        {request.store.name}
                        <span className="text-muted-foreground">•</span>
                        <span>by {request.user.name || request.user.email}</span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge className={config?.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config?.label || request.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {request.roleDescription && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {request.roleDescription}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {permissions.slice(0, 5).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                  {permissions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{permissions.length - 5} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    {request.reviewer && (
                      <> • Reviewed by {request.reviewer.name || request.reviewer.email}</>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {(request.status === 'PENDING' || request.status === 'INFO_REQUESTED') && (
                      <RoleRequestActions requestId={request.id} />
                    )}
                    
                    <Link href={`/admin/roles/requests/${request.id}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                        <IconChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link href={`/admin/roles/requests?page=${Math.max(1, page - 1)}${status ? `&status=${status}` : ''}`}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              Previous
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link href={`/admin/roles/requests?page=${Math.min(totalPages, page + 1)}${status ? `&status=${status}` : ''}`}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, count }: { title: string; count: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function IconUserShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" />
      <path d="M2 22v-2a4 4 0 0 1 4-4h4" />
      <path d="M14 22V12l4-2 4 2v10" />
      <path d="M18 15v2" />
    </svg>
  );
}
