'use client';

/**
 * Staff Management Interface
 * Complete interface for managing store staff with role assignments
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserPlus, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  Trash2,
  Loader2
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { CanAccess } from '@/components/can-access';

interface StaffMember {
  id: string;
  userId: string;
  storeId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  store: {
    id: string;
    name: string;
  };
}

interface StaffManagementProps {
  storeId: string;
}

const STAFF_ROLES = [
  { value: 'STORE_ADMIN', label: 'Store Admin', description: 'Full store management' },
  { value: 'SALES_MANAGER', label: 'Sales Manager', description: 'Sales team lead' },
  { value: 'SALES_STAFF', label: 'Sales Staff', description: 'Sales and orders' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager', description: 'Inventory lead' },
  { value: 'INVENTORY_STAFF', label: 'Inventory Staff', description: 'Stock management' },
  { value: 'CUSTOMER_SERVICE_MANAGER', label: 'Customer Service Manager', description: 'CS team lead' },
  { value: 'CUSTOMER_SERVICE_STAFF', label: 'Customer Service Staff', description: 'Customer support' },
];

export function StaffManagement({ storeId }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const { can: _can } = usePermissions();

  const loadStaff = async () => {
    try {
      const response = await fetch(`/api/store-staff?storeId=${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleAddStaff = async (email: string, role: string) => {
    try {
      const response = await fetch('/api/store-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, storeId, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to add staff member');
        return;
      }

      await loadStaff();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff member');
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const response = await fetch(`/api/store-staff/${staffId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove staff');
      await loadStaff();
    } catch (error) {
      console.error('Error removing staff:', error);
      alert('Failed to remove staff member');
    }
  };

  const handleUpdateRole = async (staffId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/store-staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      await loadStaff();
      setEditMember(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Store Staff</CardTitle>
            <CardDescription>Manage staff members and their roles</CardDescription>
          </div>
          <CanAccess permission="staff:create">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 size-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AddStaffDialog onSubmit={handleAddStaff} />
              </DialogContent>
            </Dialog>
          </CanAccess>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No staff members yet. Add your first staff member to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback>
                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.name || 'Unnamed User'}</div>
                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {STAFF_ROLES.find(r => r.value === member.role)?.label || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <CanAccess permission="staff:update">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditMember(member)}>
                            <Shield className="mr-2 size-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 size-4" />
                            Send Email
                          </DropdownMenuItem>
                          <CanAccess permission="staff:delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveStaff(member.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Remove
                            </DropdownMenuItem>
                          </CanAccess>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CanAccess>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Role Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {editMember?.user.name || editMember?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select
                defaultValue={editMember?.role}
                onValueChange={(role) => {
                  if (editMember) {
                    handleUpdateRole(editMember.id, role);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddStaffDialog({ 
  onSubmit 
}: { 
  onSubmit: (email: string, role: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SALES_STAFF');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, role);
      setEmail('');
      setRole('SALES_STAFF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogDescription>
          Invite a user to join your store staff. They must have an existing account.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((staffRole) => (
                <SelectItem key={staffRole.value} value={staffRole.value}>
                  <div>
                    <div className="font-medium">{staffRole.label}</div>
                    <div className="text-xs text-muted-foreground">{staffRole.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Add Staff Member
        </Button>
      </DialogFooter>
    </form>
  );
}
