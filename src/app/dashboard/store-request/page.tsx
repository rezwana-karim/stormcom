/**
 * Store Request Page
 * 
 * Allows approved users to request a new store.
 */

import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { StoreRequestForm } from "@/components/store-request-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getUserData(userId: string) {
  const [user, existingRequests, existingStoreStaff] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        accountStatus: true,
        businessName: true,
        businessCategory: true,
        businessDescription: true,
        phoneNumber: true,
      },
    }),
    prisma.storeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdStore: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.storeStaff.findFirst({
      where: { userId, role: 'STORE_ADMIN' },
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  ]);

  return { user, existingRequests, existingStoreStaff };
}

function RequestStatusCard({ request }: { request: {
  id: string;
  storeName: string;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  createdStore: { id: string; name: string; slug: string } | null;
}}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5" />
            {request.storeName}
          </CardTitle>
          {request.status === 'PENDING' && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Clock className="h-3 w-3 mr-1" /> Pending Review
            </Badge>
          )}
          {request.status === 'APPROVED' && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
            </Badge>
          )}
          {request.status === 'REJECTED' && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              <XCircle className="h-3 w-3 mr-1" /> Rejected
            </Badge>
          )}
        </div>
        <CardDescription>
          Submitted {new Date(request.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {request.status === 'PENDING' && (
          <p className="text-sm text-muted-foreground">
            Your request is being reviewed by our team. You'll be notified once a decision is made.
          </p>
        )}
        {request.status === 'APPROVED' && request.createdStore && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">
              Your store has been created! You can now start managing your business.
            </p>
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          </div>
        )}
        {request.status === 'REJECTED' && (
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              <strong>Reason:</strong> {request.rejectionReason || 'No reason provided'}
            </p>
            <p className="text-xs text-muted-foreground">
              You can submit a new request with updated information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function StoreRequestContent() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { user, existingRequests, existingStoreStaff } = await getUserData(session.user.id);

  if (!user) {
    redirect('/login');
  }

  // Check if user already has a store
  if (existingStoreStaff) {
    return (
      <div className="space-y-6">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>You Already Have a Store</AlertTitle>
          <AlertDescription>
            You are already the owner of <strong>{existingStoreStaff.store.name}</strong>. 
            Go to your dashboard to manage it.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Check if user is approved
  if (user.accountStatus !== 'APPROVED') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Account Not Approved</AlertTitle>
        <AlertDescription>
          Your account must be approved before you can request a store. 
          {user.accountStatus === 'PENDING' && (
            <span> Your account is currently pending review.</span>
          )}
          {user.accountStatus === 'REJECTED' && (
            <span> Your account registration was not approved. Please contact support.</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Check for pending request
  const pendingRequest = existingRequests.find(r => r.status === 'PENDING');
  
  if (pendingRequest) {
    return (
      <div className="space-y-6">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Request Pending</AlertTitle>
          <AlertDescription>
            You already have a pending store request. Please wait for it to be reviewed.
          </AlertDescription>
        </Alert>
        <RequestStatusCard request={pendingRequest} />
      </div>
    );
  }

  // Check if there's an approved request with a store
  const approvedWithStore = existingRequests.find(r => r.status === 'APPROVED' && r.createdStore);
  
  if (approvedWithStore) {
    return (
      <div className="space-y-6">
        <RequestStatusCard request={approvedWithStore} />
      </div>
    );
  }

  // Show existing requests history and form
  return (
    <div className="space-y-6">
      {existingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previous Requests</h3>
          {existingRequests.map((request) => (
            <RequestStatusCard key={request.id} request={request} />
          ))}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Request a New Store</CardTitle>
          <CardDescription>
            Fill out the form below to request a new store. Our team will review your request 
            and get back to you within 24-48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoreRequestForm 
            defaultValues={{
              businessName: user.businessName || '',
              businessCategory: user.businessCategory || '',
              businessPhone: user.phoneNumber || '',
              businessEmail: user.email || '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function StoreRequestPage() {
  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Request a Store</h1>
        <p className="text-muted-foreground">
          Submit a request to create your own store on our platform
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      }>
        <StoreRequestContent />
      </Suspense>
    </div>
  );
}
