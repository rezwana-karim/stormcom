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

interface DashboardMetrics {
  revenue: {
    total: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: number;
  };
  customers: {
    total: number;
    new: number;
  };
  avgOrderValue: {
    value: number;
    change: number;
  };
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/dashboard?storeId=${storeId}&range=${timeRange}`);
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Store:</label>
          <StoreSelector onStoreChange={setStoreId} />
        </div>
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to view analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

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
                  {metrics && (
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
                  {metrics && (
                    <span className="text-green-600">
                      +{metrics.customers.new} new this period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics ? formatCurrency(metrics.avgOrderValue.value) : '---'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics && (
                    <span className={metrics.avgOrderValue.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatChange(metrics.avgOrderValue.change)} from last period
                    </span>
                  )}
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
                <RevenueChart timeRange={timeRange} storeId={storeId} />
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
                <TopProductsTable timeRange={timeRange} storeId={storeId} />
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
              <CustomerMetrics timeRange={timeRange} storeId={storeId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
