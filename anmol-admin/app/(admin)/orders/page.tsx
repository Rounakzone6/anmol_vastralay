'use client';

import { PageHeader } from '@/components/page-header';
import { Card, Select } from '@/components/ui';
import { trpc } from '@/lib/trpc';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200/60',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200/60',
  SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200/60',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200/60',
} as const;

export default function OrdersPage() {
  const { data: orders, isLoading, refetch } = trpc.order.adminGetOrders.useQuery();
  const updateStatus = trpc.order.adminUpdateOrderStatus.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Orders" description="Manage customer orders and update tracking statuses" />

      <Card className="p-0 overflow-hidden border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        {isLoading ? (
          <div className="p-8 text-sm text-neutral-500 animate-pulse flex items-center justify-center">Loading orders...</div>
        ) : !orders?.length ? (
          <div className="p-12 text-sm text-neutral-400 text-center flex flex-col items-center">
            <span className="block text-xl mb-2">📦</span>
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="border-b border-neutral-100 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Order ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-6 py-4 whitespace-nowrap">Items</th>
                  <th className="px-6 py-4 whitespace-nowrap">Total Amount</th>
                  <th className="px-6 py-4 whitespace-nowrap">Order Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-400">
                      {o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{o.user.name || '—'}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{o.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-500 font-medium">{o.items.length} items</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900 tracking-tight">
                      ₹{Number(o.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block w-full max-w-[140px]">
                        <Select
                          className={`!py-1.5 !pl-3 !pr-8 !text-xs font-semibold border ${STATUS_STYLES[o.status as keyof typeof STATUS_STYLES] || 'bg-neutral-50 text-neutral-700'} rounded-full appearance-none cursor-pointer transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-neutral-200`}
                          value={o.status}
                          onChange={(e) => {
                            updateStatus.mutate({ orderId: o.id, status: e.target.value as any });
                          }}
                          disabled={updateStatus.isPending}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </Select>
                      </div>
                    </td>
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
