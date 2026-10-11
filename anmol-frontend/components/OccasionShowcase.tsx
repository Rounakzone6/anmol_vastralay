'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function OccasionShowcase() {
  const occasions = [
    {
      title: 'Dussehra & Vijayadashami Weaves',
      subtitle: 'Pure Banarasi silk & mustard gold sarees celebrating the victory of light.',
      image: '/banners/dussehra_festival.jpg',
      href: '/collections/sarees',
      tag: 'DUSSEHRA SPECIAL',
    },
    {
      title: 'Karwa Chauth Moonlit Romance',
      subtitle: 'Royal crimson red bridal lehengas, silk sarees & zardozi embroidery for sacred rituals.',
      image: '/banners/karwa_chauth.jpg',
      href: '/collections/lehengas',
      tag: 'KARWA CHAUTH EDIT',
    },
    {
      title: 'Diwali Deepotsav: Women & Girls',
      subtitle: 'Shimmering sequins Anarkalis, designer lehengas & matching festive sets.',
      image: '/banners/diwali_women_girls.jpg',
      href: '/collections/kurtis-suits',
      tag: 'DIWALI SPECIAL',
    },
    {
      title: 'Chhath Puja Mahaparv Arghya Weaves',
      subtitle: 'Auspicious turmeric yellow & vermillion red handloom pure silk sarees for holy offerings.',
      image: '/banners/chhath_puja.jpg',
      href: '/collections/sarees',
      tag: 'CHHATH PUJA 2026',
    },
  ];

  return (
    <section className="bg-[#f5f0e8]/60 py-16 sm:py-24 border-y border-[#e6dbcc]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#85142b] mb-2">
              <Sparkles size={14} className="text-[#c59b27]" />
              Curated By Celebration
            </div>
            <h2 className="font-serif-luxury text-3xl sm:text-5xl font-bold text-[#1c1417] tracking-tight">
              Shop By Royal Occasion
            </h2>
          </div>
          <p className="mt-3 md:mt-0 text-sm sm:text-base text-gray-600 max-w-md font-light">
            Every ceremony deserves an ensemble that embodies poise, auspicious grandeur, and timeless luxury.
          </p>
        </div>

        {/* 4 Occasion Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {occasions.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group relative h-[440px] sm:h-[480px] rounded-3xl overflow-hidden border border-[#c59b27]/30 shadow-md hover:shadow-2xl transition-all duration-500 block"
            >
              {/* Background Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12090e] via-[#12090e]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

              {/* Card Tag Top */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold tracking-widest uppercase text-white shadow-sm">
                  {item.tag}
                </span>
              </div>

              {/* Bottom Card Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex flex-col justify-end">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-serif-luxury text-2xl font-bold text-white group-hover:text-[#f3dfa2] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#85142b] group-hover:scale-110 transition-all duration-300">
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                <p className="text-xs text-gray-300 font-light line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
