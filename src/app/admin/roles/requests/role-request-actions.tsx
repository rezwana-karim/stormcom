/**
 * Role Request Actions Component
 * 
 * Quick actions for approving/rejecting role requests
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconX, IconMessageCircle } from '@tabler/icons-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RoleRequestActionsProps {
  requestId: string;
}

export function RoleRequestActions({ requestId }: RoleRequestActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'modify'>('approve');
  const [reason, setReason] = useState('');
  
  const handleAction = async (action: 'approve' | 'reject' | 'modify') => {
    if (action === 'approve') {
      // Direct approve
      await performApprove();
    } else {
      // Show dialog for reject/modify
      setDialogType(action);
      setReason('');
      setDialogOpen(true);
    }
  };
  
  const performApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/role-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve');
      }
      
      toast.success('Role request approved');
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
      
      toast.success('Modification request sent');
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
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAction('approve')}>
            <IconCheck className="h-4 w-4 mr-2 text-green-600" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('modify')}>
            <IconMessageCircle className="h-4 w-4 mr-2 text-blue-600" />
            Request Changes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleAction('reject')}
            className="text-red-600"
          >
            <IconX className="h-4 w-4 mr-2" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'reject' ? 'Reject Role Request' : 'Request Modifications'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'reject'
                ? 'Please provide a reason for rejecting this role request.'
                : 'Describe what changes or additional information you need from the store owner.'}
            </DialogDescription>
          </DialogHeader>
          
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
              disabled={isLoading || reason.length < 10}
            >
              {isLoading ? 'Processing...' : dialogType === 'reject' ? 'Reject' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
