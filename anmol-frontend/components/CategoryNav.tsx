'use client';

import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';

function getCategoryImage(category: { slug?: string; name?: string }) {
  const value = `${category.slug || ''} ${category.name || ''}`.toLowerCase();

  if (value.includes('lehenga')) return '/category-icons/cat_lehenga_1781796890751.png';
  if (value.includes('kurti')) return '/category-icons/cat_kurti_1781796902125.png';
  if (value.includes('inner')) return '/category-icons/cat_innerwear_1781796989469.png';
  if (value.includes('kid')) return '/category-icons/cat_kids_1781796936205.png';
  if (value.includes('shirt') || value.includes('jean')) return '/category-icons/cat_shirt_1781796925235.png';
  if (value.includes('suit')) return '/category-icons/cat_suiting_1781796955795.png';
  if (value.includes('accessor')) return '/category-icons/cat_accessories_1781796966847.png';
  if (value.includes('bed')) return '/category-icons/cat_bedsheet_1781797000413.png';
  if (value.includes('saree') || value.includes('silk') || value.includes('suti') || value.includes('sefon')) {
    return '/category-icons/cat_saree_1781796874870.png';
  }

  return '/category-icons/cat_accessories_1781796966847.png';
}

export default function CategoryNav({ initialCategories = [] }: { initialCategories?: any[] }) {
  const { data: categories, isLoading, error } = trpc.category.list.useQuery(undefined, { initialData: initialCategories.length ? initialCategories : undefined });

  if (error) {
    return (
      <div className="bg-red-50 border-b border-red-200 py-4 text-center text-sm text-red-600">
        Error loading categories: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border-b border-[#e7e7e7] bg-[#f5f5f5]">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between overflow-x-auto py-5 sm:py-6 gap-3 sm:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex min-w-[72px] flex-col items-center animate-pulse sm:min-w-[78px]">
                <div className="h-16 w-16 rounded-full bg-[#ececec] sm:h-[72px] sm:w-[72px]" />
                <div className="mt-3 h-3 w-12 rounded bg-[#ebebeb]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="border-b border-[#e7e7e7] bg-[#f5f5f5] py-4 text-center text-sm text-gray-500">
        No categories available. Please add categories in the admin panel.
      </div>
    );
  }

  return (
    <div className="border-b border-[#e7e7e7] bg-[#f5f5f5]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between overflow-x-auto py-5 sm:py-6 gap-3 sm:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="group flex min-w-[72px] flex-shrink-0 flex-col items-center sm:min-w-[82px]"
            >
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#e5e5e5] bg-[#f0f0f0] shadow-sm transition-shadow duration-200 group-hover:shadow-md sm:h-[72px] sm:w-[72px]">
                <Image
                  src={cat.imageUrl || getCategoryImage(cat)}
                  alt={cat.name}
                  fill
                  priority={true}
                  sizes="(max-width: 640px) 64px, 72px"
                  className="object-cover"
                />
              </div>
              <span className="mt-3 text-center text-[11px] font-medium leading-tight text-gray-700 transition-colors group-hover:text-[#85142b] sm:text-sm">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
