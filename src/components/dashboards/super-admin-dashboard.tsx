'use client';

/**
 * Super Admin Dashboard
 * Platform-level overview with system-wide metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Store, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Server,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface PlatformStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  stores: {
    total: number;
    active: number;
    growth: number;
  };
  products: {
    total: number;
    published: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    growth: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  system: {
    health: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
  };
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch platform stats
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Failed to load platform stats</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Alert */}
      {stats.system.health !== 'healthy' && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <CardTitle>System Health Warning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              System health status: <Badge variant="destructive">{stats.system.health}</Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          description={`${stats.users.active.toLocaleString()} active`}
          icon={Users}
          trend={stats.users.growth}
          badge={`+${stats.users.new} new`}
        />
        
        <StatCard
          title="Active Stores"
          value={stats.stores.active.toLocaleString()}
          description={`${stats.stores.total} total`}
          icon={Store}
          trend={stats.stores.growth}
        />
        
        <StatCard
          title="Total Products"
          value={stats.products.total.toLocaleString()}
          description={`${stats.products.published.toLocaleString()} published`}
          icon={Package}
          trend={stats.products.growth}
        />
        
        <StatCard
          title="Platform Revenue"
          value={`$${(stats.revenue.total / 1000).toFixed(1)}k`}
          description={`$${stats.revenue.monthly.toLocaleString()} this month`}
          icon={DollarSign}
          trend={stats.revenue.growth}
        />
      </div>

      {/* System Status Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {stats.system.health === 'healthy' ? (
              <CheckCircle className="size-4 text-green-600" />
            ) : (
              <AlertTriangle className="size-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.system.health}</div>
            <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.system.uptime.toFixed(2)}%</div>
            <Progress value={stats.system.uptime} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.system.responseTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Platform Administration
          </CardTitle>
          <CardDescription>Quick access to critical platform functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction title="Manage Users" href="/dashboard/admin/users" />
            <QuickAction title="Manage Stores" href="/dashboard/admin/stores" />
            <QuickAction title="System Logs" href="/dashboard/admin/logs" />
            <QuickAction title="Security Settings" href="/dashboard/admin/security" />
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
  trend, 
  badge 
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: number;
  badge?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend !== undefined && (
            <Badge variant={trend >= 0 ? "default" : "destructive"} className="gap-1">
              <TrendingUp className={`size-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </Badge>
          )}
        </div>
        {badge && (
          <Badge variant="secondary" className="mt-2">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
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
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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
