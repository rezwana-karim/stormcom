/**
 * Cart Badge Component
 * Displays cart item count with real-time updates
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

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

  if (loading || count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={className}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
