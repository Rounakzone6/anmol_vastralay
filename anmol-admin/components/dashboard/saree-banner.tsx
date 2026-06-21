'use client';

import { motion } from 'framer-motion';

export function SareeBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-950 shadow-xl p-8 sm:p-12 mb-8 border border-white/10">
      {/* Animated Fabric Elements */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-white/10">
          <motion.path
            d="M0,50 C20,30 40,70 60,40 C80,10 100,50 100,50 L100,100 L0,100 Z"
            fill="currentColor"
            initial={{ y: 5 }}
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,70 C30,90 50,30 80,60 C100,80 100,60 100,60 L100,100 L0,100 Z"
            fill="currentColor"
            initial={{ y: -5 }}
            animate={{ y: [-5, 8, -5] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.path
            d="M-20,40 C10,10 60,110 120,40 L120,100 L-20,100 Z"
            fill="currentColor"
            className="text-amber-500/10"
            initial={{ x: -10 }}
            animate={{ x: [-10, 10, -10] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
      
      {/* Gold pattern overlay for ethnic feel */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 flex flex-col justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-sm font-medium mb-4 backdrop-blur-sm border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            System Online
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-sm">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Anmol Vastralay</span>
          </h1>
          <p className="text-indigo-100/90 max-w-2xl text-lg sm:text-xl font-light">
            Manage your elegant collection, track your latest orders, and monitor your store's performance.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
