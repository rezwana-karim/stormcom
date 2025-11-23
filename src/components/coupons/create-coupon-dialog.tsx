'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCouponDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCouponDialogProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    onSuccess();
    onOpenChange(false);
    
    // Reset form
    setCode('');
    setValue('');
    setMinPurchase('');
    setUsageLimit('');
    setExpiresAt('');
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Discount Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount code for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use uppercase letters and numbers (e.g., SAVE20, FREESHIP)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">
                {type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
              </Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'percentage' ? '20' : '10.00'}
                min="0"
                step={type === 'percentage' ? '1' : '0.01'}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minPurchase">Minimum Purchase ($)</Label>
              <Input
                id="minPurchase"
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="50.00"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Minimum order value to use this coupon
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="1000"
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Maximum number of times this coupon can be used
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Expiration Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Coupon will expire at end of this date
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !code || !value}>
              {isSaving ? 'Creating...' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
