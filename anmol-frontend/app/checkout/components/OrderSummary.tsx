'use client';

import Image from 'next/image';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function OrderSummary({
  cart,
  subtotal,
  handleCheckoutSubmit,
  createOrder,
  verifyPayment,
  paymentMethod,
}: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
      </div>
      
      {/* Items List */}
      <div className="px-6 py-4 max-h-[400px] overflow-y-auto hide-scrollbar">
        <ul className="divide-y divide-gray-100">
          {cart.items.map((item: any) => (
            <li key={item.id} className="py-4 flex items-start">
              <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative bg-gray-50">
                {item.product.images.length > 0 ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No img
                  </div>
                )}
              </div>
              <div className="ml-4 flex flex-1 flex-col">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-900">
                    <h3 className="line-clamp-2">{item.product.name}</h3>
                    <p className="ml-4 shrink-0 font-bold text-[#85142b]">
                      ₹{(Number(item.product.netPrice) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 items-end justify-between text-sm mt-2">
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-gray-400 text-xs line-through">
                    {Number(item.product.discountPercent) > 0 && (
                      `₹${(Number(item.product.netPrice) * (1 + Number(item.product.discountPercent)/100) * item.quantity).toFixed(2)}`
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Totals */}
      <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm mb-3 text-gray-600">
          <p>Subtotal</p>
          <p className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-4 text-gray-600">
          <p>Shipping</p>
          <p className="font-bold text-green-600">Free</p>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-base font-bold text-gray-900">Total</p>
          <p className="text-2xl font-extrabold text-[#85142b]">₹{subtotal.toFixed(2)}</p>
        </div>
        
        {/* Desktop Submit Button */}
        <div className="mt-6 hidden lg:block">
          <button
            onClick={handleCheckoutSubmit}
            disabled={createOrder.isPending || verifyPayment.isPending}
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-[#85142b] hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] disabled:opacity-70 transition-all transform hover:-translate-y-0.5"
          >
            {createOrder.isPending || verifyPayment.isPending ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Processing securely...
              </>
            ) : (
              paymentMethod === 'COD' ? 'Confirm Order (COD)' : `Pay ₹${subtotal.toFixed(2)} Securely`
            )}
          </button>
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Safe and secure payments. 100% authentic products.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
