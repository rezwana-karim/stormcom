/**
 * Analytics Dashboard Component
 * 
 * Main dashboard with metric cards, revenue chart, and top products.
 * Fetches data from multiple analytics endpoints.
 * 
 * @module components/analytics/analytics-dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
} from 'lucide-react';
import { RevenueChart } from './revenue-chart';
import { TopProductsTable } from './top-products-table';
import { CustomerMetrics } from './customer-metrics';
import { StoreSelector } from '@/components/store-selector';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface DashboardMetrics {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: number;
    trend?: 'up' | 'down';
  };
  customers: {
    total: number;
    change?: number;
    new?: number;
  };
  products?: {
    total: number;
    change?: number;
  };
  avgOrderValue?: {
    value: number;
    change: number;
  };
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

// Helper to calculate date range based on time range
function getDateRange(range: TimeRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  
  switch (range) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case '1y':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

interface AnalyticsDashboardProps {
  storeId?: string;
}

export function AnalyticsDashboard({ storeId: propStoreId }: AnalyticsDashboardProps) {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(propStoreId || '');
  
  // Get storeId from props, state, or session
  const storeId = propStoreId || selectedStoreId || (session?.user as { storeId?: string })?.storeId;

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { from, to } = getDateRange(timeRange);
        const params = new URLSearchParams({
          storeId,
          from,
          to,
        });
        
        const response = await fetch(`/api/analytics/dashboard?${params}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        toast.error('Failed to load analytics data');
        console.error('Analytics error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange, storeId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (loading && !metrics) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!storeId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Store:</span>
          <StoreSelector onStoreChange={setSelectedStoreId} />
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>Select a store to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      {!propStoreId && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Store:</span>
          <StoreSelector onStoreChange={setSelectedStoreId} />
        </div>
      )}
      
      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
        <TabsList>
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 days</TabsTrigger>
          <TabsTrigger value="90d">Last 90 days</TabsTrigger>
          <TabsTrigger value="1y">Last year</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6">
          {/* Metric Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics ? formatCurrency(metrics.revenue.total) : '---'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics && (
                    <span className={metrics.revenue.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatChange(metrics.revenue.change)} from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.orders.total.toLocaleString() || '---'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics && metrics.orders.change !== undefined && (
                    <span className={metrics.orders.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatChange(metrics.orders.change)} from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.customers.total.toLocaleString() || '---'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics && metrics.customers.change !== undefined && (
                    <span className={metrics.customers.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatChange(metrics.customers.change)} from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.products?.total?.toLocaleString() || '---'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active products in store
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Daily revenue for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart storeId={storeId} timeRange={timeRange} />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best selling products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopProductsTable storeId={storeId} timeRange={timeRange} />
              </CardContent>
            </Card>
          </div>

          {/* Customer Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>
                Customer acquisition and retention metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerMetrics storeId={storeId} timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
