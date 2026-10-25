'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';

export default function RoyalCrestLoader({
  message = 'Curating Royal Heritage Weaves...',
  subtitle = 'Anmol Vastralay • Pure Handloom Craftsmanship',
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Outer Glow Halo */}
      <div className="relative flex items-center justify-center mb-8">
        
        {/* Soft Ambient Radial Blur */}
        <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-[#85142b]/20 via-[#c59b27]/25 to-transparent blur-2xl animate-pulse-glow" />

        {/* Outer Counter-Rotating Filigree Ring */}
        <div className="w-32 h-32 rounded-full border border-dashed border-[#c59b27]/40 animate-spin-slow flex items-center justify-center p-2">
          {/* Subtle gold accent dots */}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#c59b27] shadow-[0_0_8px_#c59b27]" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#85142b] shadow-[0_0_8px_#85142b]" />
        </div>

        {/* Inner Counter-Rotating Golden Ring */}
        <div className="absolute w-24 h-24 rounded-full border border-[#c59b27]/70 border-t-transparent border-b-transparent animate-spin-reverse" />

        {/* Center AV Royal Monogram Emblem */}
        <div className="absolute w-18 h-18 rounded-full bg-gradient-to-br from-[#85142b] to-[#4a0815] shadow-xl border-2 border-[#c59b27]/80 flex items-center justify-center p-3 animate-float-gentle overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/logo.png"
              alt="Anmol Vastralay"
              fill
              sizes="72px"
              className="object-contain filter drop-shadow-md"
              priority
            />
          </div>
        </div>

        {/* Floating Sparkle Micro-badge */}
        <div className="absolute -top-1 -right-1 p-1 rounded-full bg-[#c59b27] text-white shadow-md animate-bounce">
          <Sparkles size={13} />
        </div>
      </div>

      {/* Typography */}
      <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#85142b] tracking-wide mb-2 drop-shadow-xs">
        {message}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 tracking-widest uppercase font-medium mb-6">
        {subtitle}
      </p>

      {/* Animated Golden Shimmer Bar */}
      <div className="w-56 h-1.5 bg-[#ede4d5] rounded-full overflow-hidden relative shadow-inner">
        <div className="absolute inset-y-0 w-24 rounded-full bg-gradient-to-r from-transparent via-[#c59b27] to-transparent animate-[shimmer_1.6s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
