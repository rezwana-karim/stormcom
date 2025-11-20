// src/app/dashboard/attributes/page.tsx
// Attributes List Page

import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AttributesPageClient } from '@/components/attributes-page-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Attributes | Dashboard | StormCom',
  description: 'Manage product attributes',
};

export default async function AttributesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attributes</h1>
        <p className="text-muted-foreground">
          Manage product attributes like color, size, and material
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Attributes</CardTitle>
          <CardDescription>
            Create and manage attributes that define product variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <AttributesPageClient />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
