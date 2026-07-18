'use client';

import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';
import { ShoppingBag, Shirt, Baby, Wind, Sparkles, BoxSelect, Layers } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

function getCategoryIcon(slug: string) {
  switch(slug) {
    case 'shirt': return <Shirt className="w-10 h-10 sm:w-16 sm:h-16 text-blue-200" />;
    case 'kids': return <Baby className="w-10 h-10 sm:w-16 sm:h-16 text-pink-200" />;
    case 'jeans': return <Layers className="w-10 h-10 sm:w-16 sm:h-16 text-indigo-200" />;
    case 'saree': return <Wind className="w-10 h-10 sm:w-16 sm:h-16 text-rose-200" />;
    case 'kurti': return <Sparkles className="w-10 h-10 sm:w-16 sm:h-16 text-purple-200" />;
    case 'innerwear': return <BoxSelect className="w-10 h-10 sm:w-16 sm:h-16 text-orange-200" />;
    default: return <ShoppingBag className="w-10 h-10 sm:w-16 sm:h-16 text-gray-200" />;
  }
}

interface CategorySectionProps {
  title: string;
  slug: string;
  viewAllLink?: string;
}

export default function CategorySection({ title, slug, viewAllLink }: CategorySectionProps) {
  const { data: productsData, isLoading, error } = trpc.product.list.useQuery({
    categorySlug: slug,
    pageSize: 4, // Show top 4 items
    includeInactive: false
  });

  const products = productsData?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 mb-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight relative inline-block">
          {title}
          <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#85142b] rounded-full"></span>
        </h2>
        <Link 
          href={viewAllLink || `/collections?category=${slug}`} 
          className="text-sm font-medium text-[#85142b] hover:text-[#6c1023] hover:underline"
        >
          View All {title} &rarr;
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg aspect-[4/5] flex items-center justify-center overflow-hidden">
              <div className="animate-pulse flex flex-col items-center justify-center opacity-70">
                <div className="animate-bounce">
                  {getCategoryIcon(slug)}
                </div>
                <div className="h-2 w-16 bg-gray-200 rounded mt-4"></div>
                <div className="h-2 w-10 bg-gray-200 rounded mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">Error loading {title}.</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-100 border-dashed">
          <p className="text-gray-500 font-medium">New collection arriving soon!</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for exciting new {title.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {products.map((product: any, idx: number) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
