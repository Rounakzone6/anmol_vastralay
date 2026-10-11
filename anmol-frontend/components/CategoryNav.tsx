'use client';

import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef } from 'react';

function getCategoryImage(category: { slug?: string; name?: string }) {
  const value = `${category.slug || ''} ${category.name || ''}`.toLowerCase();

  if (value.includes('indo') || value.includes('gown')) return '/category-icons/cat_indo_western.jpg';
  if (value.includes('lehenga')) return '/category-icons/cat_bridal_lehenga.jpg';
  if (value.includes('saree') || value.includes('silk')) return '/category-icons/cat_festive_saree.jpg';
  if (value.includes('kurti') || value.includes('anarkali')) return '/category-icons/cat_kurti_suits.jpg';
  if (value.includes('mens-ethnic') || value.includes('kurta') || value.includes('sherwani')) return '/category-icons/cat_mens_ethnic.jpg';
  if (value.includes('kid')) return '/category-icons/cat_kids_festive.jpg';
  if (value.includes('dupatta') || value.includes('shawl')) return '/category-icons/cat_dupattas_shawls.jpg';
  if (value.includes('jean') || value.includes('shirt')) return '/category-icons/cat_shirt_jeans.jpg';
  if (value.includes('suiting') || value.includes('fabric')) return '/category-icons/cat_suiting_1781796955795.png';
  if (value.includes('winter')) return '/category-icons/cat_winter_wear.jpg';
  if (value.includes('inner')) return '/category-icons/cat_innerwear_1781796989469.png';
  if (value.includes('accessor')) return '/category-icons/cat_accessories_1781796966847.png';

  return '/category-icons/cat_festive_saree.jpg';
}

export default function CategoryNav({ initialCategories = [] }: { initialCategories?: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: categoriesData, isLoading } = trpc.category.list.useQuery(
    { includeInactive: false },
    { initialData: initialCategories.length ? initialCategories : undefined }
  );

  const categories = categoriesData || initialCategories || [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="bg-[#faf7f2] border-b border-[#e9dfd0] py-6">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <div className="flex items-center justify-between gap-6 overflow-x-auto hide-scrollbar">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 animate-pulse min-w-[80px]">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#ede5d8]" />
                <div className="h-3 w-14 rounded-full bg-[#ede5d8]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <nav aria-label="Curated Categories" className="relative bg-[#fcfaf7] border-b border-[#e8ded1] shadow-xs">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 relative py-4 sm:py-5">
        
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/95 text-[#85142b] shadow-md border border-[#c59b27]/30 hover:bg-[#85142b] hover:text-white transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Categories Horizontal Carousel */}
        <div
          ref={scrollRef}
          className="flex items-center gap-4 sm:gap-8 overflow-x-auto hide-scrollbar scroll-smooth py-1 px-1"
        >
          {categories.map((cat: any) => {
            const iconSrc = cat.imageUrl || getCategoryImage(cat);
            return (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className="group flex flex-col items-center flex-shrink-0 focus:outline-none"
              >
                {/* Ring Outer Container with Gold Accent */}
                <div className="relative p-0.5 rounded-full bg-gradient-to-br from-[#c59b27]/40 via-transparent to-[#85142b]/30 group-hover:from-[#c59b27] group-hover:to-[#85142b] transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white border-2 border-white shadow-inner">
                    <Image
                      src={iconSrc}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 64px, 80px"
                      className="object-cover object-center p-1.5 transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Category Label */}
                <span className="mt-2 text-center text-xs sm:text-sm font-semibold tracking-wide text-[#2e1d23] group-hover:text-[#85142b] transition-colors line-clamp-1 max-w-[90px] sm:max-w-[105px]">
                  {cat.name}
                </span>

                {/* Subtle active underline dot */}
                <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-[#c59b27] transition-all mt-0.5" />
              </Link>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/95 text-[#85142b] shadow-md border border-[#c59b27]/30 hover:bg-[#85142b] hover:text-white transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
