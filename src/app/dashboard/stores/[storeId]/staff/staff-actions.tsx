/**
 * Staff Actions Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IconDotsVertical, 
  IconEdit, 
  IconTrash,
  IconUserOff,
  IconUserCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StaffActionsProps {
  staffId: string;
  storeId: string;
  currentRole: string | null;
  currentCustomRoleId: string | null | undefined;
  isActive: boolean;
  customRoles: { id: string; name: string; description: string | null }[];
}

const PREDEFINED_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
];

export function StaffActions({ 
  staffId, 
  storeId, 
  currentRole,
  currentCustomRoleId,
  isActive,
  customRoles,
}: StaffActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleType, setRoleType] = useState<'predefined' | 'custom'>(
    currentCustomRoleId ? 'custom' : 'predefined'
  );
  const [selectedRole, setSelectedRole] = useState(currentRole || 'MEMBER');
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState(currentCustomRoleId || '');
  
  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeId}/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update staff');
      }
      
      toast.success(isActive ? 'Staff member deactivated' : 'Staff member activated');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateRole = async () => {
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {};
      
      if (roleType === 'predefined') {
        body.role = selectedRole;
        body.customRoleId = null;
      } else {
        body.customRoleId = selectedCustomRoleId;
        body.role = null;
      }
      
      const response = await fetch(`/api/stores/${storeId}/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }
      
      toast.success('Role updated successfully');
      setEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeId}/staff/${staffId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove staff');
      }
      
      toast.success('Staff member removed');
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            {isLoading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconDotsVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <IconEdit className="h-4 w-4 mr-2" />
            Edit Role
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleToggleActive}>
            {isActive ? (
              <>
                <IconUserOff className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <IconUserCheck className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600"
          >
            <IconTrash className="h-4 w-4 mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Role</DialogTitle>
            <DialogDescription>
              Change the role assigned to this staff member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Type</Label>
              <Select 
                value={roleType} 
                onValueChange={(v) => setRoleType(v as 'predefined' | 'custom')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predefined">Predefined Role</SelectItem>
                  {customRoles.length > 0 && (
                    <SelectItem value="custom">Custom Role</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {roleType === 'predefined' ? (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Custom Role</Label>
                <Select 
                  value={selectedCustomRoleId} 
                  onValueChange={setSelectedCustomRoleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a custom role" />
                  </SelectTrigger>
                  <SelectContent>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this staff member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isLoading}
            >
              {isLoading ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
