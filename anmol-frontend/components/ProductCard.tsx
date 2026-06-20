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
  images: { url: string }[];
  brand?: string;
  category?: { name: string };
  variants?: { color?: string; size?: string; stockQty?: number }[];
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

  const isNew = index < 4; // Mocking "New" badge for first 4
  const colors = product.variants
    ? Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
    : [];

  const totalStock = product.variants
    ? product.variants.reduce((acc, v) => acc + (v.stockQty || 0), 0)
    : 999;
  const isOutOfStock = totalStock === 0;

  const href = `/product/${product.slug || product.id}`;
  
  // E-commerce standard: show second image on hover if available
  const currentImage = isHovered && product.images?.length > 1 
    ? product.images[1].url 
    : (product.images?.[0]?.url || '');

  return (
    <div
      className="group relative flex flex-col w-full bg-white transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - Using 3:4 aspect ratio standard for fashion e-commerce */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 mb-3">
        <Link href={href} className="block w-full h-full">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
              No Image
            </div>
          )}
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Sold Out
            </span>
          ) : (
            <>
              {isNew && !discountPct && (
                <span className="bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                  New
                </span>
              )}
              {discountPct > 0 && (
                <span className="bg-[#ff3f6c] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-sm">
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
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-all duration-200 z-10 shadow-sm opacity-0 group-hover:opacity-100 sm:opacity-100 translate-y-1 group-hover:translate-y-0 sm:translate-y-0"
          aria-label="Wishlist"
        >
          <Heart
            size={16}
            className={`transition-colors ${isWishlisted ? 'fill-[#ff3f6c] text-[#ff3f6c]' : 'text-gray-600'}`}
          />
        </button>

        {/* Quick Add Overlay (Appears on Hover) - Premium touch */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden lg:block">
          <button 
            className="w-full bg-white/95 backdrop-blur-sm text-gray-900 font-semibold text-xs py-2.5 uppercase tracking-wider border border-gray-200 shadow-lg hover:bg-gray-900 hover:text-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic could go here
            }}
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Info Section - Minimalist approach */}
      <div className="flex flex-col px-1">
        <Link href={href} className="group-hover:opacity-80 transition-opacity">
          {product.brand && (
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-gray-900 mb-1 line-clamp-1">
              {product.brand}
            </h3>
          )}
          <p className="text-[13px] text-gray-500 font-normal line-clamp-1 mb-1.5" title={product.name}>
            {product.name}
          </p>
        </Link>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[14px] font-bold text-gray-900">
            ₹{netPrice.toLocaleString('en-IN')}
          </span>
          {mrp && (
            <span className="text-[12px] text-gray-400 line-through">
              ₹{Math.round(mrp).toLocaleString('en-IN')}
            </span>
          )}
          {discountPct > 0 && (
            <span className="text-[11px] font-bold text-orange-500">
              ({Math.round(discountPct)}% OFF)
            </span>
          )}
        </div>

        {/* Ratings (Mock) & Colors */}
        <div className="flex items-center justify-between mt-auto">
           {/* Mock Rating */}
           <div className="flex items-center gap-1">
             <Star size={10} className="fill-green-600 text-green-600" />
             <span className="text-[11px] font-bold text-gray-700">4.2</span>
             <span className="text-[10px] text-gray-400 border-l border-gray-300 pl-1 ml-0.5">128</span>
           </div>

           {/* Color Dots */}
           {colors.length > 0 && (
             <div className="flex gap-1 items-center">
               {colors.slice(0, 3).map((color, i) => (
                 <span
                   key={i}
                   className="w-3 h-3 rounded-full border border-gray-200 shadow-sm"
                   style={{ backgroundColor: getColorHex(color as string) }}
                   title={color as string}
                 />
               ))}
               {colors.length > 3 && (
                 <span className="text-[9px] text-gray-500 font-medium pl-0.5">+{colors.length - 3}</span>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
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
