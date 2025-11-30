/**
 * Admin Stores Page
 * 
 * Lists all stores with management options.
 */

import { Suspense } from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Store, Users, Package, ShoppingCart } from "lucide-react";

async function getStores() {
  return prisma.store.findMany({
    include: {
      organization: {
        include: {
          memberships: {
            where: { role: 'OWNER' },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            take: 1,
          },
        },
      },
      _count: {
        select: {
          products: true,
          orders: true,
          customers: true,
          staff: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

function StoreSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

async function StoresContent() {
  const stores = await getStores();

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Store className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Stores Yet</h3>
        <p className="text-muted-foreground mb-4">
          Create a store for an approved user to get started
        </p>
        <Link href="/admin/stores/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Store
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => {
        const owner = store.organization.memberships[0]?.user;
        return (
          <Card key={store.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                  <CardDescription>/{store.slug}</CardDescription>
                </div>
                <Badge variant={store.subscriptionStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                  {store.subscriptionPlan}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {owner && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Owner:</span>{" "}
                  <span className="font-medium">{owner.name || owner.email}</span>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{store._count.products}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{store._count.orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{store._count.customers}</p>
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-semibold">{store._count.staff}</p>
                  <p className="text-xs text-muted-foreground">Staff</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link href={`/admin/stores/${store.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function AdminStoresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground">
            Manage all stores on the platform
          </p>
        </div>
        <Link href="/admin/stores/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Store
          </Button>
        </Link>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <StoreSkeleton key={i} />)}
        </div>
      }>
        <StoresContent />
      </Suspense>
    </div>
  );
}
