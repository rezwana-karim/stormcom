"use client";

// src/components/analytics-dashboard.tsx
// Real-time analytics dashboard with data from API

import { useEffect, useState } from 'react';
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingDown,
} from 'lucide-react';

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface DashboardStats {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  customers: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  products: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
}

interface AnalyticsDashboardProps {
  storeId: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export function AnalyticsDashboard({ storeId, dateRange }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ storeId });
        if (dateRange?.from) params.set('from', dateRange.from);
        if (dateRange?.to) params.set('to', dateRange.to);

        const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    if (storeId) {
      fetchStats();
    }
  }, [storeId, dateRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>
              {error || 'Failed to load dashboard data. Please try again.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Revenue Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.revenue.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.revenue.trend === 'up' ? (
                <IconTrendingUp className="h-4 w-4" />
              ) : (
                <IconTrendingDown className="h-4 w-4" />
              )}
              {stats.revenue.change > 0 ? '+' : ''}{stats.revenue.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.revenue.trend === 'up' ? (
              <>
                <DollarSign className="size-4" />
                Trending up this period
              </>
            ) : (
              <>
                <TrendingDown className="size-4" />
                Down from last period
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {stats.revenue.trend === 'up' 
              ? 'Revenue growth continues' 
              : 'Revenue needs attention'}
          </div>
        </CardFooter>
      </Card>

      {/* Orders Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.orders.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.orders.trend === 'up' ? (
                <IconTrendingUp className="h-4 w-4" />
              ) : (
                <IconTrendingDown className="h-4 w-4" />
              )}
              {stats.orders.change > 0 ? '+' : ''}{stats.orders.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.orders.trend === 'up' ? (
              <>
                <ShoppingCart className="size-4" />
                Order volume increasing
              </>
            ) : (
              <>
                <TrendingDown className="size-4" />
                Order volume declining
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {stats.orders.trend === 'up' 
              ? 'Strong order activity' 
              : 'Orders need promotion'}
          </div>
        </CardFooter>
      </Card>

      {/* Customers Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.customers.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.customers.trend === 'up' ? (
                <IconTrendingUp className="h-4 w-4" />
              ) : (
                <IconTrendingDown className="h-4 w-4" />
              )}
              {stats.customers.change > 0 ? '+' : ''}{stats.customers.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.customers.trend === 'up' ? (
              <>
                <Users className="size-4" />
                Customer growth strong
              </>
            ) : (
              <>
                <TrendingDown className="size-4" />
                Customer growth slowing
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {stats.customers.trend === 'up' 
              ? 'Acquisition on track' 
              : 'Focus on retention'}
          </div>
        </CardFooter>
      </Card>

      {/* Products Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.products.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Package className="h-4 w-4" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Package className="size-4" />
            Product catalog size
          </div>
          <div className="text-muted-foreground">
            Available for purchase
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
