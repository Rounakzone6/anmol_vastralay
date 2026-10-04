'use client';

import Image from 'next/image';
import { ChevronRight, Package, Zap, ZoomIn, BadgeCheck, Truck, RotateCcw } from 'lucide-react';

export function ProductGallery({
  images,
  displayProduct,
  discountPct,
  activeImageIdx,
  setActiveImageIdx,
  showZoom,
  setShowZoom,
}: {
  images: any[];
  displayProduct: any;
  discountPct: number;
  activeImageIdx: number;
  setActiveImageIdx: (val: number | ((v: number) => number)) => void;
  showZoom: boolean;
  setShowZoom: (val: boolean) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main Image */}
        <div
          className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm cursor-zoom-in product-detail-img"
          style={{ paddingBottom: '120%' }}
          onClick={() => setShowZoom(true)}
        >
          {images.length > 0 ? (
            <Image
              src={images[activeImageIdx]?.url || images[0].url}
              alt={images[activeImageIdx]?.altText || displayProduct.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top absolute inset-0 transition-all duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-200 bg-gray-50">
              <Package size={80} strokeWidth={0.5} />
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 opacity-70">
            <ZoomIn size={12} /> Zoom
          </div>

          {/* Discount badge on image */}
          {discountPct > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#85142b] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-md">
              <Zap size={11} fill="white" strokeWidth={0} />
              {Math.round(discountPct)}% OFF
            </div>
          )}

          {/* Nav arrows for multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIdx((i: number) => Math.max(0, i - 1)); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-gray-600 hover:bg-white transition-all"
                style={{ display: activeImageIdx === 0 ? 'none' : 'flex' }}
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveImageIdx((i: number) => Math.min(images.length - 1, i + 1)); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-gray-600 hover:bg-white transition-all"
                style={{ display: activeImageIdx === images.length - 1 ? 'none' : 'flex' }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto thumb-strip pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIdx(i)}
                className={`shrink-0 relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  activeImageIdx === i
                    ? 'border-[#85142b] shadow-md shadow-[#85142b]/20'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `${displayProduct.name} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover object-top"
                />
              </button>
            ))}
          </div>
        )}

        {/* Trust badges row */}
        <div className="hidden lg:grid grid-cols-3 gap-3 mt-2">
          {[
            { icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-50', label: '100% Authentic' },
            { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Free Delivery' },
            { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Easy Returns' },
          ].map(({ icon: Icon, color, bg, label }) => (
            <div key={label} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${bg} border border-gray-100`}>
              <Icon size={20} className={color} />
              <span className="text-xs font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowZoom(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
            onClick={() => setShowZoom(false)}
          >
            ✕
          </button>
          <div className="relative w-[90vw] max-w-lg" style={{ paddingBottom: '120%' }}>
            <Image
              src={images[activeImageIdx]?.url || images[0].url}
              alt={images[activeImageIdx]?.altText || displayProduct.name}
              fill
              className="object-contain object-center"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
