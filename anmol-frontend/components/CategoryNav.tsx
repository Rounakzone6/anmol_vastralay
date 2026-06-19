'use client';

import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '../lib/trpc';
import { ShoppingBag } from 'lucide-react';

export default function CategoryNav() {
  const { data: categories, isLoading } = trpc.category.list.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-start sm:justify-center overflow-x-auto py-4 gap-4 sm:gap-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 group w-16 sm:w-20 animate-pulse">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200" />
                <div className="h-3 w-12 bg-gray-200 mt-3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-start sm:justify-center overflow-x-auto py-4 gap-4 sm:gap-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat: any) => (
            <Link 
              key={cat.id} 
              href={`/collections?category=${cat.slug}`}
              className="flex flex-col items-center flex-shrink-0 group w-16 sm:w-20"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg relative">
                {cat.imageUrl ? (
                  <Image 
                    src={cat.imageUrl} 
                    alt={cat.name}
                    fill
                    priority={true}
                    sizes="(max-width: 640px) 64px, 80px"
                    className="object-cover mix-blend-multiply"
                  />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <span className="mt-3 text-[11px] sm:text-sm font-medium text-gray-700 text-center group-hover:text-[#85142b] transition-colors leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
