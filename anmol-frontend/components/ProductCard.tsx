'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, Star } from 'lucide-react';

interface Product {
  id: string;
  slug?: string;
  name: string;
  netPrice: number | string;
  mrp?: number | string;
  discountPercent?: number | string;
  images: { url: string; altText?: string }[];
  brand?: string;
  category?: { name: string };
  variants?: { color?: string; size?: string; stockQty?: number }[];
  averageRating?: number;
  reviewCount?: number;
  createdAt?: Date | string;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const netPrice = Number(product.netPrice);
  const discountPct = Number(product.discountPercent || 0);
  const mrp = discountPct > 0
    ? Number(product.mrp || netPrice * (1 + discountPct / 100))
    : null;

  const isNew = product.createdAt 
    ? (new Date().getTime() - new Date(product.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;
  const colors = product.variants
    ? Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
    : [];

  const totalStock = product.variants
    ? product.variants.reduce((acc, v) => acc + (v.stockQty || 0), 0)
    : 999;
  const isOutOfStock = totalStock === 0;

  const href = `/product/${product.slug || product.id}`;
  
  const currentImageObj = isHovered && product.images?.length > 1 
    ? product.images[1]
    : product.images?.[0];
    
  const currentImage = currentImageObj?.url || '';
  const currentAlt = currentImageObj?.altText || `${product.name} - ${product.category?.name || 'Anmol Vastralay'}`;

  return (
    <article
      className="group relative flex flex-col w-full bg-white rounded-2xl p-3 transition-all duration-300 hover:shadow-2xl border border-transparent hover:border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square overflow-hidden bg-[#faf9f7] rounded-xl mb-4 group-hover:bg-white transition-colors duration-300">
        <Link href={href} className="block w-full h-full">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={currentAlt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 transition-transform duration-700 ease-in-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              Sold Out
            </span>
          ) : (
            <>
              {isNew && !discountPct && (
                <span className="bg-[#85142b] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                  New
                </span>
              )}
              {discountPct > 0 && (
                <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                  -{Math.round(discountPct)}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Button - Absolute top right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((w) => !w);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 z-10 shadow hover:shadow-md opacity-0 group-hover:opacity-100 sm:opacity-100 translate-y-1 group-hover:translate-y-0 sm:translate-y-0"
          aria-label="Wishlist"
        >
          <Heart
            size={18}
            className={`transition-colors ${isWishlisted ? 'fill-[#85142b] text-[#85142b]' : 'text-gray-500'}`}
          />
        </button>

        {/* Quick Add Overlay (Appears on Hover) - Premium touch */}
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden lg:block">
          <button 
            className="w-full bg-white/95 backdrop-blur-md rounded-lg text-[#85142b] font-bold text-xs py-3 uppercase tracking-wider shadow-lg hover:bg-[#85142b] hover:text-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic could go here
            }}
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col px-1 flex-1">
        <Link href={href} className="group-hover:opacity-80 transition-opacity">
          {product.brand && (
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#85142b] mb-1 line-clamp-1">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm sm:text-base text-gray-800 font-semibold line-clamp-2 mb-2" title={product.name}>
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-baseline gap-2 mb-3 mt-auto pt-2">
          <span className="text-base sm:text-xl font-black text-gray-900 tracking-tight">
            ₹{netPrice.toLocaleString('en-IN')}
          </span>
          {mrp && (
            <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">
              ₹{Math.round(mrp).toLocaleString('en-IN')}
            </span>
          )}
          {discountPct > 0 && (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
              {Math.round(discountPct)}% OFF
            </span>
          )}
        </div>

        {/* Ratings (Mock) & Colors */}
        <div className="flex items-center justify-between mt-1 border-t border-gray-50 pt-3">
           {/* Dynamic Rating */}
           {product.reviewCount && product.reviewCount > 0 ? (
             <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
               <Star size={12} className="fill-yellow-400 text-yellow-400" />
               <span className="text-xs font-bold text-gray-700">
                 {product.averageRating ? product.averageRating.toFixed(1) : "0.0"}
               </span>
               <span className="text-[10px] text-gray-400 border-l border-gray-300 pl-1.5 ml-0.5">
                 {product.reviewCount}
               </span>
             </div>
           ) : (
             <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
               <Star size={12} className="text-gray-300" />
               <span className="text-xs font-medium text-gray-500">No reviews</span>
             </div>
           )}

           {/* Color Dots */}
           {colors.length > 0 && (
             <div className="flex gap-1 items-center">
               {colors.slice(0, 3).map((color, i) => (
                 <span
                   key={i}
                   className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm"
                   style={{ backgroundColor: getColorHex(color as string) }}
                   title={color as string}
                 />
               ))}
               {colors.length > 3 && (
                 <span className="text-[10px] text-gray-500 font-medium pl-1">+{colors.length - 3}</span>
               )}
             </div>
           )}
        </div>
      </div>
    </article>
  );
}

// ── Helper: map color names to approximate hex ──────────────────────────────
function getColorHex(colorName: string): string {
  const map: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
    black: '#1a1a1a', white: '#f5f5f5', pink: '#ec4899', purple: '#a855f7',
    orange: '#f97316', brown: '#92400e', grey: '#9ca3af', gray: '#9ca3af',
    maroon: '#85142b', navy: '#1e3a5f', beige: '#d4c5a9', cream: '#fffdd0',
    teal: '#14b8a6', cyan: '#06b6d4', gold: '#d4af37', silver: '#c0c0c0',
    violet: '#7c3aed', indigo: '#4f46e5', magenta: '#d946ef', peach: '#ffcba4',
    lavender: '#e6e6fa', olive: '#808000', khaki: '#c3b091', coral: '#ff7f50',
  };
  const key = colorName.toLowerCase().trim();
  return map[key] || '#d1d5db';
}
