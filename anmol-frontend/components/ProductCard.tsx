'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ShoppingBag, Heart, Star, Zap } from 'lucide-react';

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
  /** Optional: index for staggered animation delay */
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const netPrice = Number(product.netPrice);
  const discountPct = Number(product.discountPercent || 0);
  const mrp = discountPct > 0
    ? Number(product.mrp || netPrice * (1 + discountPct / 100))
    : null;

  const isNew = index < 4; // first 4 products get "New" badge
  const colors = product.variants
    ? Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
    : [];

  const totalStock = product.variants
    ? product.variants.reduce((acc, v) => acc + (v.stockQty || 0), 0)
    : 999;
  const isOutOfStock = totalStock === 0;

  const href = `/product/${product.slug || product.id}`;

  return (
    <div
      className="product-card group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Image Container ── */}
      <Link href={href} className="relative block overflow-hidden bg-[#faf9f7]" style={{ paddingBottom: '130%' }}>
        {product.images?.length > 0 ? (
          <>
            <Image
              src={product.images[imgIdx]?.url || product.images[0].url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            {/* second image on hover (if exists) */}
            {product.images.length > 1 && (
              <Image
                src={product.images[1].url}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 opacity-0 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <ShoppingBag size={48} strokeWidth={1} className="text-gray-200" />
          </div>
        )}

        {/* ── Overlay gradient for badges ── */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />

        {/* ── Badges ── */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discountPct > 0 && (
            <span className="inline-flex items-center gap-0.5 bg-[#85142b] text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md">
              <Zap size={10} fill="white" />
              {Math.round(discountPct)}% OFF
            </span>
          )}
          {isNew && !discountPct && (
            <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
              NEW
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
              Sold Out
            </span>
          )}
        </div>

        {/* ── Wishlist Button ── */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted((w) => !w);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:scale-110"
        >
          <Heart
            size={15}
            className={isWishlisted ? 'fill-[#85142b] stroke-[#85142b]' : 'stroke-gray-500'}
          />
        </button>

        {/* ── Color dot strip (bottom of image) ── */}
        {colors.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
            {colors.slice(0, 6).map((color, ci) => (
              <span
                key={ci}
                title={color as string}
                className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                style={{ background: getColorHex(color as string) }}
              />
            ))}
            {colors.length > 6 && (
              <span className="text-[9px] text-white font-bold bg-black/40 px-1 rounded">
                +{colors.length - 6}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* ── Info Section ── */}
      <div className="flex flex-col p-3 sm:p-4 flex-grow">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#85142b] mb-0.5 truncate">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <Link href={href}>
          <h3 className="text-sm sm:text-[15px] font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-[#85142b] transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Ratings placeholder — 4.2★ style */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            <Star size={8} fill="white" strokeWidth={0} />
            4.2
          </div>
          <span className="text-[10px] text-gray-400">(128)</span>
        </div>

        {/* Pricing */}
        <div className="mt-auto flex items-baseline gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-gray-900">
            ₹{netPrice.toLocaleString('en-IN')}
          </span>
          {mrp && (
            <span className="text-xs text-gray-400 line-through">
              ₹{Math.round(mrp).toLocaleString('en-IN')}
            </span>
          )}
          {discountPct > 0 && (
            <span className="text-xs font-bold text-green-600">
              {Math.round(discountPct)}% off
            </span>
          )}
        </div>

        {/* Free Delivery */}
        <p className="mt-1.5 text-[10px] font-semibold text-green-700 uppercase tracking-wider">
          Free Delivery
        </p>
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
