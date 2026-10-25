import { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, Tag, Check, X } from 'lucide-react';
import DiyaButtonLoader from '@/components/loaders/DiyaButtonLoader';
import { trpc } from '@/lib/trpc';

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
  couponCode,
  setCouponCode,
  appliedCoupon,
  setAppliedCoupon,
}: any) {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const discountAmount = appliedCoupon ? (subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount) + (isMember ? 0 : deliveryCharge);

  const utils = trpc.useUtils();

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidating(true);
    setCouponError('');
    try {
      const res = await utils.client.order.validateCoupon.query({ code: couponInput.trim() });
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountPercent: res.discountPercent,
          discountAmount: (subtotal * res.discountPercent) / 100,
          description: res.description,
        });
        setCouponCode?.(res.code);
        setCouponInput('');
      } else {
        setCouponError(res.description);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode?.('');
    setCouponError('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
      </div>
      
      {/* Items List */}
      <div className="px-6 py-4 max-h-[350px] overflow-y-auto hide-scrollbar">
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

      {/* Coupon Section */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
          <Tag className="w-3.5 h-3.5 text-[#85142b]" /> Have a Promo Code? (Try COMEBACK15)
        </label>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm text-emerald-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold tracking-wider">{appliedCoupon.code}</span>
                <span className="text-xs ml-2 text-emerald-700">({appliedCoupon.discountPercent}% off applied)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-gray-400 hover:text-red-500 p-1"
              title="Remove coupon"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="e.g. COMEBACK15"
              className="flex-1 uppercase text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#85142b]/20 focus:border-[#85142b]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCoupon();
                }
              }}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isValidating || !couponInput.trim()}
              className="px-4 py-2 bg-[#85142b] text-white text-xs font-bold rounded-xl hover:bg-[#6c1023] disabled:opacity-50 transition-colors"
            >
              {isValidating ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{couponError}</p>
        )}
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
      <div className="bg-gray-50 px-6 py-5 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm mb-2 text-gray-600">
          <p>Subtotal</p>
          <p className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</p>
        </div>
        {appliedCoupon && (
          <div className="flex items-center justify-between text-sm mb-2 text-emerald-600">
            <p className="flex items-center gap-1">
              <span>Discount</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                {appliedCoupon.code}
              </span>
            </p>
            <p className="font-semibold">-₹{discountAmount.toFixed(2)}</p>
          </div>
        )}
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
