import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EmailTemplatesList } from '@/components/emails/email-templates-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Templates',
  description: 'Manage email templates for your store',
};

export default async function EmailsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
      </div>
      <Suspense fallback={<div>Loading email templates...</div>}>
        <EmailTemplatesList />
      </Suspense>
    </div>
  );
}
