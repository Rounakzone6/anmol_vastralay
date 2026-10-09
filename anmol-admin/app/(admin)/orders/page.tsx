'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { PageHeader } from '@/components/page-header';
import { Card, Select, Badge, Spinner, Input } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Download, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100/50 text-amber-700 border-amber-200/50',
  PROCESSING: 'bg-blue-100/50 text-blue-700 border-blue-200/50',
  SHIPPED: 'bg-indigo-100/50 text-indigo-700 border-indigo-200/50',
  DELIVERED: 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50',
  CANCELLED: 'bg-rose-100/50 text-rose-700 border-rose-200/50',
} as const;

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: orders, isLoading, refetch } = trpc.order.adminGetOrders.useQuery();

  useEffect(() => {
    if (highlightId && orders) {
      setTimeout(() => {
        const el = document.getElementById(`order-row-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-violet-100');
          setTimeout(() => el.classList.remove('bg-violet-100'), 3000);
        }
      }, 300);
    }
  }, [highlightId, orders]);
  
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!debouncedSearch) return orders;
    const lowerSearch = debouncedSearch.toLowerCase();
    return orders.filter((o: any) => 
      o.id.toLowerCase().includes(lowerSearch) || 
      (o.user?.name && o.user.name.toLowerCase().includes(lowerSearch)) ||
      (o.user?.phone && o.user.phone.toLowerCase().includes(lowerSearch))
    );
  }, [orders, debouncedSearch]);
  
  const updateStatus = trpc.order.adminUpdateOrderStatus.useMutation({
    onSuccess: (data, variables) => {
      toast.success(`Order status updated to ${variables.status}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });
  const generateInvoice = trpc.order.adminGenerateInvoice.useMutation({
    onSuccess: ({ invoiceUrl }) => window.open(invoiceUrl, '_blank', 'noopener,noreferrer'),
  });

  return (
    <div className="pb-12">
      <PageHeader 
        title="Orders" 
        description="Manage customer orders, track shipments, and update fulfillment statuses." 
      />

      <div className="mt-6 mb-2 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search orders by ID, name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-4">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading orders...</p>
          </div>
        ) : !orders?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <p className="text-lg font-medium text-slate-900 mb-2">No orders found</p>
            <p className="text-sm text-slate-500 max-w-md">
              When customers place orders, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o: any) => (
                  <tr key={o.id} id={`order-row-${o.id}`} className="hover:bg-slate-50/50 transition-all duration-700 group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      <Link href={`/orders/${o.id}`} className="hover:text-violet-600 transition-colors">
                        {o.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 whitespace-nowrap">{o.user.name || '—'}</div>
                      <div className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{o.user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                      {o._count.items} item{o._count.items !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 whitespace-nowrap">
                        ₹{Number(o.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => generateInvoice.mutate({ orderId: o.id })}
                        disabled={generateInvoice.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
                      >
                        {generateInvoice.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {o.invoiceUrl ? 'Download' : 'Generate'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Select
                        className={`inline-block w-auto py-1.5! pl-3! pr-8! text-xs! font-semibold border ${STATUS_STYLES[o.status as keyof typeof STATUS_STYLES] || 'bg-slate-50 text-slate-700'} rounded-full cursor-pointer transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-slate-200`}
                        value={o.status}
                        onChange={(e) => {
                          updateStatus.mutate({ orderId: o.id, status: e.target.value as any });
                        }}
                        disabled={updateStatus.isPending}
                      >
                        {(() => {
                          const orderLevels = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 99 };
                          const currentLevel = orderLevels[o.status as keyof typeof orderLevels] ?? 99;
                          
                          return (
                            <>
                              <option value="PENDING" disabled={currentLevel > orderLevels.PENDING}>Pending</option>
                              <option value="PROCESSING" disabled={currentLevel > orderLevels.PROCESSING}>Processing</option>
                              <option value="SHIPPED" disabled={currentLevel > orderLevels.SHIPPED}>Shipped</option>
                              <option value="DELIVERED" disabled={currentLevel > orderLevels.DELIVERED}>Delivered</option>
                              <option value="CANCELLED" disabled={currentLevel > orderLevels.CANCELLED}>Cancelled</option>
                            </>
                          );
                        })()}
                      </Select>
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
