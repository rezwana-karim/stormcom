/**
 * Revenue Chart Component
 * 
 * Line chart displaying revenue trends over time using Recharts.
 * 
 * @module components/analytics/revenue-chart
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  storeId: string;
  timeRange: string;
}

// Helper to calculate date range from timeRange
function getDateRange(timeRange: string): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (timeRange) {
    case '7d': from.setDate(to.getDate() - 7); break;
    case '30d': from.setDate(to.getDate() - 30); break;
    case '90d': from.setDate(to.getDate() - 90); break;
    case '1y': from.setFullYear(to.getFullYear() - 1); break;
    default: from.setDate(to.getDate() - 30);
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export function RevenueChart({ storeId, timeRange }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const dateRange = getDateRange(timeRange);
        const response = await fetch(`/api/analytics/revenue?storeId=${storeId}&from=${dateRange.from}&to=${dateRange.to}`);
        if (!response.ok) throw new Error('Failed to fetch revenue data');
        
        const result = await response.json();
        setData(result.data || []);
      } catch (error) {
        console.error('Revenue chart error:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, timeRange]);

  if (loading) {
    return <div className="h-[350px] flex items-center justify-center">Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          className="text-xs"
        />
        <YAxis
          tickFormatter={formatCurrency}
          className="text-xs"
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
            return [value, 'Orders'];
          }}
          labelFormatter={formatDate}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Revenue"
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          name="Orders"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
