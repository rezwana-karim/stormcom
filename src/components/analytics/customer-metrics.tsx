/**
 * Customer Metrics Component
 * 
 * Displays customer acquisition, retention, and lifetime value metrics.
 * 
 * @module components/analytics/customer-metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, TrendingUp, DollarSign } from 'lucide-react';

interface CustomerMetricsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgLifetimeValue: number;
  retentionRate: number;
  churnRate: number;
}

interface CustomerMetricsProps {
  timeRange: string;
}

export function CustomerMetrics({ timeRange }: CustomerMetricsProps) {
  const [metrics, setMetrics] = useState<CustomerMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/customers?range=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch customer metrics');
        
        const result = await response.json();
        setMetrics(result.data || result);
      } catch (error) {
        console.error('Customer metrics error:', error);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded" />
      ))}
    </div>;
  }

  if (!metrics) {
    return <div className="text-center text-muted-foreground py-8">No customer data available</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold">{metrics.totalCustomers.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">New Customers</p>
          <p className="text-2xl font-bold">{metrics.newCustomers.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
          <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Returning Customers</p>
          <p className="text-2xl font-bold">{metrics.returningCustomers.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
          <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg. Lifetime Value</p>
          <p className="text-2xl font-bold">{formatCurrency(metrics.avgLifetimeValue)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
          <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Retention Rate</p>
          <p className="text-2xl font-bold">{formatPercentage(metrics.retentionRate)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400 rotate-180" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Churn Rate</p>
          <p className="text-2xl font-bold">{formatPercentage(metrics.churnRate)}</p>
        </div>
      </div>
    </div>
  );
}
