'use client';

import { Sparkles } from 'lucide-react';

export default function SilkLoomLoader({
  showGrid = true,
  count = 8,
}: {
  showGrid?: boolean;
  count?: number;
}) {
  return (
    <div className="w-full py-8">
      {/* Handloom Spindle Header Animation */}
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        {/* Weaving Spindle Indicator */}
        <div className="relative flex items-center justify-center w-64 h-10 mb-3">
          {/* Silk Threads Background Lines */}
          <div className="w-full flex flex-col gap-1.5 opacity-40">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c59b27] to-transparent" />
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#85142b] to-transparent" />
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c59b27] to-transparent" />
          </div>

          {/* Shuttle Weaving Motion */}
          <div className="absolute flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-md border border-[#c59b27]/40 animate-[loomWeaveMotion_2.2s_ease-in-out_infinite]">
            <span className="w-2 h-2 rounded-full bg-[#85142b] animate-ping" />
            <span className="text-[11px] font-bold text-[#85142b] tracking-wider uppercase font-serif-luxury">
              Weaving Silk
            </span>
            <Sparkles size={11} className="text-[#c59b27]" />
          </div>
        </div>

        <p className="text-sm font-medium text-gray-500 tracking-wide">
          Unrolling authentic handloom weaves & festive collections...
        </p>
      </div>

      {/* Luxury Skeleton Cards Grid */}
      {showGrid && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(count)].map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#e8ded1] bg-white overflow-hidden shadow-xs p-3 flex flex-col gap-3"
            >
              {/* Image Skeleton with Gold Shimmer */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden luxury-skeleton">
                <div className="absolute top-2.5 left-2.5 w-16 h-5 rounded-full bg-white/70" />
                <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/70" />
              </div>

              {/* Title & Category Skeletons */}
              <div className="flex flex-col gap-2 px-1">
                <div className="h-2.5 w-20 rounded-full bg-[#ede4d5]" />
                <div className="h-4 w-full rounded-md luxury-skeleton" />
                <div className="h-4 w-3/4 rounded-md luxury-skeleton" />
                
                {/* Price & Rating skeleton */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0ede6]">
                  <div className="h-4 w-16 rounded-md bg-[#ede4d5]" />
                  <div className="h-3 w-10 rounded-full bg-[#ede4d5]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Micro loader specifically for infinite scroll load-more in Collections
 */
export function SilkSpindleScrollLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#85142b] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#5e0b1d] animate-bounce" />
      </div>
      <p className="text-xs font-semibold text-[#85142b] tracking-widest uppercase">
        Unrolling more heritage weaves...
      </p>
    </div>
  );
}
