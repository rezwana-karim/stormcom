'use client';

/**
 * Store Admin Dashboard
 * Store-level overview with store-specific metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Users as UsersIcon,
  AlertTriangle,
  Star,
  Clock
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface StoreStats {
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    revenue: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
  };
  performance: {
    avgOrderValue: number;
    conversionRate: number;
    customerSatisfaction: number;
  };
}

interface StoreAdminDashboardProps {
  storeId: string;
}

export function StoreAdminDashboard({ storeId }: StoreAdminDashboardProps) {
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    fetch(`/api/stores/${storeId}/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch store stats:', error);
        setLoading(false);
      });
  }, [storeId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Failed to load store stats</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(stats.products.lowStock > 0 || stats.products.outOfStock > 0) && (
        <Card className="border-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              <CardTitle>Inventory Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.products.lowStock > 0 && (
              <p className="text-sm text-muted-foreground">
                {stats.products.lowStock} products with low stock
              </p>
            )}
            {stats.products.outOfStock > 0 && (
              <p className="text-sm text-muted-foreground">
                {stats.products.outOfStock} products out of stock
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.products.total.toLocaleString()}
          description={`${stats.products.active} active`}
          icon={Package}
          badge={
            stats.products.lowStock > 0 
              ? `${stats.products.lowStock} low stock`
              : undefined
          }
          badgeVariant={stats.products.lowStock > 0 ? "destructive" : "default"}
        />
        
        <StatCard
          title="Orders"
          value={stats.orders.total.toLocaleString()}
          description={`${stats.orders.pending} pending`}
          icon={ShoppingCart}
          badge={`${stats.orders.processing} processing`}
        />
        
        <StatCard
          title="Revenue"
          value={`$${(stats.orders.revenue / 1000).toFixed(1)}k`}
          description="Total sales"
          icon={DollarSign}
        />
        
        <StatCard
          title="Customers"
          value={stats.customers.total.toLocaleString()}
          description={`${stats.customers.active} active`}
          icon={UsersIcon}
          badge={`+${stats.customers.new} new`}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.performance.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.performance.conversionRate.toFixed(1)}%
            </div>
            <Progress value={stats.performance.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Star className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.performance.customerSatisfaction.toFixed(1)}/5.0
            </div>
            <Progress 
              value={(stats.performance.customerSatisfaction / 5) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
          <CardDescription>Current order processing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <OrderStatusBar
              label="Pending"
              count={stats.orders.pending}
              total={stats.orders.total}
              variant="secondary"
            />
            <OrderStatusBar
              label="Processing"
              count={stats.orders.processing}
              total={stats.orders.total}
              variant="default"
            />
            <OrderStatusBar
              label="Completed"
              count={stats.orders.completed}
              total={stats.orders.total}
              variant="default"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common store management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction title="Add Product" href={`/dashboard/products/new?storeId=${storeId}`} />
            <QuickAction title="Process Orders" href={`/dashboard/orders?storeId=${storeId}&status=pending`} />
            <QuickAction title="Manage Staff" href={`/dashboard/staff?storeId=${storeId}`} />
            <QuickAction title="View Reports" href={`/dashboard/analytics?storeId=${storeId}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  badge,
  badgeVariant = "secondary"
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {badge && (
          <Badge variant={badgeVariant} className="mt-2">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function OrderStatusBar({ 
  label, 
  count, 
  total, 
  variant 
}: {
  label: string;
  count: number;
  total: number;
  variant: "default" | "secondary";
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

function QuickAction({ title, href }: { title: string; href: string }) {
  return (
    <a 
      href={href}
      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
    >
      <span>{title}</span>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
