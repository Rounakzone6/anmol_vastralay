'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, Star, Eye } from 'lucide-react';

interface Product {
  id: string;
  slug?: string;
  name: string;
  netPrice: number | string;
  mrp?: number | string;
  discountPercent?: number | string;
  images: { url: string; altText?: string }[];
  brand?: string;
  category?: { name: string; slug?: string };
  variants?: { id?: string; color?: string; size?: string; stockQty?: number; sku?: string }[];
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

  const netPrice = Number(product.netPrice || 0);
  const discountPct = Number(product.discountPercent || 0);
  const mrp = discountPct > 0
    ? Number(product.mrp || Math.round(netPrice * (1 + discountPct / 100)))
    : null;
  const savings = mrp ? mrp - netPrice : 0;

  const isNew = product.createdAt 
    ? (new Date().getTime() - new Date(product.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((acc, v) => acc + (v.stockQty || 0), 0)
    : 999;
  const isOutOfStock = totalStock === 0;

  const href = `/product/${product.slug || product.id}`;
  
  const primaryImage = product.images?.[0]?.url || '/banners/banner_saree.png';
  const secondaryImage = product.images?.[1]?.url || primaryImage;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <article
      className="group relative flex flex-col w-full bg-white rounded-2xl overflow-hidden border border-[#e8ded1]/80 hover:border-[#c59b27]/60 shadow-xs hover:shadow-xl transition-all duration-500 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3:4 Fashion Lookbook Image Frame */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#f4efe8]">
        <Link href={href} className="block w-full h-full relative" aria-label={product.name}>
          {/* Primary Image */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={index < 4 ? 'eager' : 'lazy'}
            className={`object-cover object-top transition-all duration-700 ease-out ${
              isHovered && secondaryImage !== primaryImage
                ? 'opacity-0 scale-105'
                : 'opacity-100 group-hover:scale-105'
            }`}
          />

          {/* Secondary Hover Image (if available) */}
          {secondaryImage && secondaryImage !== primaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover object-top transition-all duration-700 ease-out absolute inset-0 ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-black/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Sold Out
            </span>
          ) : (
            <>
              {discountPct > 0 && (
                <span className="bg-gradient-to-r from-[#85142b] to-[#a01a35] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md border border-[#f3dfa2]/30">
                  {Math.round(discountPct)}% OFF
                </span>
              )}
              {isNew && (
                <span className="bg-[#12090e]/85 text-[#f3dfa2] text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#c59b27]/40 shadow-sm">
                  New Arrival
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md backdrop-blur-md cursor-pointer ${
            isWishlisted
              ? 'bg-[#85142b] text-white scale-110'
              : 'bg-white/85 text-gray-700 hover:bg-[#85142b] hover:text-white'
          }`}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Slide-Up Quick View on Hover */}
        <div className="absolute inset-x-3 bottom-3 z-20 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <Link
            href={href}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg backdrop-blur-md bg-[#15070e]/95 text-[#f3dfa2] hover:bg-[#85142b] hover:text-white border border-[#c59b27]/30 transition-all duration-200"
          >
            <Eye size={14} /> Quick View Details
          </Link>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 bg-white">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#c59b27] line-clamp-1">
            {product.category?.name || product.brand || 'Ethnic Wear'}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
            <Star size={12} fill="currentColor" />
            <span>4.9</span>
          </div>
        </div>

        {/* Product Name */}
        <Link href={href} className="group-hover:text-[#85142b] transition-colors mb-2">
          <h3 className="font-serif-luxury text-sm sm:text-base font-semibold text-[#1c1417] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price & Savings */}
        <div className="mt-auto pt-2 flex items-baseline flex-wrap gap-2">
          <span className="text-base sm:text-lg font-extrabold text-[#1c1417]">
            ₹{netPrice.toLocaleString('en-IN')}
          </span>
          {mrp && (
            <span className="text-xs text-gray-400 line-through">
              ₹{mrp.toLocaleString('en-IN')}
            </span>
          )}
          {savings > 0 && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Save ₹{savings.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
