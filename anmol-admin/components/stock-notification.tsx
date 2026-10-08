'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';

export function StockNotification() {
  const router = useRouter();
  const previousIds = useRef<Set<string>>(new Set());

  // Poll every 15 seconds
  const { data: outOfStockVariants } = trpc.product.getOutOfStockVariants.useQuery(undefined, {
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!outOfStockVariants) return;

    const currentIds = new Set(outOfStockVariants.map(v => v.id));

    outOfStockVariants.forEach((variant) => {
      // If we haven't seen this variant out of stock recently
      if (!previousIds.current.has(variant.id)) {
        toast.warning(
          `Product Out of Stock: ${variant.product.name} ${variant.color ? '(' + variant.color + ')' : ''}`,
          {
            description: 'This item has reached 0 quantity.',
            duration: 10000,
            action: {
              label: 'Manage',
              onClick: () => router.push(`/products/${variant.product.slug}`),
            },
          }
        );
      }
    });

    previousIds.current = currentIds;
  }, [outOfStockVariants, router]);

  return null;
}
