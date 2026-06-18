'use client';

import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui';
import { trpc } from '@/lib/trpc';

export default function CustomersPage() {
  const { data: customers, isLoading } = trpc.user.getCustomers.useQuery();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="Customers" description="Manage registered customers and view their activity" />

      <Card className="p-0 overflow-hidden border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        {isLoading ? (
          <div className="p-8 text-sm text-neutral-500 animate-pulse flex items-center justify-center">Loading customers...</div>
        ) : !customers?.length ? (
          <div className="p-12 text-sm text-neutral-400 text-center flex flex-col items-center">
            <span className="block text-xl mb-2">👥</span>
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="border-b border-neutral-100 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Email Address</th>
                  <th className="px-6 py-4 whitespace-nowrap">Total Orders</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-neutral-900">{c.name || '—'}</td>
                    <td className="px-6 py-4 text-neutral-500">{c.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                        {c._count.orders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400 text-xs">{new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
