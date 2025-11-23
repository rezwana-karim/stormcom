import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubscriptionsList } from '@/components/subscriptions/subscriptions-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscriptions',
  description: 'Manage your active subscriptions and plans',
};

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
          <p className="text-muted-foreground">
            Manage your subscription plans and billing
          </p>
        </div>
      </div>
      <Suspense fallback={<div>Loading subscriptions...</div>}>
        <SubscriptionsList />
      </Suspense>
    </div>
  );
}
