'use client';

import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { PageHeader } from '@/components/page-header';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Tags, Package, AlertTriangle, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { SareeBanner } from '@/components/dashboard/saree-banner';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';

export default function DashboardPage() {
  const { data: categories } = trpc.category.list.useQuery({});
  const { data: products } = trpc.product.list.useQuery({
    includeInactive: true,
    pageSize: 100,
  });
  const { data: staff } = trpc.user.getUsers.useQuery(undefined, {
    retry: false,
  });
  const { data: customers } = trpc.user.getCustomers.useQuery(undefined, {
    retry: false,
  });

  const activeProducts = products?.items.filter((p: any) => p.isActive).length ?? 0;
  const lowStock =
    products?.items.reduce(
      (sum: number, p: any) => sum + p.variants.filter((v: any) => v.stockQty < 5).length,
      0,
    ) ?? 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as any;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  } as any;

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      <SareeBanner />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
      >
        <motion.div variants={item}>
          <Card className="flex items-start justify-between relative overflow-hidden group border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-indigo-900/60 uppercase tracking-wider">Categories</p>
              <p className="mt-2 text-4xl font-extrabold text-indigo-950">{categories?.length ?? '—'}</p>
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
              <p className="text-sm font-semibold text-violet-900/60 uppercase tracking-wider">Active Products</p>
              <p className="mt-2 text-4xl font-extrabold text-violet-950">{activeProducts}</p>
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
              <p className="text-sm font-semibold text-amber-900/60 uppercase tracking-wider">Low Stock</p>
              <p className={`mt-2 text-4xl font-extrabold ${lowStock > 0 ? 'text-amber-600' : 'text-amber-950'}`}>{lowStock}</p>
            </div>
            <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300 shadow-inner ${lowStock > 0 ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-500 group-hover:text-white'}`}>
              <AlertTriangle size={28} strokeWidth={1.5} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="flex items-start justify-between relative overflow-hidden group border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 backdrop-blur-sm hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-emerald-900/60 uppercase tracking-wider">Customers</p>
              <p className="mt-2 text-4xl font-extrabold text-emerald-950">{customers?.length ?? '—'}</p>
            </div>
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-inner">
              <Users size={28} strokeWidth={1.5} />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <DashboardCharts />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Products</h2>
          <Link href="/products" className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
            View all products &rarr;
          </Link>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Category</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Selling Price</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {products?.items.slice(0, 8).map((p: any) => (
                <tr key={p.id} className="hover:bg-violet-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/products/${p.id}`} className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50">
                        {p.images?.[0] ? (
                           <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <Badge variant="default" className="bg-slate-100/80 text-slate-700 font-medium border-slate-200/60">
                      {p.category?.name || 'Uncategorized'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-4">
                    {p.isActive ? (
                      <Badge variant="success" className="bg-emerald-100/80 text-emerald-700 border-emerald-200/60">Active</Badge>
                    ) : (
                      <Badge variant="default" className="bg-slate-100/80 text-slate-600 border-slate-200/60">Draft</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products?.items.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
              <Package className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-900">No products found</p>
              <p className="text-sm">Get started by adding your first product.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
