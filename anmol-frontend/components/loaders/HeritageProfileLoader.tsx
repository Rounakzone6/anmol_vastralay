'use client';

import { Crown, Sparkles } from 'lucide-react';

export default function HeritageProfileLoader() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* Header Profile Card Skeleton */}
      <div className="rounded-3xl border border-[#e8ded1] bg-white p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        {/* Soft Ambient Shimmer */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#c59b27]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Skeleton with Crown */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-[#c59b27]/50 luxury-skeleton flex items-center justify-center">
              <Sparkles size={24} className="text-[#c59b27] animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-1 p-1.5 rounded-full bg-[#85142b] text-[#f3dfa2] shadow-md">
              <Crown size={14} />
            </div>
          </div>

          {/* User Details Skeletons */}
          <div className="flex-1 flex flex-col items-center sm:items-start gap-2.5 text-center sm:text-left">
            <div className="h-6 w-48 rounded-lg luxury-skeleton" />
            <div className="h-4 w-36 rounded-md bg-[#ede4d5]" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-24 rounded-full bg-[#c59b27]/20" />
              <div className="h-6 w-28 rounded-full bg-[#85142b]/15" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Details Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#e8ded1] bg-white p-6 shadow-xs flex flex-col gap-3"
          >
            <div className="h-5 w-28 rounded-md bg-[#c59b27]/25" />
            <div className="h-4 w-full rounded-md luxury-skeleton mt-2" />
            <div className="h-4 w-3/4 rounded-md luxury-skeleton" />
            <div className="h-9 w-full rounded-xl bg-[#ede4d5]/60 mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
