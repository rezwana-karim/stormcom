/**
 * Webhooks Management Page
 * 
 * Dashboard page for managing webhooks and webhook subscriptions.
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WebhooksList } from '@/components/webhooks/webhooks-list';

export const metadata = {
  title: 'Webhooks | Dashboard | StormCom',
  description: 'Manage webhooks and event subscriptions',
};

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          Configure webhooks to receive real-time event notifications
        </p>
      </div>

      <Suspense fallback={<div>Loading webhooks...</div>}>
        <WebhooksList />
      </Suspense>
    </div>
  );
}
