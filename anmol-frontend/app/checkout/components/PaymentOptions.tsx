'use client';

import { CreditCard } from 'lucide-react';

export function PaymentOptions({ paymentMethod, setPaymentMethod }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="w-6 h-6 rounded-full bg-[#85142b] text-white text-xs flex items-center justify-center mr-2">2</span>
          Payment Method
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Razorpay Option */}
          <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:bg-gray-50 ${paymentMethod === 'RAZORPAY' ? 'border-[#85142b] bg-red-50/30' : 'border-gray-200'}`}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="h-4 w-4 border-gray-300 text-[#85142b] focus:ring-[#85142b]"
                />
                <div className="ml-3 flex flex-col">
                  <span className="block text-sm font-bold text-gray-900">
                    Pay Online
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    UPI, Google Pay, PhonePe, Paytm
                  </span>
                </div>
              </div>
              <CreditCard className={`h-6 w-6 ${paymentMethod === 'RAZORPAY' ? 'text-[#85142b]' : 'text-gray-400'}`} />
            </div>
          </label>

          {/* COD Option */}
          <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:bg-gray-50 ${paymentMethod === 'COD' ? 'border-[#85142b] bg-red-50/30' : 'border-gray-200'}`}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="h-4 w-4 border-gray-300 text-[#85142b] focus:ring-[#85142b]"
                />
                <div className="ml-3 flex flex-col">
                  <span className="block text-sm font-bold text-gray-900">
                    Cash on Delivery
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Pay in cash or UPI when your order arrives
                  </span>
                </div>
              </div>
              <span className={`text-xl font-bold ${paymentMethod === 'COD' ? 'text-[#85142b]' : 'text-gray-400'}`}>
                ₹
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
