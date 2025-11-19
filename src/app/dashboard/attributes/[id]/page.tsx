// src/app/dashboard/attributes/[id]/page.tsx
// Edit Attribute Page

import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributeForm } from '@/components/attribute-form';

export const metadata = {
  title: 'Edit Attribute | Dashboard | StormCom',
  description: 'Edit product attribute',
};

async function getAttribute(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/attributes/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching attribute:', error);
    return null;
  }
}

export default async function EditAttributePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const attribute = await getAttribute(params.id);

  if (!attribute) {
    notFound();
  }

  const storeId = 'clqm1j4k00000l8dw8z8r8z8r';

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Attribute</h1>
        <p className="text-muted-foreground">
          Update attribute details and values
        </p>
        {attribute._count?.productValues > 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ This attribute is used in {attribute._count.productValues} product(s)
          </p>
        )}
      </div>

      <AttributeForm
        attributeId={params.id}
        initialData={{
          name: attribute.name,
          values: attribute.values,
        }}
        storeId={storeId}
      />
    </div>
  );
}
