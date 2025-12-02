/**
 * Invite Staff Dialog Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconUserPlus, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InviteStaffDialogProps {
  storeId: string;
  customRoles: { id: string; name: string; description: string | null }[];
}

const PREDEFINED_ROLES = [
  { value: 'ADMIN', label: 'Admin', description: 'Full store management access' },
  { value: 'MANAGER', label: 'Manager', description: 'Manage products, orders, and staff' },
  { value: 'MEMBER', label: 'Member', description: 'Standard staff access' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
];

export function InviteStaffDialog({ storeId, customRoles }: InviteStaffDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [roleType, setRoleType] = useState<'predefined' | 'custom'>('predefined');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (roleType === 'custom' && !selectedCustomRoleId) {
      toast.error('Please select a custom role');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const body: Record<string, string> = { email: email.trim() };
      
      if (roleType === 'predefined') {
        body.role = selectedRole;
      } else {
        body.customRoleId = selectedCustomRoleId;
      }
      
      const response = await fetch(`/api/stores/${storeId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      toast.success('Invitation sent successfully');
      setOpen(false);
      setEmail('');
      setRoleType('predefined');
      setSelectedRole('MEMBER');
      setSelectedCustomRoleId('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconUserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an invitation to add a new staff member to your store
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The user must have an approved account
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Role Type</Label>
              <Select value={roleType} onValueChange={(v) => setRoleType(v as 'predefined' | 'custom')}>
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
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {role.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Custom Role</Label>
                <Select value={selectedCustomRoleId} onValueChange={setSelectedCustomRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a custom role" />
                  </SelectTrigger>
                  <SelectContent>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
