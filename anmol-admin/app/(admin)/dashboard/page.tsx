'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';

export default function DashboardPage() {
  const { data: categories } = trpc.category.list.useQuery({});
  const { data: products } = trpc.product.list.useQuery({
    includeInactive: true,
    pageSize: 100,
  });
  const { data: staff } = trpc.user.getUsers.useQuery(undefined, {
    retry: false,
  });

  const activeProducts = products?.items.filter((p) => p.isActive).length ?? 0;
  const lowStock =
    products?.items.reduce(
      (sum, p) => sum + p.variants.filter((v) => v.stockQty < 5).length,
      0,
    ) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-600">Overview of your clothing shop</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-zinc-500">Categories</p>
          <p className="mt-2 text-3xl font-bold">{categories?.length ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Products (active)</p>
          <p className="mt-2 text-3xl font-bold">{activeProducts}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Low stock variants</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{lowStock}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Staff accounts</p>
          <p className="mt-2 text-3xl font-bold">{staff?.length ?? '—'}</p>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Recent products</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Selling price</th>
                <th className="px-4 py-3">Stock lines</th>
              </tr>
            </thead>
            <tbody>
              {products?.items.slice(0, 8).map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="font-medium text-violet-700 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.category?.name}</td>
                  <td className="px-4 py-3">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3">{p.variants.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
