/**
 * Admin Store Requests Page
 * 
 * Lists pending store requests for Super Admin approval.
 */

import { Suspense } from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Clock, CheckCircle2, XCircle, User, Mail, Phone, Building2 } from "lucide-react";
import { StoreRequestActions } from "@/components/admin/store-request-actions";

interface StoreRequest {
  id: string;
  storeName: string;
  storeSlug: string | null;
  storeDescription: string | null;
  businessName: string | null;
  businessCategory: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    accountStatus: string;
  };
  reviewer: {
    id: string;
    name: string | null;
  } | null;
  createdStore: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

async function getStoreRequests(status?: string) {
  const whereClause: Record<string, unknown> = {};
  
  if (status && status !== 'ALL') {
    whereClause.status = status;
  }

  return prisma.storeRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          accountStatus: true,
        },
      },
      reviewer: {
        select: { id: true, name: true },
      },
      createdStore: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  }) as Promise<StoreRequest[]>;
}

async function getRequestCounts() {
  const [pending, approved, rejected, total] = await Promise.all([
    prisma.storeRequest.count({ where: { status: 'PENDING' } }),
    prisma.storeRequest.count({ where: { status: 'APPROVED' } }),
    prisma.storeRequest.count({ where: { status: 'REJECTED' } }),
    prisma.storeRequest.count(),
  ]);
  return { pending, approved, rejected, total };
}

function RequestSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
          <XCircle className="h-3 w-3 mr-1" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function StoreRequestCard({ request }: { request: StoreRequest }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              {request.storeName}
            </CardTitle>
            <CardDescription>
              /{request.storeSlug || request.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
            </CardDescription>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Requester Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{request.user.name || 'No name'}</p>
            <p className="text-sm text-muted-foreground">{request.user.email}</p>
          </div>
        </div>

        {/* Business Info */}
        {(request.businessName || request.businessCategory) && (
          <div className="grid gap-2 text-sm">
            {request.businessName && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{request.businessName}</span>
                {request.businessCategory && (
                  <Badge variant="secondary" className="text-xs">
                    {request.businessCategory}
                  </Badge>
                )}
              </div>
            )}
            {request.businessEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{request.businessEmail}</span>
              </div>
            )}
            {request.businessPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{request.businessPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {request.storeDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.storeDescription}
          </p>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Requested {new Date(request.createdAt).toLocaleDateString()}</span>
          {request.reviewedAt && (
            <span>
              Reviewed {new Date(request.reviewedAt).toLocaleDateString()}
              {request.reviewer && ` by ${request.reviewer.name}`}
            </span>
          )}
        </div>

        {/* Rejection Reason */}
        {request.status === 'REJECTED' && request.rejectionReason && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Rejection reason:</strong> {request.rejectionReason}
            </p>
          </div>
        )}

        {/* Created Store Link */}
        {request.status === 'APPROVED' && request.createdStore && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <Link href={`/admin/stores/${request.createdStore.id}`} className="text-sm text-green-600 dark:text-green-400 hover:underline">
              View created store: <strong>{request.createdStore.name}</strong>
            </Link>
          </div>
        )}

        {/* Actions */}
        {request.status === 'PENDING' && (
          <StoreRequestActions requestId={request.id} storeName={request.storeName} />
        )}
      </CardContent>
    </Card>
  );
}

async function StoreRequestsContent({ status }: { status: string }) {
  const requests = await getStoreRequests(status);

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Store className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Store Requests</h3>
        <p className="text-muted-foreground">
          {status === 'PENDING' 
            ? 'No pending store requests to review'
            : `No ${status.toLowerCase()} store requests found`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <StoreRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

async function StoreRequestsStats() {
  const counts = await getRequestCounts();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Pending</CardDescription>
          <CardTitle className="text-2xl text-amber-600">{counts.pending}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Approved</CardDescription>
          <CardTitle className="text-2xl text-green-600">{counts.approved}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Rejected</CardDescription>
          <CardTitle className="text-2xl text-red-600">{counts.rejected}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total</CardDescription>
          <CardTitle className="text-2xl">{counts.total}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default async function AdminStoreRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Requests</h1>
          <p className="text-muted-foreground">
            Review and manage store creation requests from users
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-8 w-[60px]" />
              </CardHeader>
            </Card>
          ))}
        </div>
      }>
        <StoreRequestsStats />
      </Suspense>

      <Tabs defaultValue="PENDING" className="space-y-4">
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value="PENDING">
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <RequestSkeleton key={i} />)}
            </div>
          }>
            <StoreRequestsContent status="PENDING" />
          </Suspense>
        </TabsContent>

        <TabsContent value="APPROVED">
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <RequestSkeleton key={i} />)}
            </div>
          }>
            <StoreRequestsContent status="APPROVED" />
          </Suspense>
        </TabsContent>

        <TabsContent value="REJECTED">
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <RequestSkeleton key={i} />)}
            </div>
          }>
            <StoreRequestsContent status="REJECTED" />
          </Suspense>
        </TabsContent>

        <TabsContent value="ALL">
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <RequestSkeleton key={i} />)}
            </div>
          }>
            <StoreRequestsContent status="ALL" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
