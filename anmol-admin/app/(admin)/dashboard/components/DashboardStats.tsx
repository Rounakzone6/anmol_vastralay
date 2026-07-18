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
      className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6"
    >
      <motion.div variants={item}>
        <Card className="flex items-start justify-between relative overflow-hidden group border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-indigo-900/60 uppercase tracking-wider">
              Categories
            </p>
            <p className="mt-2 text-4xl font-extrabold text-indigo-950">
              {categoriesCount}
            </p>
          </div>
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <Tags size={28} strokeWidth={1.5} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="flex items-start justify-between relative overflow-hidden group border-violet-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-violet-900/60 uppercase tracking-wider">
              Active Products
            </p>
            <p className="mt-2 text-4xl font-extrabold text-violet-950">
              {activeProducts}
            </p>
          </div>
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <Package size={28} strokeWidth={1.5} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="flex items-start justify-between relative overflow-hidden group border-amber-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-amber-900/60 uppercase tracking-wider">
              Low Stock
            </p>
            <p
              className={`mt-2 text-4xl font-extrabold ${
                lowStock > 0 ? 'text-amber-600' : 'text-amber-950'
              }`}
            >
              {lowStock}
            </p>
          </div>
          <div
            className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 shadow-inner ${
              lowStock > 0
                ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-500 group-hover:text-white'
            }`}
          >
            <AlertTriangle size={28} strokeWidth={1.5} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="flex items-start justify-between relative overflow-hidden group border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-900/60 uppercase tracking-wider">
              Customers
            </p>
            <p className="mt-2 text-4xl font-extrabold text-emerald-950">
              {customersCount}
            </p>
          </div>
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <Users size={28} strokeWidth={1.5} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="flex items-start justify-between relative overflow-hidden group border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-sm font-semibold text-blue-900/60 uppercase tracking-wider">
              Online Pay
            </p>
            <p className="mt-2 text-3xl font-extrabold text-blue-950 truncate max-w-[120px]">
              {formatCurrency(totalOnlineAmount)}
            </p>
          </div>
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <CreditCard size={28} strokeWidth={1.5} />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
