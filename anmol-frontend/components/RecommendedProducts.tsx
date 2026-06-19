'use client';

import { trpc } from '../lib/trpc';
import ProductCard from './ProductCard';
import { getSessionId } from './ActivityTracker';
import { useEffect, useState } from 'react';

export default function RecommendedProducts() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  const { data, isLoading } = trpc.product.getRecommended.useQuery(
    { sessionId },
    { enabled: sessionId !== undefined }
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Recommended for You</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:gap-x-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return null; // Don't show anything if no recommendations
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 mt-12">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Recommended for You</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:gap-x-8">
        {data.items.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </div>
  );
}
