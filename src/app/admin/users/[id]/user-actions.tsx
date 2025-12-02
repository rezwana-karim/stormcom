/**
 * User Actions Component
 * 
 * Client component for user management actions (approve, reject, suspend, etc.)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Ban,
  UserCheck,
  Loader2,
  Store,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  accountStatus: string;
  isSuperAdmin: boolean;
}

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'suspend' | 'unsuspend' | null>(null);
  const [reason, setReason] = useState("");

  const handleAction = async () => {
    if (!dialogType) return;
    
    setLoading(true);
    try {
      let endpoint = "";
      let method = "POST";
      let body: Record<string, unknown> = {};

      switch (dialogType) {
        case 'approve':
          endpoint = `/api/admin/users/${user.id}/approve`;
          break;
        case 'reject':
          endpoint = `/api/admin/users/${user.id}/reject`;
          body = { reason };
          break;
        case 'suspend':
          endpoint = `/api/admin/users/${user.id}/suspend`;
          body = { reason };
          break;
        case 'unsuspend':
          endpoint = `/api/admin/users/${user.id}/suspend`;
          method = "DELETE";
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'DELETE' ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      toast.success(
        dialogType === 'approve' ? 'User approved successfully' :
        dialogType === 'reject' ? 'User rejected' :
        dialogType === 'suspend' ? 'User suspended' :
        'User reactivated'
      );
      
      setDialogOpen(false);
      setDialogType(null);
      setReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (type: 'approve' | 'reject' | 'suspend' | 'unsuspend') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  // Don't show actions for super admins
  if (user.isSuperAdmin) {
    return (
      <Button variant="outline" disabled>
        Super Admin
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Actions
            <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user.accountStatus === 'PENDING' && (
            <>
              <DropdownMenuItem onClick={() => openDialog('approve')}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Approve User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog('reject')}>
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                Reject User
              </DropdownMenuItem>
            </>
          )}
          
          {user.accountStatus === 'APPROVED' && (
            <>
              <DropdownMenuItem asChild>
                <a href={`/admin/stores/create?userId=${user.id}`}>
                  <Store className="mr-2 h-4 w-4 text-purple-500" />
                  Create Store
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openDialog('suspend')}>
                <Ban className="mr-2 h-4 w-4 text-orange-500" />
                Suspend User
              </DropdownMenuItem>
            </>
          )}

          {user.accountStatus === 'SUSPENDED' && (
            <DropdownMenuItem onClick={() => openDialog('unsuspend')}>
              <UserCheck className="mr-2 h-4 w-4 text-green-500" />
              Reactivate User
            </DropdownMenuItem>
          )}

          {user.accountStatus === 'REJECTED' && (
            <DropdownMenuItem onClick={() => openDialog('approve')}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Approve User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'approve' && 'Approve User'}
              {dialogType === 'reject' && 'Reject User'}
              {dialogType === 'suspend' && 'Suspend User'}
              {dialogType === 'unsuspend' && 'Reactivate User'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve' && 
                `Are you sure you want to approve ${user.name || user.email}? They will be able to have a store created for them.`}
              {dialogType === 'reject' && 
                `Please provide a reason for rejecting ${user.name || user.email}'s application.`}
              {dialogType === 'suspend' && 
                `Please provide a reason for suspending ${user.name || user.email}'s account.`}
              {dialogType === 'unsuspend' && 
                `Are you sure you want to reactivate ${user.name || user.email}'s account?`}
            </DialogDescription>
          </DialogHeader>

          {(dialogType === 'reject' || dialogType === 'suspend') && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setDialogType(null);
                setReason("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading || ((dialogType === 'reject' || dialogType === 'suspend') && !reason.trim())}
              variant={dialogType === 'reject' || dialogType === 'suspend' ? 'destructive' : 'default'}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogType === 'approve' && 'Approve'}
              {dialogType === 'reject' && 'Reject'}
              {dialogType === 'suspend' && 'Suspend'}
              {dialogType === 'unsuspend' && 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
