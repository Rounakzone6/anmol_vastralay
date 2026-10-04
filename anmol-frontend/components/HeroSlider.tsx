'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { trpc } from '@/lib/trpc';

export default function HeroSlider({ initialBanners = [] }: { initialBanners?: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners, isLoading } = trpc.banner.getBanners.useQuery({
    placement: 'HERO',
  }, { initialData: initialBanners.length ? initialBanners : undefined });

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const nextSlide = () => {
    if (!banners) return;
    setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (!banners) return;
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  if (isLoading || !banners || banners.length === 0) {
    return (
      <div className="relative min-h-90 h-[clamp(360px,42vw,620px)] max-h-155 overflow-hidden bg-gray-200">
        {/* Shimmer Effect Skeleton */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent"></div>
        <div className="absolute inset-0 flex items-end px-5 pb-16 sm:items-center sm:px-10 sm:pb-0 lg:px-20">
          <div className="w-full max-w-xl animate-pulse">
            {/* Title Skeleton */}
            <div className="mb-3 h-9 w-4/5 rounded-md bg-gray-300/80 sm:h-12 lg:h-14"></div>
            <div className="mb-6 h-9 w-1/2 rounded-md bg-gray-300/80 sm:h-12 lg:h-14"></div>
            
            {/* Subtitle Skeleton */}
            <div className="mb-2 h-5 w-full rounded-md bg-gray-300/80 sm:h-7"></div>
            <div className="mb-6 h-5 w-4/5 rounded-md bg-gray-300/80 sm:h-7"></div>
            
            {/* Button Skeleton */}
            <div className="h-11 w-32 rounded-md bg-gray-300/80"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-110 h-[clamp(400px,42vw,650px)] max-h-180 overflow-hidden bg-gray-950">
      {/* Slides */}
      <div 
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner: any, index: number) => (
          <div key={banner.id} className="min-w-full relative h-full">
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 z-10 bg-linear-to-r from-black/65 via-black/20 to-transparent"></div>
            <div className="relative z-20 flex h-full items-end px-5 pb-14 sm:items-center sm:px-10 sm:pb-0 lg:px-20">
              <div className="w-full max-w-xl rounded-xl border border-white/20 bg-black/35 p-5 shadow-xl backdrop-blur-md sm:rounded-2xl sm:p-8">
                <h2 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:mb-4 sm:text-4xl lg:text-5xl">
                  {banner.title}
                </h2>
                <p className="mb-5 max-w-lg text-sm leading-relaxed text-gray-100 drop-shadow-md sm:mb-8 sm:text-lg lg:text-xl">
                  {banner.subtitle}
                </p>
                <button className="rounded-md bg-[#85142b] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6c1023] sm:px-8 sm:py-3 sm:text-base">
                  {banner.buttonText || 'Shop Now'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-gray-800 shadow-md transition-all hover:bg-white sm:left-5 sm:p-2"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-gray-800 shadow-md transition-all hover:bg-white sm:right-5 sm:p-2"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
        {banners.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              currentSlide === index ? 'bg-[#85142b] w-6' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
