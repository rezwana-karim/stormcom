/**
 * Super Admin - Stores with Custom Roles List
 * 
 * Lists all stores with their custom role usage
 */

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  IconBuildingStore,
  IconSearch,
  IconChevronLeft,
  IconUserShield,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Stores Custom Roles | Admin",
  description: "View custom role usage across all stores",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getStores(options: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) {
  const { page, limit, search, sortBy, sortOrder } = options;
  
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { slug: { contains: search } },
        ],
      }
    : {};
  
  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        customRoles: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
      orderBy: sortBy === "roleCount" 
        ? { customRoles: { _count: sortOrder } }
        : sortBy === "name"
        ? { name: sortOrder }
        : { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.store.count({ where }),
  ]);
  
  // Transform stores with computed values
  const storesWithStats = stores.map((store) => {
    const activeRoles = store.customRoles.filter((r) => r.isActive).length;
    const usagePercent = (store.customRoles.length / store.customRoleLimit) * 100;
    
    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      subscriptionPlan: store.subscriptionPlan,
      customRoleLimit: store.customRoleLimit,
      roleCount: store.customRoles.length,
      activeRoles,
      inactiveRoles: store.customRoles.length - activeRoles,
      usagePercent,
      isAtLimit: store.customRoles.length >= store.customRoleLimit,
      owner: store.owner,
      createdAt: store.createdAt,
    };
  });
  
  return {
    stores: storesWithStats,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function AdminCustomRolesStoresPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  // Check if user is Super Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });
  
  if (!user?.isSuperAdmin) {
    notFound();
  }
  
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const sortBy = params.sortBy || "roleCount";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";
  
  const data = await getStores({
    page,
    limit: 20,
    search,
    sortBy,
    sortOrder,
  });
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link 
            href="/admin/custom-roles" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <IconChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <IconBuildingStore className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Stores Custom Roles</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {data.total} stores total
          </p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search stores by name..."
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <select
              name="sortBy"
              defaultValue={sortBy}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="roleCount">Sort by Role Count</option>
              <option value="name">Sort by Name</option>
              <option value="createdAt">Sort by Created Date</option>
            </select>
            <select
              name="sortOrder"
              defaultValue={sortOrder}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Stores List */}
      <div className="grid gap-4">
        {data.stores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <IconBuildingStore className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "No stores found matching your search." : "No stores available."}
              </p>
            </CardContent>
          </Card>
        ) : (
          data.stores.map((store) => (
            <Card key={store.id} className={store.isAtLimit ? "border-amber-500/50" : ""}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <IconBuildingStore className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/custom-roles/stores/${store.id}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {store.name}
                        </Link>
                        {store.isAtLimit && (
                          <Badge variant="destructive" className="gap-1">
                            <IconAlertTriangle className="h-3 w-3" />
                            At Limit
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {store.slug} • {store.subscriptionPlan}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {store.owner?.name || store.owner?.email || "Unknown"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:items-end min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <IconUserShield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {store.roleCount} / {store.customRoleLimit} roles
                      </span>
                    </div>
                    <Progress 
                      value={store.usagePercent} 
                      className="h-2 w-full sm:w-40"
                    />
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{store.activeRoles} active</span>
                      <span>•</span>
                      <span>{store.inactiveRoles} inactive</span>
                    </div>
                  </div>
                  
                  <div>
                    <Link href={`/admin/custom-roles/stores/${store.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/custom-roles/stores?page=${page - 1}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
            >
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          {page < data.totalPages && (
            <Link
              href={`/admin/custom-roles/stores?page=${page + 1}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
            >
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
