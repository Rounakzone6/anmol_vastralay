'use client';

import { PageHeader } from '@/components/page-header';
import { Card, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Users, Loader2 } from 'lucide-react';

export default function CustomersPage() {
  const { data: customers, isLoading } = trpc.user.getCustomers.useQuery();

  return (
    <div className="pb-12">
      <PageHeader 
        title="Customers" 
        description="Manage your registered customers and view their order history." 
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-6">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
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
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4 text-right">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="font-semibold text-slate-900">{c.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.phone || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    {c._count.orders > 0 ? (
                      <Badge variant="default" className="bg-slate-100 text-slate-700 font-medium">
                        {c._count.orders} order{c._count.orders !== 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
