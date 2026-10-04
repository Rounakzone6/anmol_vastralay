'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, MapPin, Loader2, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/lib/useAuth';

export default function OrdersPage() {
  const { isAuthenticated, isHydrated } = useAuth();
  
  const { data: orders, isLoading } = trpc.order.getOrderHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const generateInvoice = trpc.order.generateInvoice.useMutation({
    onSuccess: ({ invoiceUrl }) => window.open(invoiceUrl, '_blank', 'noopener,noreferrer'),
  });

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#85142b] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900">Please log in to view your orders</h2>
        <Link href="/login" className="mt-4 rounded-md bg-[#85142b] px-6 py-2 text-white hover:bg-[#6c1023]">
          Go to Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#85142b] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">No orders found</h2>
        <p className="mt-2 text-gray-600">You haven't placed any orders yet.</p>
        <Link href="/" className="mt-6 rounded-md bg-[#85142b] px-6 py-2 text-white hover:bg-[#6c1023]">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4 lg:grid-cols-5">
                <div>
                  <dt className="font-medium text-gray-900">Order number</dt>
                  <dd className="mt-1 text-gray-500 truncate" title={order.id}>#{order.id.slice(-8).toUpperCase()}</dd>
                </div>
                <div className="hidden sm:block">
                  <dt className="font-medium text-gray-900">Date placed</dt>
                  <dd className="mt-1 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Total amount</dt>
                  <dd className="mt-1 font-medium text-gray-900">₹{Number(order.totalAmount).toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Status</dt>
                  <dd className="mt-1 text-gray-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                      ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : ''}
                      ${order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' : ''}
                      ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                      ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {order.status.toLowerCase()}
                    </span>
                  </dd>
                </div>
              </dl>
              
              <div className="mt-4 flex items-center justify-end sm:mt-0">
                <button
                  type="button"
                  onClick={() => generateInvoice.mutate({ orderId: order.id })}
                  disabled={generateInvoice.isPending}
                  className="mr-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-[#85142b] disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {order.invoiceUrl ? 'Invoice' : 'Generate invoice'}
                </button>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center text-sm font-medium text-[#85142b] hover:text-[#6c1023]"
                >
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="sr-only">Items</h4>
                  <div className="flex -space-x-2 overflow-hidden">
                    {order.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[10px] text-gray-500 ring-2 ring-white" title={item.product.name}>
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={16} />
                        )}
                      </div>
                    ))}
                    {order.items.length > 5 && (
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-white bg-gray-50 text-xs font-medium text-gray-500">
                        +{order.items.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="flex items-start text-sm text-gray-500 max-w-xs">
                  <MapPin className="mr-2 h-5 w-5 shrink-0 text-gray-400" />
                  <p className="truncate">{order.shippingAddress}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
