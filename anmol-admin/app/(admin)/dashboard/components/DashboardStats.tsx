import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { Tags, Package, AlertTriangle, Users, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

type DashboardStatsProps = {
  categoriesCount: number | '—';
  activeProducts: number;
  lowStock: number;
  customersCount: number | '—';
  totalOnlineAmount: number;
};

export function DashboardStats({
  categoriesCount,
  activeProducts,
  lowStock,
  customersCount,
  totalOnlineAmount,
}: DashboardStatsProps) {
  const container: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6"
    >
      <motion.div variants={item}>
        <div className="flex flex-col relative overflow-hidden group rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 bg-white p-6 hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
              <Tags size={24} strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Categories
          </p>
          <p className="text-4xl font-black text-slate-900 tracking-tight">
            {categoriesCount}
          </p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-indigo-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex flex-col relative overflow-hidden group rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 bg-white p-6 hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 group-hover:scale-110 transition-transform duration-300">
              <Package size={24} strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Active Products
          </p>
          <p className="text-4xl font-black text-slate-900 tracking-tight">
            {activeProducts}
          </p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 to-violet-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex flex-col relative overflow-hidden group rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 bg-white p-6 hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-300 ${lowStock > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={24} strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Low Stock
          </p>
          <p className={`text-4xl font-black tracking-tight ${lowStock > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStock}
          </p>
          <div className={`absolute bottom-0 left-0 h-1 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${lowStock > 0 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-slate-400 to-slate-200'}`} />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex flex-col relative overflow-hidden group rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 bg-white p-6 hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
              <Users size={24} strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Customers
          </p>
          <p className="text-4xl font-black text-slate-900 tracking-tight">
            {customersCount}
          </p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex flex-col relative overflow-hidden group rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 bg-white p-6 hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform duration-300">
              <CreditCard size={24} strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Online Pay
          </p>
          <p className="text-3xl mt-1 font-black text-slate-900 tracking-tight truncate">
            {formatCurrency(totalOnlineAmount)}
          </p>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
      </motion.div>
    </motion.div>
  );
}
