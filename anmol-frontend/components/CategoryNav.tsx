'use client';

import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
  { name: 'Saree', slug: 'saree', image: '/category-icons/cat_saree_1781796874870.png' },
  { name: 'Lehenga', slug: 'lehenga', image: '/category-icons/cat_lehenga_1781796890751.png' },
  { name: 'Kurti', slug: 'kurti', image: '/category-icons/cat_kurti_1781796902125.png' },
  { name: 'Jeans', slug: 'jeans', image: '/category-icons/cat_jeans_1781796913798.png' },
  { name: 'Shirt', slug: 'shirt', image: '/category-icons/cat_shirt_1781796925235.png' },
  { name: 'Kids', slug: 'kids', image: '/category-icons/cat_kids_1781796936205.png' },
  { name: 'Suiting', slug: 'suiting', image: '/category-icons/cat_suiting_1781796955795.png' },
  { name: 'T-Shirt', slug: 'tshirt', image: '/category-icons/cat_tshirt_1781796978851.png' },
  { name: 'Innerwear', slug: 'innerwear', image: '/category-icons/cat_innerwear_1781796989469.png' },
  { name: 'Bedsheet', slug: 'bedsheet', image: '/category-icons/cat_bedsheet_1781797000413.png' },
  { name: 'Macchardani', slug: 'macchardani', image: '/category-icons/download.jpg' },
];

export default function CategoryNav() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-start sm:justify-center overflow-x-auto py-4 gap-4 sm:gap-8 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.slug} 
              href={`/collections?category=${cat.slug}`}
              className="flex flex-col items-center flex-shrink-0 group w-16 sm:w-20"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg relative">
                <Image 
                  src={cat.image} 
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="object-cover mix-blend-multiply"
                />
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
