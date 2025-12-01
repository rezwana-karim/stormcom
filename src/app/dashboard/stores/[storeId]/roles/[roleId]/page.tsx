/**
 * Edit Custom Role Page
 * 
 * Allows store owners to edit existing custom roles
 */

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
import { EditRoleForm } from "@/components/store/roles/edit-role-form";

interface PageProps {
  params: Promise<{ storeId: string; roleId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Custom Role | Store",
  description: "Edit an existing custom role",
};

export default async function EditCustomRolePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  const { storeId, roleId } = await params;
  
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
  
  // Get store
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true },
  });
  
  if (!store) {
    notFound();
  }
  
  // Get role
  const role = await prisma.customRole.findFirst({
    where: { 
      id: roleId,
      storeId,
    },
    include: {
      _count: {
        select: { staffAssignments: true },
      },
    },
  });
  
  if (!role) {
    notFound();
  }
  
  // Parse permissions
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(role.permissions);
  } catch {
    permissions = [];
  }
  
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
          <h1 className="text-2xl font-bold tracking-tight">Edit Custom Role</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Editing &quot;{role.name}&quot; for {store.name}
        </p>
      </div>
      
      {/* Form */}
      <EditRoleForm 
        storeId={storeId}
        role={{
          id: role.id,
          name: role.name,
          description: role.description,
          permissions,
          isActive: role.isActive,
          staffCount: role._count.staffAssignments,
        }}
      />
    </div>
  );
}
