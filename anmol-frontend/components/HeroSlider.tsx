'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { trpc } from '../lib/trpc';

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners, isLoading } = trpc.banner.getBanners.useQuery({
    placement: 'HERO',
  });

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
      <div className="relative overflow-hidden bg-gray-200 h-[300px] sm:h-[400px] lg:h-[500px]">
        {/* Shimmer Effect Skeleton */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        <div className="absolute inset-0 flex items-center px-8 sm:px-16 lg:px-24">
          <div className="max-w-xl w-full animate-pulse">
            {/* Title Skeleton */}
            <div className="h-10 sm:h-12 lg:h-14 bg-gray-300/80 rounded-md w-3/4 mb-4"></div>
            <div className="h-10 sm:h-12 lg:h-14 bg-gray-300/80 rounded-md w-1/2 mb-8"></div>
            
            {/* Subtitle Skeleton */}
            <div className="h-6 sm:h-7 bg-gray-300/80 rounded-md w-full mb-3"></div>
            <div className="h-6 sm:h-7 bg-gray-300/80 rounded-md w-4/5 mb-8"></div>
            
            {/* Button Skeleton */}
            <div className="h-12 bg-gray-300/80 rounded-md w-36"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gray-50 h-[300px] sm:h-[400px] lg:h-[500px]">
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
              priority={index === 0}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="relative z-20 h-full flex items-center px-8 sm:px-16 lg:px-24">
              <div className="max-w-xl bg-black/30 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-white/20 shadow-xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
                  {banner.title}
                </h2>
                <p className="text-lg sm:text-xl text-gray-100 mb-8 drop-shadow-md">
                  {banner.subtitle}
                </p>
                <button className="bg-[#85142b] hover:bg-[#6c1023] text-white px-8 py-3 rounded-md font-medium transition-colors shadow-sm">
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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {banners.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentSlide === index ? 'bg-[#85142b] w-6' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
