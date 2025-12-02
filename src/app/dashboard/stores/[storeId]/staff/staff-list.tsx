/**
 * Staff List Component
 */

import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { 
  IconCheck, 
  IconClock, 
  IconX,
  IconUserShield,
  IconMail,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StaffActions } from './staff-actions';

interface StaffListProps {
  storeId: string;
  isOwner: boolean;
  statusFilter?: string;
  currentUserId: string;
  customRoles: { id: string; name: string; description: string | null }[];
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  VIEWER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export async function StaffList({ 
  storeId, 
  isOwner, 
  statusFilter,
  currentUserId,
  customRoles,
}: StaffListProps) {
  // Build where clause
  const where: Record<string, unknown> = { storeId };
  
  if (statusFilter === 'active') {
    where.isActive = true;
    where.acceptedAt = { not: null };
  } else if (statusFilter === 'inactive') {
    where.isActive = false;
  } else if (statusFilter === 'pending') {
    where.isActive = true;
    where.acceptedAt = null;
  }
  
  const staff = await prisma.storeStaff.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      customRole: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
    orderBy: [
      { isActive: 'desc' },
      { acceptedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  
  // Get store owner info via organization membership
  const ownerMembership = await prisma.membership.findFirst({
    where: {
      role: 'OWNER',
      organization: {
        store: { id: storeId }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
  
  const owner = ownerMembership?.user;
  
  if (staff.length === 0 && !owner) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconUsers className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Staff Members</h3>
          <p className="text-muted-foreground text-center mt-2 max-w-md">
            {isOwner 
              ? 'Start building your team by inviting staff members.'
              : 'No staff members have been added yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Counts
  const counts = {
    active: staff.filter(s => s.isActive && s.acceptedAt).length,
    pending: staff.filter(s => s.isActive && !s.acceptedAt).length,
    inactive: staff.filter(s => !s.isActive).length,
  };
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{counts.active + 1}</div>
            <p className="text-xs text-muted-foreground">Active Staff (including owner)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <p className="text-xs text-muted-foreground">Pending Invitations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{counts.inactive}</div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Owner Card */}
      {owner && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={owner.image || undefined} />
                  <AvatarFallback>
                    {owner.name?.[0] || owner.email?.[0] || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {owner.name || 'Store Owner'}
                    {owner.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <IconMail className="h-3 w-3" />
                    {owner.email}
                  </CardDescription>
                </div>
              </div>
              
              <Badge className={roleColors['OWNER']}>
                <IconUserShield className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}
      
      {/* Staff List */}
      <div className="space-y-3">
        {staff.map((member) => {
          const isPending = member.isActive && !member.acceptedAt;
          const isInactive = !member.isActive;
          const isCurrentUser = member.userId === currentUserId;
          
          let roleName = member.role || 'Staff';
          let roleClass = member.role ? roleColors[member.role] : roleColors['MEMBER'];
          
          if (member.customRole) {
            roleName = member.customRole.name;
            roleClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
          }
          
          return (
            <Card 
              key={member.id} 
              className={`${isInactive ? 'opacity-60' : ''} ${isPending ? 'border-dashed' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {member.user.name?.[0] || member.user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {member.user.name || 'Unknown'}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                        {isPending && (
                          <Badge variant="outline" className="text-xs">
                            <IconClock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {isInactive && (
                          <Badge variant="outline" className="text-xs text-red-600">
                            <IconX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <IconMail className="h-3 w-3" />
                        {member.user.email}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={roleClass}>
                      {roleName}
                    </Badge>
                    
                    {isOwner && !isCurrentUser && (
                      <StaffActions 
                        staffId={member.id}
                        storeId={storeId}
                        currentRole={member.role}
                        currentCustomRoleId={member.customRole?.id}
                        isActive={member.isActive}
                        customRoles={customRoles}
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {member.acceptedAt ? (
                    <span className="flex items-center gap-1">
                      <IconCheck className="h-3 w-3 text-green-600" />
                      Joined {formatDistanceToNow(new Date(member.acceptedAt), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <IconClock className="h-3 w-3" />
                      Invited {formatDistanceToNow(new Date(member.invitedAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function IconUsers(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
