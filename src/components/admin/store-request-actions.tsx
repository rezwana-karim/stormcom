"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StoreRequestActionsProps {
  requestId: string;
  storeName: string;
}

export function StoreRequestActions({ requestId, storeName }: StoreRequestActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState("FREE");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/store-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve request");
      }

      toast.success("Store request approved!", {
        description: `Store "${storeName}" has been created successfully.`,
      });
      setApproveOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to approve request", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/store-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject request");
      }

      toast.success("Store request rejected", {
        description: "The user has been notified of your decision.",
      });
      setRejectOpen(false);
      setRejectionReason("");
      router.refresh();
    } catch (error) {
      toast.error("Failed to reject request", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      <Button
        variant="default"
        size="sm"
        className="flex-1"
        onClick={() => setApproveOpen(true)}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="flex-1"
        onClick={() => setRejectOpen(true)}
      >
        <XCircle className="h-4 w-4 mr-2" />
        Reject
      </Button>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Store Request</DialogTitle>
            <DialogDescription>
              Create a new store for this user. This will set up the organization,
              store, and assign the user as the store owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <p className="text-sm font-medium">{storeName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="BASIC">Basic - $29/mo</SelectItem>
                  <SelectItem value="PRO">Pro - $79/mo</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise - $199/mo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the subscription plan for this store
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve & Create Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Store Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this store request.
              The user will be notified of your decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <p className="text-sm font-medium">{storeName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Be specific to help the user understand.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || rejectionReason.length < 10}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
