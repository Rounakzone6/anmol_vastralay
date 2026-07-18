'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Receipt, Truck } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { useAuth } from '../../../lib/useAuth';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, isHydrated } = useAuth();
  
  const { data: order, isLoading, error } = trpc.order.getOrderDetails.useQuery(
    { orderId: id },
    { enabled: isAuthenticated && !!id }
  );

  if (!isHydrated) {
    return <div className="p-8 text-center text-gray-500">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900">Please log in</h2>
        <Link href="/login" className="mt-4 rounded-md bg-[#85142b] px-6 py-2 text-white hover:bg-[#6c1023]">
          Go to Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Order not found or you don't have permission to view it.</p>
        <Link href="/orders" className="mt-4 inline-block text-[#85142b] hover:underline">
          Return to Orders
        </Link>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="lg:flex lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Placed on <time dateTime={order.createdAt.toString()}>{new Date(order.createdAt).toLocaleDateString()}</time>
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize
            ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : ''}
            ${order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' : ''}
            ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
            ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {order.status.toLowerCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Items Ordered</h2>
            </div>
            <ul role="list" className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <li key={item.id} className="flex px-4 py-6 sm:px-6">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="ml-4 text-sm font-medium text-gray-900">₹{Number(item.price).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="mr-2 h-5 w-5 text-gray-400" />
                Order Summary
              </h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="space-y-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-medium text-gray-900">Free</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-medium text-gray-900">
                  <dt>Total</dt>
                  <dd>₹{Number(order.totalAmount).toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Truck className="mr-2 h-5 w-5 text-gray-400" />
                Shipping Information
              </h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <address className="not-italic text-sm text-gray-600 whitespace-pre-wrap">
                  {order.shippingAddress}
                </address>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
