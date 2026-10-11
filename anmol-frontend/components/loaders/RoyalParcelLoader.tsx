'use client';

import { Package, Compass } from 'lucide-react';

export default function RoyalParcelLoader({
  message = 'Fetching Your Royal Parcels...',
  subtitle = 'Connecting with Courier & Dispatch Manifest',
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Parcel Floating Visual */}
      <div className="relative flex items-center justify-center mb-8">
        
        {/* Soft Golden Glow */}
        <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#c59b27]/20 via-[#85142b]/20 to-transparent blur-2xl animate-pulse-glow" />

        {/* Orbiting Compass Ring */}
        <div className="w-28 h-28 rounded-full border border-dashed border-[#c59b27]/50 animate-spin-slow flex items-center justify-center">
          <span className="absolute top-1 left-2 w-2 h-2 rounded-full bg-[#c59b27]" />
        </div>

        {/* Floating Royal Parcel Box */}
        <div className="absolute w-16 h-16 rounded-2xl bg-gradient-to-br from-[#faf5eb] to-[#f0e3cc] shadow-xl border-2 border-[#c59b27] flex items-center justify-center text-[#85142b] animate-float-gentle">
          <Package size={30} className="text-[#85142b]" />
        </div>

        {/* Tiny Floating Compass Badge */}
        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#85142b] text-white shadow-md animate-spin-medium">
          <Compass size={13} />
        </div>
      </div>

      {/* Typography */}
      <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#85142b] tracking-wide mb-1.5">
        {message}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wider uppercase mb-6">
        {subtitle}
      </p>

      {/* Traveling Shipment Dots */}
      <div className="w-52 flex items-center justify-between relative">
        <div className="absolute inset-x-0 h-0.5 bg-[#e8ded1]" />
        <span className="relative z-10 w-3 h-3 rounded-full bg-[#85142b] ring-4 ring-white" />
        <span className="relative z-10 w-3 h-3 rounded-full bg-[#c59b27] ring-4 ring-white animate-pulse" />
        <span className="relative z-10 w-3 h-3 rounded-full bg-[#ede4d5] ring-4 ring-white" />
      </div>
    </div>
  );
}
