'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';

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
    <div>
      <PageHeader
        title="Products"
        description="Manage sarees, kurtis, suits, and all inventory"
        action={
          <Link href="/products/new">
            <Button>Add product</Button>
          </Link>
        }
      />

      <Card className="mb-6 flex flex-wrap gap-4 p-4">
        <Input
          className="max-w-xs"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="max-w-xs"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-zinc-500">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => {
                const thumb = p.images[0]?.url;
                return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {thumb ? (
                      <div className="relative h-14 w-11 overflow-hidden rounded bg-zinc-100">
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${p.id}`}
                      className="font-medium text-violet-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-zinc-500">{p.category?.name}</p>
                  </td>
                  <td className="px-4 py-3">{p.kind}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{formatCurrency(p.sellingPrice)}</span>
                    {p.discountPercent > 0 ? (
                      <span className="ml-1 text-xs text-zinc-400 line-through">
                        {formatCurrency(p.netPrice)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{p.variants.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.isActive ? 'bg-green-100 text-green-800' : 'bg-zinc-200'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
