"use client";

import { useState } from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund: (amount: number, reason: string) => Promise<void>;
  totalAmount: number;
  refundedAmount: number;
  orderNumber: string;
  loading?: boolean;
}

export function RefundDialog({
  open,
  onOpenChange,
  onRefund,
  totalAmount,
  refundedAmount,
  orderNumber,
  loading = false,
}: RefundDialogProps) {
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const refundableBalance = totalAmount - refundedAmount;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleRefund = async () => {
    setError('');
    const amount = parseFloat(refundAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid refund amount greater than 0');
      return;
    }

    if (amount > refundableBalance) {
      setError(`Refund amount cannot exceed refundable balance of ${formatCurrency(refundableBalance)}`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    try {
      await onRefund(amount, reason);
      setRefundAmount('');
      setReason('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    }
  };

  const isPartialRefund = refundAmount && parseFloat(refundAmount) < refundableBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Issue Refund
          </DialogTitle>
          <DialogDescription>
            Process a refund for order #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Refund Balance Info */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Total:</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              {refundedAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Refunded:</span>
                  <span className="font-medium text-orange-600">
                    -{formatCurrency(refundedAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Refundable Balance:</span>
                <span className="font-semibold">{formatCurrency(refundableBalance)}</span>
              </div>
            </div>
          </div>

          {/* Refund Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="refundAmount">Refund Amount (USD)</Label>
            <Input
              id="refundAmount"
              type="number"
              step="0.01"
              min="0"
              max={refundableBalance}
              placeholder={`Max: ${formatCurrency(refundableBalance)}`}
              value={refundAmount}
              onChange={(e) => {
                setRefundAmount(e.target.value);
                setError('');
              }}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setRefundAmount(refundableBalance.toFixed(2))}
              className="w-full"
            >
              Refund Full Amount ({formatCurrency(refundableBalance)})
            </Button>
          </div>

          {/* Partial Refund Warning */}
          {isPartialRefund && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is a partial refund. The customer will receive {formatCurrency(parseFloat(refundAmount))} out of{' '}
                {formatCurrency(refundableBalance)}.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Refund Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this refund (required)"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRefund} disabled={loading || !refundAmount || !reason.trim()}>
            {loading ? 'Processing...' : 'Process Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
