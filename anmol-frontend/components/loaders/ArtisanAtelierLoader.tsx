'use client';

import { Sparkles, Award } from 'lucide-react';

export default function ArtisanAtelierLoader() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-10 sm:py-16">
      {/* Top Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-8 max-w-sm">
        <div className="h-3 w-16 rounded-full bg-[#ede4d5]" />
        <span className="text-gray-300">/</span>
        <div className="h-3 w-24 rounded-full bg-[#ede4d5]" />
        <span className="text-gray-300">/</span>
        <div className="h-3 w-32 rounded-full luxury-skeleton" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-14">
        {/* Left Gallery Skeleton (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Showcase Frame */}
          <div className="relative aspect-[4/5] sm:aspect-[3/3.5] w-full rounded-3xl overflow-hidden border border-[#e8ded1] bg-white shadow-sm luxury-skeleton">
            {/* Center Floating Seal */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-[#c59b27]/40 flex items-center justify-center text-[#c59b27] mb-3 animate-pulse-glow">
                <Sparkles size={26} />
              </div>
              <p className="font-serif-luxury text-lg font-bold text-[#85142b]">
                Preparing Atelier Presentation
              </p>
              <p className="text-xs text-gray-500 tracking-wider uppercase mt-1">
                Inspecting zari purity & handloom weave...
              </p>
            </div>

            {/* Certified Handloom Badge Skeleton */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#c59b27]/30 text-xs font-semibold text-[#85142b]">
              <Award size={14} className="text-[#c59b27]" />
              <span>Certified Handloom</span>
            </div>
          </div>

          {/* Thumbnails strip skeleton */}
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-20 h-24 rounded-xl border border-[#ede4d5] bg-white luxury-skeleton flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Right Product Info Skeleton (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Brand Tag Skeleton */}
          <div className="h-4 w-28 rounded-full bg-[#c59b27]/30" />

          {/* Title Skeletons */}
          <div className="flex flex-col gap-2.5">
            <div className="h-8 w-full rounded-lg luxury-skeleton" />
            <div className="h-8 w-4/5 rounded-lg luxury-skeleton" />
          </div>

          {/* Rating & reviews skeleton */}
          <div className="h-4 w-40 rounded-full bg-[#ede4d5]" />

          {/* Price Box Skeleton */}
          <div className="p-5 rounded-2xl bg-[#faf5eb] border border-[#e8ded1] flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <div className="h-9 w-28 rounded-lg luxury-skeleton" />
              <div className="h-5 w-20 rounded-md bg-[#ede4d5]" />
            </div>
            <div className="h-6 w-20 rounded-full bg-[#85142b]/20" />
          </div>

          {/* Color & Size Swatches Skeletons */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="h-3 w-20 rounded-full bg-[#ede4d5]" />
            <div className="flex gap-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white border border-[#e8ded1] luxury-skeleton" />
              ))}
            </div>
          </div>

          {/* Action Buttons Skeletons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="h-14 flex-1 rounded-full luxury-skeleton" />
            <div className="h-14 flex-1 rounded-full bg-[#85142b]/30" />
          </div>

          {/* Royal Assurance Skeleton Pills */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#ede4d5]">
            <div className="h-12 rounded-xl bg-white border border-[#ede4d5] p-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#c59b27]/30" />
              <div className="h-3 w-24 rounded-full bg-[#ede4d5]" />
            </div>
            <div className="h-12 rounded-xl bg-white border border-[#ede4d5] p-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#85142b]/30" />
              <div className="h-3 w-24 rounded-full bg-[#ede4d5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
