/**
 * Store Detail Page
 * 
 * View and manage a specific store's details.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Store,
  Activity,
  User,
  Globe,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getStoreDetails(id: string) {
  return prisma.store.findUnique({
    where: { id },
    include: {
      organization: {
        include: {
          memberships: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      },
      staff: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      _count: {
        select: {
          products: true,
          orders: true,
          customers: true,
        },
      },
      orders: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
}

async function getStoreStats(storeId: string) {
  const [totalRevenue, orderCount] = await Promise.all([
    prisma.order.aggregate({
      where: { storeId, status: { in: ['DELIVERED', 'SHIPPED'] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: { storeId },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    orderCount,
  };
}

const planColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-800",
  BASIC: "bg-blue-100 text-blue-800",
  PRO: "bg-purple-100 text-purple-800",
  ENTERPRISE: "bg-amber-100 text-amber-800",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIAL: "bg-blue-100 text-blue-800",
  SUSPENDED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default async function StoreDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [store, stats] = await Promise.all([
    getStoreDetails(id),
    getStoreStats(id),
  ]);

  if (!store) {
    notFound();
  }

  const owner = store.organization.memberships.find(m => m.role === 'OWNER')?.user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
            <p className="text-muted-foreground">/{store.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={planColors[store.subscriptionPlan]}>
            {store.subscriptionPlan}
          </Badge>
          <Badge className={statusColors[store.subscriptionStatus]}>
            {store.subscriptionStatus}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store._count.products}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store._count.orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store._count.customers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Store Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {store.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{store.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{store.email || 'Not set'}</p>
                  </div>
                </div>
                {store.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{store.phone}</p>
                    </div>
                  </div>
                )}
                {store.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="font-medium">{store.website}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(store.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {(store.address || store.city) && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[store.address, store.city, store.state, store.postalCode, store.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                Latest orders from this store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {store.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {store.orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Store Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {owner ? (
                <Link 
                  href={`/admin/users/${owner.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={owner.image || undefined} />
                    <AvatarFallback>
                      {owner.name?.charAt(0) || owner.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{owner.name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground">{owner.email}</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No owner assigned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members
              </CardTitle>
              <CardDescription>
                {store.staff.length} active staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {store.staff.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No staff members
                </p>
              ) : (
                <div className="space-y-3">
                  {store.staff.map((staff) => (
                    <Link 
                      key={staff.id}
                      href={`/admin/users/${staff.user.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {staff.user.name?.charAt(0) || staff.user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {staff.user.name || staff.user.email}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {staff.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge className={planColors[store.subscriptionPlan]}>
                  {store.subscriptionPlan}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={statusColors[store.subscriptionStatus]}>
                  {store.subscriptionStatus}
                </Badge>
              </div>
              {store.trialEndsAt && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trial Ends</span>
                    <span className="text-sm font-medium">
                      {format(new Date(store.trialEndsAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
