'use client';

import { motion } from 'framer-motion';

export function SareeBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 mb-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
      {/* Subtle Background Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-5 border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Welcome back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Anmol Vastralay</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed">
            Here's what's happening with your store today. Manage your collection, track orders, and monitor your business growth seamlessly.
          </p>
        </motion.div>
      </div>

      {/* Right side illustration / Quick Actions (Optional) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative z-10 hidden md:flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100"
      >
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 mx-auto rounded-full bg-violet-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-600">Add Product</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-600">Campaigns</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
