/**
 * Role Request Detail Actions Component
 * 
 * Full actions for approving/rejecting/modifying a role request
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconX, IconMessageCircle, IconEdit } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { getPermissionsByCategory } from '@/lib/custom-role-permissions';

interface RoleRequestDetailActionsProps {
  requestId: string;
  requestedPermissions: string[];
}

export function RoleRequestDetailActions({ 
  requestId, 
  requestedPermissions 
}: RoleRequestDetailActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'modify' | 'approve-modified'>('approve');
  const [reason, setReason] = useState('');
  const [modifiedPermissions, setModifiedPermissions] = useState<string[]>(requestedPermissions);
  
  const permissionsByCategory = getPermissionsByCategory();
  
  const handleApprove = async (withModifications = false) => {
    if (withModifications) {
      setDialogType('approve-modified');
      setModifiedPermissions(requestedPermissions);
      setDialogOpen(true);
    } else {
      await performApprove();
    }
  };
  
  const performApprove = async (permissions?: string[]) => {
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (permissions && permissions.length > 0) {
        body.modifiedPermissions = permissions;
      }
      
      const response = await fetch(`/api/admin/role-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve');
      }
      
      toast.success('Role request approved successfully');
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setIsLoading(false);
    }
  };
  
  const performReject = async () => {
    if (!reason.trim() || reason.length < 10) {
      toast.error('Please provide a rejection reason (at least 10 characters)');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/role-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject');
      }
      
      toast.success('Role request rejected');
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };
  
  const performRequestModification = async () => {
    if (!reason.trim() || reason.length < 10) {
      toast.error('Please provide modification details (at least 10 characters)');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/role-requests/${requestId}/request-modification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reason }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request modification');
      }
      
      toast.success('Modification request sent to store owner');
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request modification');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDialogSubmit = () => {
    if (dialogType === 'reject') {
      performReject();
    } else if (dialogType === 'modify') {
      performRequestModification();
    } else if (dialogType === 'approve-modified') {
      performApprove(modifiedPermissions);
    }
  };
  
  const togglePermission = (permission: string) => {
    setModifiedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };
  
  return (
    <>
      <div className="space-y-3">
        <Button 
          className="w-full" 
          onClick={() => handleApprove(false)}
          disabled={isLoading}
        >
          <IconCheck className="h-4 w-4 mr-2" />
          Approve as Requested
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => handleApprove(true)}
          disabled={isLoading}
        >
          <IconEdit className="h-4 w-4 mr-2" />
          Approve with Modifications
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            setDialogType('modify');
            setReason('');
            setDialogOpen(true);
          }}
          disabled={isLoading}
        >
          <IconMessageCircle className="h-4 w-4 mr-2" />
          Request Changes
        </Button>
        
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={() => {
            setDialogType('reject');
            setReason('');
            setDialogOpen(true);
          }}
          disabled={isLoading}
        >
          <IconX className="h-4 w-4 mr-2" />
          Reject Request
        </Button>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={dialogType === 'approve-modified' ? 'max-w-2xl' : ''}>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'reject' && 'Reject Role Request'}
              {dialogType === 'modify' && 'Request Modifications'}
              {dialogType === 'approve-modified' && 'Approve with Modified Permissions'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'reject' && 'Please provide a reason for rejecting this role request.'}
              {dialogType === 'modify' && 'Describe what changes or additional information you need.'}
              {dialogType === 'approve-modified' && 'Select the permissions to include in the approved role.'}
            </DialogDescription>
          </DialogHeader>
          
          {(dialogType === 'reject' || dialogType === 'modify') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  {dialogType === 'reject' ? 'Rejection Reason' : 'Message to Store Owner'}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={
                    dialogType === 'reject'
                      ? 'Explain why this role request is being rejected...'
                      : 'Describe the changes or information needed...'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters required
                </p>
              </div>
            </div>
          )}
          
          {dialogType === 'approve-modified' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {modifiedPermissions.length} permissions selected
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModifiedPermissions(requestedPermissions)}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModifiedPermissions([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="font-medium mb-3">{category}</h4>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const isRequested = requestedPermissions.includes(perm.key);
                          const isSelected = modifiedPermissions.includes(perm.key);
                          
                          return (
                            <div
                              key={perm.key}
                              className={`flex items-start space-x-3 p-2 rounded-lg ${
                                isRequested ? 'bg-muted/50' : ''
                              }`}
                            >
                              <Checkbox
                                id={perm.key}
                                checked={isSelected}
                                onCheckedChange={() => togglePermission(perm.key)}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={perm.key}
                                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                >
                                  {perm.label}
                                  {isRequested && (
                                    <span className="text-xs text-muted-foreground">(requested)</span>
                                  )}
                                </label>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={dialogType === 'reject' ? 'destructive' : 'default'}
              onClick={handleDialogSubmit}
              disabled={
                isLoading || 
                ((dialogType === 'reject' || dialogType === 'modify') && reason.length < 10) ||
                (dialogType === 'approve-modified' && modifiedPermissions.length === 0)
              }
            >
              {isLoading ? 'Processing...' : 
                dialogType === 'reject' ? 'Reject' : 
                dialogType === 'modify' ? 'Send Request' :
                'Approve with Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
