/**
 * Create Custom Role Page
 * 
 * Allows store owners to create new custom roles
 */

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  IconArrowLeft,
  IconUserShield,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateRoleForm } from "@/components/store/roles/create-role-form";

interface PageProps {
  params: Promise<{ storeId: string }>;
}

export const metadata: Metadata = {
  title: "Create Custom Role | Store",
  description: "Create a new custom role with specific permissions",
};

export default async function CreateCustomRolePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  const { storeId } = await params;
  
  // Check if user is store owner
  const ownerMembership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      role: "OWNER",
      organization: {
        store: { id: storeId }
      }
    },
  });
  
  if (!ownerMembership) {
    notFound();
  }
  
  // Get store with role usage
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { 
      id: true, 
      name: true,
      customRoleLimit: true,
      _count: {
        select: { customRoles: true },
      },
    },
  });
  
  if (!store) {
    notFound();
  }
  
  const usage = {
    current: store._count.customRoles,
    limit: store.customRoleLimit,
    remaining: Math.max(0, store.customRoleLimit - store._count.customRoles),
  };
  
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link 
          href={`/dashboard/stores/${storeId}/roles`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <IconArrowLeft className="h-4 w-4 mr-1" />
          Back to roles
        </Link>
        <div className="flex items-center gap-2">
          <IconUserShield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Create Custom Role</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Create a new custom role for {store.name}
        </p>
      </div>
      
      {/* Form */}
      <Suspense fallback={<FormSkeleton />}>
        <CreateRoleForm storeId={storeId} usage={usage} />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
