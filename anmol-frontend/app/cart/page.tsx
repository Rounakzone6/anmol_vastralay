'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../lib/useAuth';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  
  const utils = trpc.useUtils();
  const { data: cart, isLoading } = trpc.cart.getCart.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateQuantity = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.getCart.invalidate(),
  });

  const removeFromCart = trpc.cart.removeFromCart.useMutation({
    onSuccess: () => utils.cart.getCart.invalidate(),
  });

  // Checkout logic moved to /checkout page

  if (!isHydrated) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900">Please log in to view your cart</h2>
        <Link href="/login" className="mt-4 rounded-md bg-[#85142b] px-6 py-2 text-white hover:bg-[#6c1023]">
          Go to Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ShoppingCartIcon className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-600">Looks like you haven't added anything yet.</p>
        <Link href="/" className="mt-6 rounded-md bg-[#85142b] px-6 py-2 text-white hover:bg-[#6c1023]">
          Start Shopping
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.product.netPrice) * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <ul role="list" className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {cart.items.map((item) => (
              <li key={item.id} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-md object-cover object-center sm:h-32 sm:w-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.product.images && item.product.images.length > 0 ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        width={128}
                        height={128}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-700 hover:text-gray-800">
                          {item.product.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">₹{Number(item.product.netPrice)}</p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <div className="flex items-center border border-gray-300 rounded-md w-min">
                        <button
                          type="button"
                          className="p-2 text-gray-600 hover:text-gray-900"
                          onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
                          disabled={updateQuantity.isPending}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          className="p-2 text-gray-600 hover:text-gray-900"
                          onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                          disabled={updateQuantity.isPending}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="absolute top-0 right-0">
                        <button
                          type="button"
                          className="-m-2 p-2 text-gray-400 hover:text-red-500"
                          onClick={() => removeFromCart.mutate({ cartItemId: item.id })}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order summary */}
        <section aria-labelledby="summary-heading" className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
          <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
            Order summary
          </h2>

          <dl className="mt-6 space-y-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <dt>Subtotal</dt>
              <dd className="text-gray-900 font-medium">₹{subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="flex items-center">Shipping estimate</dt>
              <dd className="text-gray-900 font-medium">Free</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-medium text-gray-900">
              <dt>Order total</dt>
              <dd>₹{subtotal.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <Link
              href="/checkout"
              className="w-full flex items-center justify-center rounded-md border border-transparent bg-[#85142b] px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-[#85142b] focus:ring-offset-2"
            >
              Proceed to Checkout
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
