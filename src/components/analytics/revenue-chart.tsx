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
  timeRange: string;
  storeId: string;
}

export function RevenueChart({ timeRange, storeId }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/revenue?storeId=${storeId}&range=${timeRange}`);
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
  }, [timeRange, storeId]);

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
