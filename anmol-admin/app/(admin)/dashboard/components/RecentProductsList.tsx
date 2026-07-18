import Link from 'next/link';
import { Badge, Spinner } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

type RecentProductsListProps = {
  products: any;
};

export function RecentProductsList({ products }: RecentProductsListProps) {
  return (
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Category</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Selling Price</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {!products && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto" />
                    <p className="mt-4 text-sm text-slate-500">Loading products...</p>
                  </td>
                </tr>
              )}
              {products?.items.slice(0, 8).map((p: any) => (
                <tr key={p.id} className="hover:bg-violet-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/products/${p.id}`} className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50 shrink-0">
                        {p.images?.[0] ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.images[0]?.url} alt={p.name} className="h-full w-full object-cover" />
                          </>
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <Badge variant="default" className="bg-slate-100/80 text-slate-700 font-medium border-slate-200/60 whitespace-nowrap">
                      {p.category?.name || 'Uncategorized'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                    {formatCurrency(Number(p.sellingPrice))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
        </div>
        {products?.items.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <Package className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No products found</p>
            <p className="text-sm">Get started by adding your first product.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
