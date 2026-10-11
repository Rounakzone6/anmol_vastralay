'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

const FALLBACK_BANNERS = [
  {
    id: 'hero-dussehra',
    title: 'Dussehra & Vijayadashami Festive Weaves',
    subtitle: 'Opulent crimson red & mustard gold Banarasi silk sarees woven for triumph and celebration.',
    buttonText: 'Shop Dussehra Sarees',
    imageUrl: '/banners/dussehra_festival.jpg',
    linkUrl: '/collections/sarees',
    tag: 'DUSSEHRA FESTIVAL SPECIAL',
  },
  {
    id: 'hero-karwa-chauth',
    title: 'Karwa Chauth Moonlit Bridal Elegance',
    subtitle: 'Exquisite bridal lehengas & pure silk sarees crafted for eternal love and sacred rituals.',
    buttonText: 'Shop Karwa Chauth',
    imageUrl: '/banners/karwa_chauth.jpg',
    linkUrl: '/collections/lehengas',
    tag: 'KARWA CHAUTH BRIDAL EDIT',
  },
  {
    id: 'hero-diwali-women',
    title: 'Diwali Deepotsav: Women & Girls Royal Edit',
    subtitle: 'Radiant designer lehengas, sequins Anarkalis & festive matching mother-daughter couture.',
    buttonText: 'Explore Diwali Edit',
    imageUrl: '/banners/diwali_women_girls.jpg',
    linkUrl: '/collections/kurtis-suits',
    tag: 'DIWALI FESTIVAL SPECIAL',
  },
  {
    id: 'hero-chhath-puja',
    title: 'Chhath Puja Mahaparv: Sacred Handloom Weaves',
    subtitle: 'Auspicious turmeric yellow & vermillion red handloom pure silk sarees for Arghya offerings.',
    buttonText: 'Shop Chhath Sarees',
    imageUrl: '/banners/chhath_puja.jpg',
    linkUrl: '/collections/sarees',
    tag: 'CHHATH PUJA SPECIAL 2026',
  },
  {
    id: 'hero-diwali-men',
    title: "Diwali Celebration: Men & Boys Royal Ethnic Wear",
    subtitle: 'Matching royal navy blue & gold embroidered silk kurtas, Nehru jackets and festive sherwanis.',
    buttonText: "Shop Men's Diwali",
    imageUrl: '/banners/diwali_men_boys.jpg',
    linkUrl: '/collections/shirt-jeans',
    tag: 'DIWALI MENS & BOYS EDIT',
  },
];

export default function HeroSlider({ initialBanners = [] }: { initialBanners?: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: dbBanners } = trpc.banner.getBanners.useQuery(
    { placement: 'HERO' },
    { initialData: initialBanners.length ? initialBanners : undefined }
  );

  const banners = dbBanners && dbBanners.length > 0 ? dbBanners : FALLBACK_BANNERS;

  // Auto-play timer
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const next = () => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  return (
    <div 
      className="relative w-full overflow-hidden bg-[#12090e]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative h-[480px] sm:h-[580px] lg:h-[660px] xl:h-[720px] w-full">
        {banners.map((banner: any, index: number) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                priority={index === 0}
                sizes="100vw"
                className={`object-cover object-center transition-transform duration-10000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Rich Multi-Layer Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#12090e]/95 via-[#12090e]/60 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12090e] via-transparent to-black/30 z-10" />

              {/* Slide Content */}
              <div className="relative z-20 mx-auto max-w-[1600px] h-full flex flex-col justify-center px-6 sm:px-12 lg:px-20">
                <div className="max-w-2xl">
                  
                  {/* Luxury Tag Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/40 backdrop-blur-md mb-4 sm:mb-6 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#f3dfa2]" />
                    <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#f3dfa2] uppercase">
                      {banner.tag || 'ANMOL ROYAL COLLECTION'}
                    </span>
                  </div>

                  {/* Editorial Headline */}
                  <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#faf7f2] leading-[1.08] tracking-tight mb-4 sm:mb-6 drop-shadow-xl">
                    {banner.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-lg lg:text-xl text-[#e5ded6] font-light leading-relaxed mb-6 sm:mb-8 drop-shadow max-w-xl">
                    {banner.subtitle}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap items-center gap-3.5 sm:gap-5">
                    <Link
                      href={banner.linkUrl || '/collections'}
                      className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#85142b] to-[#a01a35] text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xl hover:shadow-2xl hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-300 border border-[#c59b27]/40"
                    >
                      <span>{banner.buttonText || 'Shop Collection'}</span>
                      <ArrowRight size={16} />
                    </Link>

                    <Link
                      href="/collections"
                      className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[#faf7f2] text-xs sm:text-sm font-semibold tracking-wider uppercase backdrop-blur-md border border-white/25 transition-all duration-300"
                    >
                      View All Catalog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls: Arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-[#85142b] text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-[#85142b] text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
      >
        <ChevronRight size={22} />
      </button>

      {/* Slide Indicators & Counter Bar */}
      <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 lg:left-20 z-30 flex items-center gap-4">
        {/* Counter */}
        <span className="text-xs sm:text-sm font-mono tracking-widest text-[#f3dfa2]">
          0{currentSlide + 1} <span className="opacity-40">/ 0{banners.length}</span>
        </span>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {banners.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                idx === currentSlide
                  ? 'w-8 bg-[#c59b27] shadow-sm shadow-[#c59b27]'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Luxury Features Floating Strip at Bottom */}
      <div className="relative z-20 border-t border-[#c59b27]/25 bg-[#170a11]/90 backdrop-blur-md py-3.5 px-4 sm:px-8">
        <div className="mx-auto max-w-[1600px] flex items-center justify-around flex-wrap gap-4 text-center text-xs font-medium text-[#e8ded2]">
          <div className="flex items-center gap-2">
            <span className="text-[#c59b27]">👑</span>
            <span className="tracking-wide">Direct-from-Weavers Pricing</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[#c59b27]">🧵</span>
            <span className="tracking-wide">100% Pure Silk & Zari Weaves</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#c59b27]">🚚</span>
            <span className="tracking-wide">Pan-India Insured Express Delivery</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[#c59b27]">✨</span>
            <span className="tracking-wide">Bridal Stylist & Video Shopping</span>
          </div>
        </div>
      </div>
    </div>
  );
}
