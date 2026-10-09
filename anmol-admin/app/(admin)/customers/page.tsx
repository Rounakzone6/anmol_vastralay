'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { PageHeader } from '@/components/page-header';
import { Card, Badge, Spinner, Input } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Users, Search } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: customers, isLoading } = trpc.user.getCustomers.useQuery(undefined, {
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!debouncedSearch) return customers;
    const lowerSearch = debouncedSearch.toLowerCase();
    return customers.filter((c: any) => 
      (c.name && c.name.toLowerCase().includes(lowerSearch)) ||
      (c.phone && c.phone.toLowerCase().includes(lowerSearch))
    );
  }, [customers, debouncedSearch]);

  useEffect(() => {
    if (highlightId && customers) {
      setTimeout(() => {
        const el = document.getElementById(`customer-row-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-violet-100');
          setTimeout(() => el.classList.remove('bg-violet-100'), 3000);
        }
      }, 300);
    }
  }, [highlightId, customers]);

  return (
    <div className="pb-12">
      <PageHeader 
        title="Customers" 
        description="Manage your registered customers and view their order history." 
      />

      <div className="mt-6 mb-2 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search customers by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-4">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading customers...</p>
          </div>
        ) : !customers?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Users size={24} />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No customers found</p>
            <p className="text-sm text-slate-500 max-w-md">
              When users register on your storefront, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-center">Total Orders</th>
                  <th className="px-6 py-4 text-right">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c: any) => (
                  <tr key={c.id} id={`customer-row-${c.id}`} className="hover:bg-slate-50/50 transition-all duration-700 group">
                    <td className="px-6 py-4">
                      <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">
                          {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-semibold text-slate-900 whitespace-nowrap group-hover:text-violet-700">{c.name || 'Unnamed'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{c.phone || '-'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {c._count.orders > 0 ? (
                        <Badge variant="default" className="bg-slate-100 text-slate-700 font-medium">
                          {c._count.orders} order{c._count.orders !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
