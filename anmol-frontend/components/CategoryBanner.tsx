'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface CategoryBannerProps {
  title: string;
  slug: string;
}

export default function CategoryBanner({ title, slug }: CategoryBannerProps) {
  const { data: banners, isLoading } = trpc.banner.getBanners.useQuery({
    placement: 'CATEGORY',
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20 mb-4">
        <div className="h-[250px] sm:h-[300px] w-full rounded-3xl bg-gray-100 animate-pulse relative overflow-hidden">
          {/* Skeleton pattern to make it look premium */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-[shimmer_2s_infinite]"></div>
          
          <div className="absolute inset-0 flex items-center px-8 sm:px-16 z-10">
            <div className="max-w-xl w-full">
              <div className="h-10 sm:h-12 w-3/4 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 w-1/2 bg-gray-200 rounded-md mb-8"></div>
              <div className="h-12 w-36 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find the banner for this specific category using linkUrl
  const banner = banners?.find((b) => b.linkUrl === slug);

  // Fallback defaults if banner is not found
  const details = {
    bgImage: banner?.imageUrl || null,
    gradient: banner?.imageUrl ? 'bg-black/30' : 'bg-gradient-to-r from-gray-800 to-black',
    titleColor: 'text-white',
    title: banner?.title || title,
    subtitle: banner?.subtitle || 'Discover our premium collection.',
    buttonText: banner?.buttonText || 'Shop Now',
    floatingImage: null,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-20 mb-4">
      <Link href={`/collections/${slug}`} className="group block relative overflow-hidden rounded-3xl h-[250px] sm:h-[300px] shadow-lg hover:shadow-2xl transition-all duration-300">
        
        {/* Full Image Background (if available) */}
        {details.bgImage ? (
          <>
            <Image 
              src={details.bgImage} 
              alt={details.title} 
              fill
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 ${details.gradient}`}></div>
          </>
        ) : (
          <div className={`absolute inset-0 ${details.gradient} transition-transform duration-700 group-hover:scale-105`}></div>
        )}

        {/* Content Wrapper */}
        <div className="absolute inset-0 flex items-center justify-between px-8 sm:px-16 z-10 overflow-hidden">
          {/* Text Content */}
          <div className="max-w-xl relative z-20">
            <h2 className={`text-4xl sm:text-5xl font-extrabold ${details.titleColor} mb-3 tracking-tight drop-shadow-lg`}>
              {details.title}
            </h2>
            <p className={`text-lg sm:text-xl ${details.titleColor} opacity-90 mb-8 drop-shadow-md font-medium`}>
              {details.subtitle}
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-bold group-hover:bg-white group-hover:text-black transition-colors duration-300">
              {details.buttonText} <ArrowRight size={18} />
            </div>
          </div>

          {/* Floating Icon (if available) */}
          {details.floatingImage && (
            <div className="hidden sm:block absolute right-0 bottom-0 h-[150%] w-1/2 max-w-[400px] pointer-events-none">
              <Image 
                src={details.floatingImage as any} 
                alt={details.title} 
                fill
                className="w-full h-full object-cover object-left transform translate-y-12 translate-x-12 group-hover:translate-y-8 group-hover:-translate-x-4 group-hover:scale-105 transition-transform duration-700 mix-blend-multiply opacity-60"
              />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
