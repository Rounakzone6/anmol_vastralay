'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface CategoryBannerProps {
  title: string;
  slug: string;
}

function getFallbackCategoryBanner(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes('saree') || s.includes('silk')) {
    return {
      imageUrl: '/banners/dussehra_festival.jpg',
      tag: 'WEAVE OF THE GODS',
      title: 'Timeless Banarasi & Kanjivaram Sarees',
      subtitle: 'Pure mulberry silk with real gold and silver electroplated zari borders.',
    };
  }
  if (s.includes('lehenga') || s.includes('bridal')) {
    return {
      imageUrl: '/banners/karwa_chauth.jpg',
      tag: 'ROYAL COUTURE',
      title: 'Grand Wedding & Festive Lehengas',
      subtitle: 'Opulent mirror work, sequins, and velvet borders crafted for royal ceremonies.',
    };
  }
  if (s.includes('kurti') || s.includes('suit') || s.includes('indo') || s.includes('gown')) {
    return {
      imageUrl: '/banners/diwali_women_girls.jpg',
      tag: 'EVERYDAY MAJESTY',
      title: 'Designer Kurtis, Gowns & Festive Sets',
      subtitle: 'Lightweight flowy fabrics, organza dupattas, and contemporary regal drapes.',
    };
  }
  if (s.includes('men') || s.includes('shirt') || s.includes('jean') || s.includes('kurta')) {
    return {
      imageUrl: '/banners/diwali_men_boys.jpg',
      tag: 'GENTLEMEN’S EDIT',
      title: 'Royal Kurtas & Sherwani Couture',
      subtitle: 'Impeccable fits, celebratory hues, and heritage hand-embroidered necklines.',
    };
  }
  if (s.includes('kid')) {
    return {
      imageUrl: '/banners/diwali_women_girls.jpg',
      tag: 'LITTLE CELEBRATIONS',
      title: 'Festive & Playful Kids Ethnic Wear',
      subtitle: 'Comfortable, ultra-soft pure cotton and silk-blend ensembles for little icons.',
    };
  }
  if (s.includes('chhath')) {
    return {
      imageUrl: '/banners/chhath_puja.jpg',
      tag: 'CHHATH MAHAPARV',
      title: 'Sacred Handloom Festive Sarees',
      subtitle: 'Pure auspicious silk and cotton weaves for divine arghya rituals.',
    };
  }

  return {
    imageUrl: '/banners/dussehra_festival.jpg',
    tag: 'ANMOL EXCLUSIVE',
    title: `Discover ${slug}`,
    subtitle: 'Explore our latest arrivals handcrafted with passion and perfection.',
  };
}

export default function CategoryBanner({ title, slug }: CategoryBannerProps) {
  const { data: banners } = trpc.banner.getBanners.useQuery({
    placement: 'CATEGORY',
  });

  const banner = banners?.find((b) => b.linkUrl === slug || b.linkUrl?.includes(slug));
  const fallback = getFallbackCategoryBanner(slug);

  const bannerTitle = banner?.title || fallback.title || title;
  const bannerSubtitle = banner?.subtitle || fallback.subtitle;
  const bannerImage = banner?.imageUrl || fallback.imageUrl;
  const bannerTag = fallback.tag;

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-8 mt-16 sm:mt-24 mb-6">
      <Link
        href={`/collections/${slug}`}
        className="group relative block h-[260px] sm:h-[340px] rounded-3xl overflow-hidden border border-[#c59b27]/30 shadow-xl hover:shadow-2xl transition-all duration-500"
      >
        {/* Background Image */}
        <Image
          src={bannerImage}
          alt={bannerTitle}
          fill
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
        />

        {/* Multi-layer Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#12090e]/95 via-[#12090e]/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center px-6 sm:px-14 z-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c59b27]/25 text-[#f3dfa2] text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 backdrop-blur-md border border-[#c59b27]/40 shadow-sm">
              <Sparkles size={12} />
              {bannerTag}
            </span>

            <h2 className="font-serif-luxury text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-md">
              {bannerTitle}
            </h2>

            <p className="text-xs sm:text-base text-gray-200 line-clamp-2 mb-6 font-light drop-shadow max-w-lg">
              {bannerSubtitle}
            </p>

            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#1c1417] text-xs sm:text-sm font-bold uppercase tracking-wider group-hover:bg-[#85142b] group-hover:text-white transition-all duration-300 shadow-md">
              <span>Explore Collection</span>
              <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
