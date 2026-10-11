'use client';

import { Sparkles, Bot } from 'lucide-react';

export default function ChatbotStylistLoader() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#faf5eb] border border-[#c59b27]/30 shadow-xs max-w-sm">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#85142b] to-[#4a0815] text-[#f3dfa2] flex items-center justify-center flex-shrink-0 shadow-xs">
        <Sparkles size={16} className="animate-spin-slow" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#85142b]">
          <span>AI Royal Stylist is thinking</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#85142b] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 rounded-full bg-[#c59b27] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 rounded-full bg-[#85142b] animate-bounce" />
          </span>
        </div>
        <p className="text-[11px] text-gray-500">
          Curating personalized festival draping advice...
        </p>
      </div>
    </div>
  );
}
