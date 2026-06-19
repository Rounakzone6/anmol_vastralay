'use client';

import Link from 'next/link';
import { trpc } from '../lib/trpc';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function LatestArrivals() {
  const {
    data: productsData,
    isLoading,
    error,
  } = trpc.product.list.useQuery({
    pageSize: 8,
    includeInactive: false,
  });

  const products = productsData?.items || [];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 mb-16">
      {/* Section header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#85142b] mb-1.5">
            Fresh In
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight relative inline-block">
            Latest Arrivals
            <span className="absolute -bottom-2 left-0 w-10 h-1 bg-[#85142b] rounded-full" />
          </h2>
        </div>
        <Link
          href="/collections"
          className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#85142b] hover:text-[#6c1023] hover:underline transition-colors"
        >
          View All <ChevronRight size={15} />
        </Link>
      </div>

      {isLoading ? (
        /* Skeleton grid */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div
                className="skeleton-shimmer w-full"
                style={{ paddingBottom: '130%' }}
              />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-3 skeleton-shimmer rounded-full w-1/3" />
                <div className="h-4 skeleton-shimmer rounded-full w-4/5" />
                <div className="h-5 skeleton-shimmer rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-red-500">Error loading products. Please try again.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
          <ShoppingBag size={52} strokeWidth={1} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">New products coming soon — stay tuned!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {products.map((product, idx) => (
              <ProductCard key={product.id} product={product as any} index={idx} />
            ))}
          </div>

          {/* Mobile view-all link */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 px-8 py-3 rounded-full border-2 border-[#85142b] text-[#85142b] font-bold text-sm hover:bg-[#85142b] hover:text-white transition-all"
            >
              View All Products <ChevronRight size={15} />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
