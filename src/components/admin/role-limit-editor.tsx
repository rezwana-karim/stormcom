"use client";

/**
 * Role Limit Editor Dialog
 * 
 * Allows Super Admin to edit a store's custom role limit
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  IconSettings, 
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface RoleLimitEditorProps {
  storeId: string;
  storeName: string;
  currentLimit: number;
  currentUsage: number;
}

export function RoleLimitEditor({
  storeId,
  storeName,
  currentLimit,
  currentUsage,
}: RoleLimitEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(currentLimit);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isDecreasing = newLimit < currentLimit;
  const wouldOrphanRoles = newLimit < currentUsage;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newLimit < 1) {
      toast.error("Limit must be at least 1");
      return;
    }
    
    if (newLimit > 50) {
      toast.error("Limit cannot exceed 50");
      return;
    }
    
    if (wouldOrphanRoles) {
      toast.error(`Cannot set limit below current usage (${currentUsage} roles)`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/custom-roles/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customRoleLimit: newLimit,
          reason,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update limit");
      }
      
      toast.success("Role limit updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update limit");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconSettings className="h-4 w-4 mr-2" />
          Edit Role Limit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Custom Role Limit</DialogTitle>
            <DialogDescription>
              Change the maximum number of custom roles for {storeName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="limit">New Role Limit</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                max={50}
                value={newLimit}
                onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                Current usage: {currentUsage} / {currentLimit} roles
              </p>
            </div>
            
            {wouldOrphanRoles && (
              <Alert variant="destructive">
                <IconAlertTriangle className="h-4 w-4" />
                <AlertTitle>Cannot Apply This Limit</AlertTitle>
                <AlertDescription>
                  The store currently has {currentUsage} roles. You cannot set the limit 
                  below the current usage. Either delete some roles first or set a higher limit.
                </AlertDescription>
              </Alert>
            )}
            
            {isDecreasing && !wouldOrphanRoles && (
              <Alert>
                <IconAlertTriangle className="h-4 w-4" />
                <AlertTitle>Decreasing Limit</AlertTitle>
                <AlertDescription>
                  You are decreasing the limit from {currentLimit} to {newLimit}. 
                  The store will have {newLimit - currentUsage} remaining slot(s).
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why is this limit being changed?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
              <p className="text-sm text-muted-foreground">
                This will be recorded in the activity log.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || wouldOrphanRoles || newLimit === currentLimit}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
