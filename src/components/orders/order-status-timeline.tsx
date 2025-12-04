"use client";

import { Clock, Package, Truck, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

const STATUS_FLOW = [
  {
    status: 'PENDING' as OrderStatus,
    label: 'Pending',
    icon: Clock,
    description: 'Order received',
  },
  {
    status: 'PAID' as OrderStatus,
    label: 'Paid',
    icon: DollarSign,
    description: 'Payment confirmed',
  },
  {
    status: 'PROCESSING' as OrderStatus,
    label: 'Processing',
    icon: Package,
    description: 'Preparing order',
  },
  {
    status: 'SHIPPED' as OrderStatus,
    label: 'Shipped',
    icon: Truck,
    description: 'In transit',
  },
  {
    status: 'DELIVERED' as OrderStatus,
    label: 'Delivered',
    icon: CheckCircle,
    description: 'Order completed',
  },
];

const ERROR_STATUSES: OrderStatus[] = ['PAYMENT_FAILED', 'CANCELED', 'REFUNDED'];

export function OrderStatusTimeline({ currentStatus, className }: OrderStatusTimelineProps) {
  // Handle error statuses separately
  if (ERROR_STATUSES.includes(currentStatus)) {
    const errorInfoMap: Record<string, { icon: typeof XCircle; label: string; color: string }> = {
      PAYMENT_FAILED: { icon: XCircle, label: 'Payment Failed', color: 'text-red-500' },
      CANCELED: { icon: XCircle, label: 'Canceled', color: 'text-gray-500' },
      REFUNDED: { icon: DollarSign, label: 'Refunded', color: 'text-orange-500' },
    };
    
    const errorInfo = errorInfoMap[currentStatus];

    if (!errorInfo) return null;

    const Icon = errorInfo.icon;
    return (
      <div className={cn('flex items-center gap-3 p-4 rounded-lg border', className)}>
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-full bg-muted', errorInfo.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{errorInfo.label}</p>
          <p className="text-sm text-muted-foreground">Order status</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.findIndex((step) => step.status === currentStatus);

  return (
    <div className={cn('py-4', className)}>
      <div className="flex items-center justify-between">
        {STATUS_FLOW.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentIndex;
          const isCurrent = step.status === currentStatus;

          return (
            <div key={step.status} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isActive
                      ? isCurrent
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-primary bg-primary/10 text-primary'
                      : 'border-muted bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-2 text-center hidden sm:block">
                  <p className={cn('text-xs font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
                </div>
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    isActive && currentIndex > index ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
