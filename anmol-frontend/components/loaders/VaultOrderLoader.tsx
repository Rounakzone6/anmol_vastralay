'use client';

import { ShieldCheck, Lock } from 'lucide-react';

export default function VaultOrderLoader({
  message = 'Securing Your Royal Order...',
  subtitle = 'Encrypted Payment & Royal Assurance Protocol',
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Outer Vault Ring */}
      <div className="relative flex items-center justify-center mb-8">
        
        {/* Soft emerald/gold glow */}
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-[#059669]/15 via-[#c59b27]/25 to-transparent blur-2xl animate-pulse-glow" />

        {/* Outer Golden Gear / Filigree Ring */}
        <div className="w-28 h-28 rounded-full border-2 border-dashed border-[#c59b27]/60 animate-spin-medium flex items-center justify-center">
          <span className="absolute top-0 w-2 h-2 rounded-full bg-[#059669] shadow-[0_0_8px_#059669]" />
          <span className="absolute bottom-0 w-2 h-2 rounded-full bg-[#c59b27] shadow-[0_0_8px_#c59b27]" />
        </div>

        {/* Central Shield Vault Badge */}
        <div className="absolute w-16 h-16 rounded-2xl bg-gradient-to-br from-[#85142b] to-[#2d050d] shadow-2xl border-2 border-[#c59b27] flex items-center justify-center text-[#f3dfa2] animate-pulse">
          <ShieldCheck size={32} className="text-[#f3dfa2]" />
        </div>

        {/* Small floating lock badge */}
        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#059669] text-white shadow-md">
          <Lock size={12} />
        </div>
      </div>

      {/* Typography */}
      <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#85142b] tracking-wide mb-1.5">
        {message}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wider uppercase mb-6">
        {subtitle}
      </p>

      {/* 3 Golden Security Beads */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-ping [animation-duration:1.5s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27] animate-ping [animation-duration:1.5s] [animation-delay:0.3s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#85142b] animate-ping [animation-duration:1.5s] [animation-delay:0.6s]" />
      </div>
    </div>
  );
}
