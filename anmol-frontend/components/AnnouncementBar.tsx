'use client';

import { Sparkles, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementBar() {
  const announcements = [
    '👑 JOIN ANMOL VIP ROYAL CLUB FOR ₹1 — UNLIMITED FREE DELIVERY ON EVERY ORDER',
    '✨ GRAND WEDDING SEASON: EXTRA 10% OFF ON BRIDAL LEHENGAS & SILK SAREES',
    '👑 100% AUTHENTIC HANDLOOM BANARASI & KANJIVARAM SILK GUARANTEED',
    '🚚 VIP MEMBERS ENJOY PRIORITY 24-HOUR DISPATCH & LUXURY PACKAGING',
    '💎 7-DAY HASSLE-FREE EASY RETURNS & EXCHANGES',
    '🌟 24/7 AI STYLIST & WHATSAPP BRIDAL CONSULTATION AVAILABLE',
  ];

  return (
    <div className="relative overflow-hidden bg-[#15070e] text-[#f3dfa2] border-b border-[#c59b27]/30 py-2.5 text-xs font-semibold tracking-wider uppercase select-none">
      <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
        {announcements.concat(announcements).map((text, idx) => (
          <span key={idx} className="inline-flex items-center gap-3">
            <span className="text-[#f3dfa2]">{text}</span>
            <span className="text-[#c59b27]/60">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
