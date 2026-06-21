'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Select, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Plus, Search, Filter } from 'lucide-react';
import { Spinner } from '@/components/ui';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { data: categories } = trpc.category.list.useQuery({});
  const { data, isLoading } = trpc.product.list.useQuery({
    search: search || undefined,
    categoryId: categoryId || undefined,
    includeInactive: true,
    pageSize: 50,
  });

  return (
    <div className="pb-12">
      <PageHeader
        title="Products"
        description="Manage your sarees, kurtis, suits, and entire inventory catalog."
        action={
          <Link href="/products/new">
            <Button>
              <Plus size={16} className="mr-2" />
              Add Product
            </Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search products by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Filter size={16} className="text-slate-400" />
          </div>
          <Select
            className="pl-10"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <p className="text-lg font-medium text-slate-900 mb-2">No products found</p>
            <p className="text-sm text-slate-500 max-w-md">
              {search || categoryId ? "Try adjusting your filters to find what you're looking for." : "You haven't added any products to your catalog yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 hidden md:table-cell">Type & Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Inventory</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((p: any) => {
                  const thumb = p.images[0]?.url;
                  return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {thumb ? (
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm border border-slate-200/50">
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200/50 text-xs text-slate-400">
                            N/A
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/products/${p.id}`}
                            className="font-semibold text-slate-900 hover:text-violet-600 transition-colors line-clamp-2"
                          >
                            {p.name}
                          </Link>
                          {/* Mobile only display for category */}
                          <p className="text-xs text-slate-500 mt-1 md:hidden">{p.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-medium text-slate-700">{p.kind}</span>
                        {p.category?.name && (
                          <Badge variant="default" className="text-[10px] uppercase tracking-wider">{p.category.name}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(p.sellingPrice)}</span>
                        {p.discountPercent > 0 ? (
                          <span className="text-xs text-slate-400 line-through mt-0.5 whitespace-nowrap">
                            {formatCurrency(p.netPrice)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-slate-700 font-medium">
                      {p.variants.length} variant{p.variants.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {p.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Draft</Badge>
                      )}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
