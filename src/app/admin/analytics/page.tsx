/**
 * Admin Analytics Page
 * 
 * Platform-wide analytics and statistics for Super Admin.
 */

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Store, 
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  UserCheck,
  UserX,
  Clock,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, subDays, startOfDay, endOfDay } from "date-fns";

async function getAnalytics() {
  const today = new Date();
  const last7Days = subDays(today, 7);
  const last30Days = subDays(today, 30);
  const previousPeriod30Days = subDays(today, 60);

  // User stats
  const [
    totalUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    suspendedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.user.count({ where: { accountStatus: 'PENDING' } }),
    prisma.user.count({ where: { accountStatus: 'APPROVED' } }),
    prisma.user.count({ where: { accountStatus: 'REJECTED' } }),
    prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
  ]);

  // Store stats
  const [
    totalStores,
    activeStores,
    newStoresLast30Days,
  ] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.store.count({ where: { createdAt: { gte: last30Days } } }),
  ]);

  // Order stats
  const [
    totalOrders,
    ordersLast30Days,
    ordersLastPeriod,
    pendingOrders,
    completedOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.order.count({ where: { createdAt: { gte: previousPeriod30Days, lt: last30Days } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: { in: ['DELIVERED'] } } }),
  ]);

  // Revenue (last 30 days)
  const revenueData = await prisma.order.aggregate({
    where: {
      createdAt: { gte: last30Days },
      status: { notIn: ['CANCELED', 'REFUNDED'] },
    },
    _sum: { totalAmount: true },
  });

  const previousRevenueData = await prisma.order.aggregate({
    where: {
      createdAt: { gte: previousPeriod30Days, lt: last30Days },
      status: { notIn: ['CANCELED', 'REFUNDED'] },
    },
    _sum: { totalAmount: true },
  });

  // Product stats
  const [totalProducts, activeProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
  ]);

  // Recent activity
  const recentActivity = await prisma.platformActivity.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { name: true, email: true } },
      targetUser: { select: { name: true, email: true } },
    },
  });

  // Top stores by orders
  const topStores = await prisma.store.findMany({
    take: 5,
    include: {
      _count: { select: { orders: true, products: true } },
    },
    orderBy: { orders: { _count: 'desc' } },
  });

  // Calculate growth rates
  const orderGrowth = ordersLastPeriod > 0 
    ? ((ordersLast30Days - ordersLastPeriod) / ordersLastPeriod * 100).toFixed(1)
    : ordersLast30Days > 0 ? '100' : '0';

  const currentRevenue = revenueData._sum?.totalAmount || 0;
  const previousRevenue = previousRevenueData._sum?.totalAmount || 0;
  const revenueGrowth = previousRevenue > 0
    ? (((currentRevenue as number) - (previousRevenue as number)) / (previousRevenue as number) * 100).toFixed(1)
    : currentRevenue > 0 ? '100' : '0';

  return {
    users: {
      total: totalUsers,
      newLast7Days: newUsersLast7Days,
      newLast30Days: newUsersLast30Days,
      pending: pendingUsers,
      approved: approvedUsers,
      rejected: rejectedUsers,
      suspended: suspendedUsers,
    },
    stores: {
      total: totalStores,
      active: activeStores,
      newLast30Days: newStoresLast30Days,
    },
    orders: {
      total: totalOrders,
      last30Days: ordersLast30Days,
      pending: pendingOrders,
      completed: completedOrders,
      growth: parseFloat(orderGrowth),
    },
    revenue: {
      last30Days: currentRevenue as number,
      growth: parseFloat(revenueGrowth),
    },
    products: {
      total: totalProducts,
      active: activeProducts,
    },
    recentActivity,
    topStores,
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <div className={`flex items-center text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <TrendingUp className="size-3 mr-1" /> : 
             trend === 'down' ? <TrendingDown className="size-3 mr-1" /> : null}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function AnalyticsContent() {
  const analytics = await getAnalytics();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={analytics.users.total}
            description={`${analytics.users.newLast7Days} new this week`}
            icon={Users}
          />
          <StatCard
            title="Active Stores"
            value={analytics.stores.active}
            description={`${analytics.stores.newLast30Days} new this month`}
            icon={Store}
          />
          <StatCard
            title="Orders (30 days)"
            value={analytics.orders.last30Days}
            icon={ShoppingCart}
            trend={analytics.orders.growth > 0 ? 'up' : analytics.orders.growth < 0 ? 'down' : 'neutral'}
            trendValue={`${analytics.orders.growth > 0 ? '+' : ''}${analytics.orders.growth}% from last period`}
          />
          <StatCard
            title="Revenue (30 days)"
            value={`$${analytics.revenue.last30Days.toLocaleString()}`}
            icon={DollarSign}
            trend={analytics.revenue.growth > 0 ? 'up' : analytics.revenue.growth < 0 ? 'down' : 'neutral'}
            trendValue={`${analytics.revenue.growth > 0 ? '+' : ''}${analytics.revenue.growth}% from last period`}
          />
        </div>
      </div>

      {/* User Status Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">User Status</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Approval"
            value={analytics.users.pending}
            description="Awaiting review"
            icon={Clock}
          />
          <StatCard
            title="Approved"
            value={analytics.users.approved}
            description="Active users"
            icon={UserCheck}
          />
          <StatCard
            title="Rejected"
            value={analytics.users.rejected}
            description="Applications rejected"
            icon={UserX}
          />
          <StatCard
            title="Suspended"
            value={analytics.users.suspended}
            description="Accounts suspended"
            icon={UserX}
          />
        </div>
      </div>

      {/* Products and Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products Overview</CardTitle>
            <CardDescription>Platform-wide product statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span>Total Products</span>
                </div>
                <span className="font-semibold">{analytics.products.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-green-600" />
                  <span>Active Products</span>
                </div>
                <span className="font-semibold">{analytics.products.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <span>Inactive Products</span>
                </div>
                <span className="font-semibold">{analytics.products.total - analytics.products.active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-muted-foreground" />
                  <span>Total Orders</span>
                </div>
                <span className="font-semibold">{analytics.orders.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600" />
                  <span>Pending Orders</span>
                </div>
                <Badge variant="outline" className="text-amber-600">
                  {analytics.orders.pending}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-green-600" />
                  <span>Completed Orders</span>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {analytics.orders.completed}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Stores</CardTitle>
          <CardDescription>Stores with most orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topStores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No stores yet
              </p>
            ) : (
              analytics.topStores.map((store, index) => (
                <div key={store.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store._count.products} products
                      </p>
                    </div>
                  </div>
                  <Badge>{store._count.orders} orders</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet
              </p>
            ) : (
              analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <Activity className="size-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p>{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.actor?.name || activity.actor?.email} • {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide statistics and performance metrics
        </p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
