/**
 * Customer Detail Dialog Component
 * 
 * Displays customer details and order history.
 * 
 * @module components/customers/customer-detail-dialog
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, ShoppingCart, DollarSign } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
  lastOrderAt?: string;
  status: 'active' | 'inactive';
}

interface CustomerDetailDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({
  customer,
  open,
  onOpenChange,
}: CustomerDetailDialogProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{customer.name}</DialogTitle>
              <DialogDescription>Customer details and activity</DialogDescription>
            </div>
            <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
              {customer.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Summary */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Activity Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                </div>
                <p className="text-2xl font-bold">{customer.totalOrders}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Joined</span>
                </div>
                <p className="text-sm">{formatDate(customer.joinedAt)}</p>
              </div>

              {customer.lastOrderAt && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last Order</span>
                  </div>
                  <p className="text-sm">{formatDate(customer.lastOrderAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="text-lg font-semibold">
                {customer.totalOrders > 0
                  ? formatCurrency(customer.totalSpent / customer.totalOrders)
                  : formatCurrency(0)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
