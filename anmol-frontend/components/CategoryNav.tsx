'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';
import { ChevronRight, ChevronLeft } from 'lucide-react';

function getCategoryImage(category: { slug?: string; name?: string }) {
  const value = `${category.slug || ''} ${category.name || ''}`.toLowerCase();

  if (value.includes('indo') || value.includes('gown')) return '/category-icons/cat_indo_western.jpg';
  if (value.includes('lehenga')) return '/category-icons/cat_bridal_lehenga.jpg';
  if (value.includes('saree') || value.includes('silk')) return '/category-icons/cat_festive_saree.jpg';
  if (value.includes('kurti') || value.includes('suit') || value.includes('anarkali')) return '/category-icons/cat_kurti_suits.jpg';
  if (value.includes('mens') || value.includes('ethnic') || value.includes('kurta') || value.includes('sherwani')) return '/category-icons/cat_mens_ethnic.jpg';
  if (value.includes('kid')) return '/category-icons/cat_kids_festive.jpg';
  if (value.includes('dupatta') || value.includes('shawl')) return '/category-icons/cat_dupattas_shawls.jpg';
  if (value.includes('jean') || value.includes('shirt')) return '/category-icons/cat_shirt_jeans.jpg';
  if (value.includes('suiting') || value.includes('fabric')) return '/category-icons/cat_suiting_1781796955795.png';
  if (value.includes('winter')) return '/category-icons/cat_winter_wear.jpg';
  if (value.includes('inner')) return '/category-icons/cat_innerwear_1781796989469.png';
  if (value.includes('accessor')) return '/category-icons/cat_suiting_1781796955795.png';

  return '/category-icons/cat_festive_saree.jpg';
}

export default function CategoryNav({ initialCategories = [] }: { initialCategories?: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: categoriesData, isLoading } = trpc.category.list.useQuery(
    { includeInactive: false },
    { initialData: initialCategories.length ? initialCategories : undefined }
  );

  const categories = categoriesData || initialCategories || [];

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="bg-[#fcfaf7] border-b border-[#e8dfd3] py-5">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 animate-pulse shrink-0">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#ede5d8]" />
                <div className="h-3 w-16 rounded-full bg-[#ede5d8]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <nav aria-label="Curated Categories" className="relative bg-gradient-to-b from-[#fcfaf7] via-[#faf6f0] to-[#f6f0e6]/60 border-b border-[#e8ded0] shadow-xs select-none">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-6 relative py-4 sm:py-5">

        {/* Left Scroll Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll categories left"
            className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white text-[#85142b] shadow-lg border border-[#c59b27]/40 hover:bg-[#85142b] hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Categories Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex items-start gap-4 sm:gap-6 overflow-x-auto hide-scrollbar scroll-smooth px-2 py-1"
        >
          {categories.map((cat: any) => {
            const iconSrc = cat.imageUrl || getCategoryImage(cat);
            return (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className="group flex flex-col items-center shrink-0 w-22 sm:w-26 focus:outline-none transition-transform duration-200"
              >
                {/* Royal Medallion Ring */}
                <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-[#c59b27] via-[#f3dfa2] to-[#85142b] shadow-sm group-hover:shadow-md group-hover:from-[#d4af37] group-hover:to-[#b01e3f] group-hover:-translate-y-1 transition-all duration-300">
                  <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-white border-2 border-white shadow-inner">
                    <Image
                      src={iconSrc}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 72px, 88px"
                      className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                    {/* Subtle gold sheen overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                {/* Category Label (2-line support with clean height so text is never awkwardly truncated) */}
                <span className="mt-2 text-center text-xs sm:text-[13px] font-semibold text-[#2d1b22] group-hover:text-[#85142b] transition-colors line-clamp-2 leading-tight px-1 min-h-[32px] flex items-center justify-center">
                  {cat.name}
                </span>

                {/* Elegant active indicator line */}
                <div className="w-4 h-0.5 rounded-full bg-transparent group-hover:bg-[#c59b27] transition-all duration-300 transform scale-x-0 group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>

        {/* Right Scroll Navigation Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll categories right"
            className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white text-[#85142b] shadow-lg border border-[#c59b27]/40 hover:bg-[#85142b] hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </nav>
  );
}
