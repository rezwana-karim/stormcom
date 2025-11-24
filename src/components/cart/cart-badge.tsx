/**
 * Cart Badge Component
 * Displays cart item count with real-time updates
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CartBadgeProps {
  storeId: string;
  className?: string;
}

export function CartBadge({ storeId, className }: CartBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/cart/count?storeId=${storeId}`);
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch cart count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [storeId]);

  if (loading) {
    return null;
  }

  return (
    <Link href="/dashboard/cart">
      <Button variant="ghost" size="sm" className={className}>
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </div>
      </Button>
    </Link>
  );
}
