'use client';

import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { PageHeader } from '@/components/page-header';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Tags, Package, AlertTriangle, ShieldCheck } from 'lucide-react';

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
  const { data: visits } = trpc.tracking.getVisitsCount.useQuery(undefined, {
    retry: false,
  });

  const activeProducts = products?.items.filter((p) => p.isActive).length ?? 0;
  const lowStock =
    products?.items.reduce(
      (sum, p) => sum + p.variants.filter((v) => v.stockQty < 5).length,
      0,
    ) ?? 0;

  return (
    <div className="pb-12">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your store's performance and inventory." 
      />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-start justify-between relative overflow-hidden group">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Categories</p>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">{categories?.length ?? '—'}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
            <Tags size={24} />
          </div>
        </Card>

        <Card className="flex items-start justify-between relative overflow-hidden group">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Products</p>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">{activeProducts}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
        </Card>

        <Card className="flex items-start justify-between relative overflow-hidden group">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Low Stock</p>
            <p className={`mt-2 text-4xl font-extrabold ${lowStock > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStock}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl group-hover:scale-110 transition-transform ${lowStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
        </Card>

        <Card className="flex items-start justify-between relative overflow-hidden group">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Staff Accounts</p>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">{staff?.length ?? '—'}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
        </Card>

        <Card className="flex items-start justify-between relative overflow-hidden group">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">{customers?.length ?? '—'}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
            <Tags size={24} />
          </div>
        </Card>

        <Card className="flex items-start justify-between relative overflow-hidden group">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform Visits</p>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">{visits ?? '—'}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Products</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products?.items.slice(0, 8).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/products/${p.id}`} className="font-semibold text-slate-900 hover:text-violet-600 transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <Badge variant="default" className="bg-slate-100 text-slate-700 font-medium">
                      {p.category?.name || 'Uncategorized'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-4">
                    {p.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="default">Draft</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products?.items.length === 0 && (
            <div className="p-8 text-center text-slate-500">No products found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
