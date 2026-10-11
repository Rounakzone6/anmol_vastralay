'use client';

import { ShieldCheck, Sparkles, Truck, HeartHandshake } from 'lucide-react';

export default function HeritageValues() {
  const pillars = [
    {
      icon: Sparkles,
      title: 'Authentic Handloom Weaves',
      desc: 'Pure Banarasi, Kanjivaram & Chanderi fabrics direct from verified master artisan looms.',
    },
    {
      icon: ShieldCheck,
      title: 'Certified Royal Quality',
      desc: '100% genuine silk, gold & silver zari threads with rigorous double-stage quality inspection.',
    },
    {
      icon: Truck,
      title: 'Express Insured Delivery',
      desc: 'Pan-India doorstep dispatch with tamper-proof luxury packaging and real-time tracking.',
    },
    {
      icon: HeartHandshake,
      title: 'Dedicated Bridal Support',
      desc: '24/7 AI fashion styling assistance and direct WhatsApp personal shopping consultants.',
    },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-8 py-12 sm:py-20">
      <div className="rounded-3xl bg-gradient-to-br from-[#1c0812] to-[#2e0d1d] border border-[#c59b27]/30 p-8 sm:p-14 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#c59b27]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#85142b]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#f3dfa2]">
              THE ANMOL VASTRALAY PROMISE
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 leading-tight">
              A Legacy of Pure Heritage & Trust
            </h2>
            <div className="w-16 h-0.5 bg-[#c59b27] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#c59b27]/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#c59b27]/20 border border-[#c59b27]/40 flex items-center justify-center text-[#f3dfa2] mb-5 group-hover:scale-110 group-hover:bg-[#c59b27] group-hover:text-black transition-all duration-300 shadow-md">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#faf7f2] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
