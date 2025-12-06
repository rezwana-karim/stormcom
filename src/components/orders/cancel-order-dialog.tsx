"use client";

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (reason?: string) => Promise<void>;
  orderNumber: string;
  loading?: boolean;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  onCancel,
  orderNumber,
  loading = false,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setError('');
    try {
      await onCancel(reason || undefined);
      setReason('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancel Order
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel order #{orderNumber}? This action will restore inventory and cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Enter the reason for canceling this order..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Keep Order
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? 'Canceling...' : 'Cancel Order'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
