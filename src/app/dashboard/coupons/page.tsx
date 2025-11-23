import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CouponsList } from '@/components/coupons/coupons-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coupons & Discounts',
  description: 'Manage discount coupons and promo codes',
};

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons & Discounts</h2>
          <p className="text-muted-foreground">
            Create and manage discount codes for your store
          </p>
        </div>
      </div>
      <Suspense fallback={<div>Loading coupons...</div>}>
        <CouponsList />
      </Suspense>
    </div>
  );
}
