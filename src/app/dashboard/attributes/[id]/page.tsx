// src/app/dashboard/attributes/[id]/page.tsx
// Edit Attribute Page

import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributeForm } from '@/components/attribute-form';
import { AttributeEditClient } from '@/components/attribute-edit-client';

export const metadata = {
  title: 'Edit Attribute | Dashboard | StormCom',
  description: 'Edit product attribute',
};

// No SSR data fetching to avoid Prisma runtime constraints; client layer will fetch

export default async function EditAttributePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const storeId = 'clqm1j4k00000l8dw8z8r8z8r';

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Attribute</h1>
        <p className="text-muted-foreground">
          Update attribute details and values
        </p>
      </div>

      <AttributeEditClient id={id} storeId={storeId} />
    </div>
  );
}
