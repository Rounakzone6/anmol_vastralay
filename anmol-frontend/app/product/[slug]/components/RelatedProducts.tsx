'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../../../../components/ProductCard';

export function RelatedProducts({ suggestedProducts }: { suggestedProducts: any[] }) {
  if (!suggestedProducts || suggestedProducts.length === 0) return null;

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            You May Also Like
          </h2>
          <div className="mt-1.5 h-1 w-12 rounded-full bg-[#85142b]" />
        </div>
        <Link
          href="/collections"
          className="text-sm font-semibold text-[#85142b] hover:underline flex items-center gap-1"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {suggestedProducts.map((p, idx) => (
          <ProductCard key={p.id} product={p as any} index={idx} />
        ))}
      </div>
    </div>
  );
}
