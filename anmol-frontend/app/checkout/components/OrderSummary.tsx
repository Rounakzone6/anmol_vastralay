'use client';

import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import DiyaButtonLoader from '@/components/loaders/DiyaButtonLoader';

export function OrderSummary({
  cart,
  subtotal,
  handleCheckoutSubmit,
  createOrder,
  verifyPayment,
  paymentMethod,
  isMember = false,
  deliveryCharge = 20,
  planPrice = 1,
}: any) {
  const finalTotal = subtotal + (isMember ? 0 : deliveryCharge);

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
      
      {/* VIP Upsell Banner if non-member */}
      {!isMember && (
        <div className="mx-6 my-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-amber-900 flex items-center gap-1">
              <span>👑</span> Anmol VIP Royal Club
            </p>
            <p className="text-amber-800 text-[11px]">
              Save ₹{deliveryCharge} & get Free Delivery on ALL orders for just ₹{planPrice}/yr!
            </p>
          </div>
          <a
            href="/membership"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#85142b] text-white font-bold text-[11px] hover:bg-[#6c1023] transition-colors"
          >
            Join VIP
          </a>
        </div>
      )}

      {/* Totals */}
      <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm mb-3 text-gray-600">
          <p>Subtotal</p>
          <p className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between text-sm mb-4 text-gray-600">
          <p>Shipping</p>
          {isMember ? (
            <p className="font-bold text-emerald-600 flex items-center gap-1">
              <span>Free</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">VIP Perk 👑</span>
            </p>
          ) : (
            <p className="font-semibold text-gray-900">₹{deliveryCharge.toFixed(2)}</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-base font-bold text-gray-900">Total</p>
          <p className="text-2xl font-extrabold text-[#85142b]">₹{finalTotal.toFixed(2)}</p>
        </div>
        
        {/* Desktop Submit Button */}
        <div className="mt-6 hidden lg:block">
          <button
            onClick={handleCheckoutSubmit}
            disabled={createOrder.isPending || verifyPayment.isPending}
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-[#85142b] hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] disabled:opacity-70 transition-all transform hover:-translate-y-0.5"
          >
            {createOrder.isPending || verifyPayment.isPending ? (
              <DiyaButtonLoader text="Securing order..." />
            ) : (
              paymentMethod === 'COD' ? 'Confirm Order (COD)' : `Pay ₹${finalTotal.toFixed(2)} Securely`
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
