'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';

interface CategorySectionProps {
  title: string;
  slug: string;
  viewAllLink?: string;
  initialProducts?: any[];
}

export default function CategorySection({
  title,
  slug,
  viewAllLink,
  initialProducts = [],
}: CategorySectionProps) {
  const { data: productsData, isLoading, error } = trpc.product.list.useQuery(
    {
      categorySlug: slug,
      pageSize: 4,
      includeInactive: false,
    },
    {
      initialData: initialProducts.length
        ? { items: initialProducts.slice(0, 4), total: initialProducts.length, page: 1, pageSize: 4, totalPages: 1 }
        : undefined,
    }
  );

  const products = productsData?.items || [];
  const targetLink = viewAllLink || `/collections/${slug}`;

  if (!isLoading && products.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-8 mb-16 sm:mb-24">
      {/* Header */}
      <div className="mb-8 sm:mb-10 flex items-end justify-between border-b border-[#e6dbcc] pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#85142b] block mb-1">
            FEATURED WEAVES
          </span>
          <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-[#1c1417]">
            {title}
          </h2>
        </div>

        <Link
          href={targetLink}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#85142b] hover:text-[#6c1023] transition-colors"
        >
          <span>View All {title}</span>
          <ArrowRight size={15} className="transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#ede5d8] animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#eee7dc]" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-[#eee7dc] rounded-full w-1/3" />
                <div className="h-4 bg-[#eee7dc] rounded-full w-4/5" />
                <div className="h-4 bg-[#eee7dc] rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-sm">
          Failed to load {title}.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product: any, idx: number) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
