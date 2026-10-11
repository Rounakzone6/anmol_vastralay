'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import ProductCard from '@/components/ProductCard';
import { Sparkles, ArrowRight, ChevronRight, Crown } from 'lucide-react';

interface RoyalCuratedTabsProps {
  initialProducts?: any[];
}

export default function RoyalCuratedTabs({ initialProducts = [] }: RoyalCuratedTabsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'sarees' | 'lehengas' | 'kurtis-suits'>('all');

  const { data: productsData, isLoading } = trpc.product.list.useQuery(
    {
      pageSize: 8,
      categorySlug: activeTab === 'all' ? undefined : activeTab,
      includeInactive: false,
    },
    {
      initialData: activeTab === 'all' && initialProducts.length 
        ? { items: initialProducts.slice(0, 8), total: initialProducts.length, page: 1, pageSize: 8, totalPages: 1 } 
        : undefined,
    }
  );

  const products = productsData?.items || [];

  const tabs = [
    { id: 'all', label: 'All Masterpieces', icon: '✨', slug: '/collections' },
    { id: 'sarees', label: 'Royal Sarees', icon: '🥻', slug: '/collections/sarees' },
    { id: 'lehengas', label: 'Bridal Lehengas', icon: '👑', slug: '/collections/lehengas' },
    { id: 'kurtis-suits', label: 'Kurtis & Suits', icon: '🌸', slug: '/collections/kurtis-suits' },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-8 py-10 sm:py-16">
      {/* Header with Luxury Brand Flourish */}
      <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#85142b]/10 border border-[#85142b]/20 text-[#85142b] text-xs font-bold uppercase tracking-widest mb-3">
          <Crown size={14} className="text-[#c59b27]" />
          Curated Royal Trousseau
        </div>

        <h2 className="font-serif-luxury text-3xl sm:text-5xl font-bold text-[#1c1417] tracking-tight mb-3">
          Handcrafted Elegance & Master Weaves
        </h2>

        <p className="text-sm sm:text-base text-gray-600 max-w-xl font-light">
          Each ensemble tells a story of generations of Indian artisan craftsmanship, pure silk, and radiant zari borders.
        </p>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mt-6 sm:mt-8 p-1.5 rounded-full bg-white border border-[#e8ded1] shadow-xs overflow-x-auto max-w-full hide-scrollbar">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#85142b] to-[#a01a35] text-white shadow-md shadow-[#85142b]/25 border border-[#c59b27]/30'
                    : 'text-gray-700 hover:text-[#85142b] hover:bg-[#faf7f2]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#ede5d8] animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#eee7dc]" />
              <div className="p-4 space-y-2.5">
                <div className="h-3 bg-[#eee7dc] rounded-full w-1/3" />
                <div className="h-4 bg-[#eee7dc] rounded-full w-4/5" />
                <div className="h-4 bg-[#eee7dc] rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#ede5d8] p-8">
          <p className="text-lg font-serif-luxury font-bold text-gray-800">
            Fresh Weaves Arriving Soon
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Our master weavers are completing exclusive pieces for this collection. Explore our full gallery in the meantime.
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-full bg-[#85142b] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#6c1023] transition-colors"
          >
            Explore All Collections <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product: any, idx: number) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}

      {/* Bottom View All Link */}
      <div className="mt-12 text-center">
        <Link
          href={tabs.find(t => t.id === activeTab)?.slug || '/collections'}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-[#85142b] text-[#85142b] hover:bg-[#85142b] hover:text-white font-bold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <span>View All In This Edit</span>
          <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}
