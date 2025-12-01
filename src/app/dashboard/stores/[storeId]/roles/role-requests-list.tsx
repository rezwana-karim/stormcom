/**
 * Role Requests List Component for Store
 */

import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { 
  IconClock, 
  IconCheck, 
  IconX, 
  IconAlertCircle,
  IconBan,
  IconChevronRight,
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

interface RoleRequestsListProps {
  storeId: string;
  userId: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pending Review',
    icon: IconClock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    description: 'Waiting for Super Admin approval',
  },
  INFO_REQUESTED: {
    label: 'Changes Requested',
    icon: IconAlertCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Admin requested additional information',
  },
  APPROVED: {
    label: 'Approved',
    icon: IconCheck,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    description: 'Role has been created',
  },
  REJECTED: {
    label: 'Rejected',
    icon: IconX,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    description: 'Request was denied',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: IconBan,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    description: 'Request was cancelled',
  },
};

export async function RoleRequestsList({ storeId, userId }: RoleRequestsListProps) {
  const requests = await prisma.customRoleRequest.findMany({
    where: { 
      storeId,
      userId,
    },
    include: {
      customRole: {
        select: { id: true, name: true, isActive: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Role Requests</h3>
          <p className="text-muted-foreground text-center mt-2 max-w-md">
            You haven&apos;t submitted any custom role requests yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const config = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.PENDING;
        const StatusIcon = config.icon;
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
                <div>
                  <CardTitle className="text-lg">{request.roleName}</CardTitle>
                  {request.roleDescription && (
                    <CardDescription className="mt-1">
                      {request.roleDescription}
                    </CardDescription>
                  )}
                </div>
                
                <Badge className={config?.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config?.label || request.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {config?.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {config.description}
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
              
              {request.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400">
                    Rejection Reason:
                  </p>
                  <p className="text-sm">{request.rejectionReason}</p>
                </div>
              )}
              
              {request.adminNotes && request.status === 'INFO_REQUESTED' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                    Admin Message:
                  </p>
                  <p className="text-sm">{request.adminNotes}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
                
                {request.status === 'INFO_REQUESTED' && (
                  <Link href={`/dashboard/stores/${storeId}/roles/requests/${request.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Update Request
                      <IconChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )}
                
                {request.customRole && (
                  <Badge variant="default">
                    <IconCheck className="h-3 w-3 mr-1" />
                    Role Created
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function IconClipboardList(props: React.SVGProps<SVGSVGElement>) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
