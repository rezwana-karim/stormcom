/**
 * Roles List Component for Store
 */

import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { IconCheck, IconUsers } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface RolesListProps {
  storeId: string;
  isOwner: boolean;
}

export async function RolesList({ storeId, isOwner }: RolesListProps) {
  const customRoles = await prisma.customRole.findMany({
    where: { storeId },
    include: {
      _count: {
        select: { staffAssignments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (customRoles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconUserShieldIcon className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Custom Roles</h3>
          <p className="text-muted-foreground text-center mt-2 max-w-md">
            {isOwner 
              ? 'You haven\'t created any custom roles yet. Request a custom role to define specific permissions for your staff.'
              : 'No custom roles have been created for this store yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {customRoles.map((role) => {
        let permissions: string[] = [];
        try {
          permissions = JSON.parse(role.permissions);
        } catch {
          permissions = [];
        }
        
        return (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {role.name}
                    {role.isActive && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <IconCheck className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  {role.description && (
                    <CardDescription className="mt-1">
                      {role.description}
                    </CardDescription>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <IconUsers className="h-4 w-4" />
                  <span className="text-sm">{role._count.staffAssignments}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                {permissions.slice(0, 6).map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm}
                  </Badge>
                ))}
                {permissions.length > 6 && (
                  <Badge variant="secondary" className="text-xs">
                    +{permissions.length - 6} more
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Created {format(new Date(role.createdAt), 'PPP')}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function IconUserShieldIcon(props: React.SVGProps<SVGSVGElement>) {
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
