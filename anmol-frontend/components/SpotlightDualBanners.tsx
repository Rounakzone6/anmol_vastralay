'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function SpotlightDualBanners() {
  const spotlights = [
    {
      title: 'Karwa Chauth & Bridal Couture',
      subtitle: 'Exquisite moonlit crimson red lehengas & Banarasi silk sarees crafted for eternal love and sacred rituals.',
      cta: 'Explore Bridal Edit',
      href: '/collections/lehengas',
      image: '/banners/karwa_chauth.jpg',
      badge: 'KARWA CHAUTH SPECIAL',
      gradient: 'from-[#2b0814]/90 via-[#2b0814]/40 to-transparent',
    },
    {
      title: 'Diwali Men & Boys Royal Ethnic Sets',
      subtitle: 'Matching royal navy blue & gold embroidered silk kurtas, Nehru jackets and festive father-son ensembles.',
      cta: "Shop Men's Diwali",
      href: '/collections/shirt-jeans',
      image: '/banners/diwali_men_boys.jpg',
      badge: 'DIWALI MENSWEAR 2026',
      gradient: 'from-[#0b142b]/90 via-[#0b142b]/40 to-transparent',
    },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-8 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {spotlights.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="group relative h-[360px] sm:h-[440px] rounded-3xl overflow-hidden border border-[#c59b27]/30 shadow-lg hover:shadow-2xl transition-all duration-500 block"
          >
            {/* Background Image */}
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
            />

            {/* Gradient Overlays */}
            <div className={`absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r ${item.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 z-10">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c59b27]/25 text-[#f3dfa2] text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 backdrop-blur-md border border-[#c59b27]/40">
                  <Sparkles size={12} />
                  {item.badge}
                </span>

                <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-white leading-tight mb-2.5 drop-shadow-md">
                  {item.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 mb-6 font-light leading-relaxed drop-shadow">
                  {item.subtitle}
                </p>

                <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#f3dfa2] transition-colors">
                  <span className="border-b border-[#c59b27] pb-1">{item.cta}</span>
                  <ArrowRight size={16} className="transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
