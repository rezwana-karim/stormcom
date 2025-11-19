// src/app/dashboard/attributes/new/page.tsx
// Create New Attribute Page

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributeForm } from '@/components/attribute-form';

export const metadata = {
  title: 'New Attribute | Dashboard | StormCom',
  description: 'Create a new product attribute',
};

export default async function NewAttributePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Use demo store ID for now
  const storeId = 'clqm1j4k00000l8dw8z8r8z8r';

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Attribute</h1>
        <p className="text-muted-foreground">
          Add a new product attribute like color or size
        </p>
      </div>

      <AttributeForm storeId={storeId} />
    </div>
  );
}
