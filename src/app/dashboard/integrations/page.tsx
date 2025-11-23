/**
 * Integrations Management Page
 * 
 * Dashboard page for managing third-party integrations.
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { IntegrationsList } from '@/components/integrations/integrations-list';

export const metadata = {
  title: 'Integrations | Dashboard | StormCom',
  description: 'Manage third-party integrations and connections',
};

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your store with popular services and tools
        </p>
      </div>

      <Suspense fallback={<div>Loading integrations...</div>}>
        <IntegrationsList />
      </Suspense>
    </div>
  );
}
