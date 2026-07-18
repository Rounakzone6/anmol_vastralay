'use client';

import { Loader2, Truck } from 'lucide-react';

export function ShippingForm({
  addresses,
  isLoadingAddresses,
  selectedAddressId,
  setSelectedAddressId,
  shippingAddress,
  setShippingAddress,
  formatAddress,
}: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="w-6 h-6 rounded-full bg-[#85142b] text-white text-xs flex items-center justify-center mr-2">1</span>
          Shipping Address
        </h2>
      </div>
      <div className="p-6">
        {isLoadingAddresses ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-[#85142b] animate-spin" />
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select a saved address or enter a new one</label>
            <div className="space-y-3">
              {addresses.map((addr: any) => (
                <label key={addr.id} className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:bg-gray-50 ${selectedAddressId === addr.id ? 'border-[#85142b] bg-red-50/30' : 'border-gray-200'}`}>
                  <div className="flex items-start w-full">
                    <input
                      type="radio"
                      name="address_selection"
                      checked={selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setShippingAddress(formatAddress(addr));
                      }}
                      className="mt-1 h-4 w-4 border-gray-300 text-[#85142b] focus:ring-[#85142b]"
                    />
                    <div className="ml-3 flex flex-col w-full">
                      <span className="block text-sm font-bold text-gray-900 flex items-center justify-between">
                        {addr.label || 'Home'}
                        {addr.isDefault && <span className="text-[10px] uppercase tracking-wider bg-[#85142b] text-white px-2 py-0.5 rounded-full">Default</span>}
                      </span>
                      <span className="block text-sm text-gray-700 mt-1">
                        {addr.fullName && <span className="font-medium mr-2">{addr.fullName}</span>}
                        {addr.phone && <span className="text-gray-500">{addr.phone}</span>}
                      </span>
                      <span className="block text-xs text-gray-500 mt-1 line-clamp-2">
                        {addr.street}, {addr.city}, {addr.state}, {addr.zipCode}, {addr.country}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
              <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm transition-all hover:bg-gray-50 ${selectedAddressId === 'new' ? 'border-[#85142b] bg-red-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center w-full">
                  <input
                    type="radio"
                    name="address_selection"
                    checked={selectedAddressId === 'new'}
                    onChange={() => {
                      setSelectedAddressId('new');
                      setShippingAddress('');
                    }}
                    className="h-4 w-4 border-gray-300 text-[#85142b] focus:ring-[#85142b]"
                  />
                  <div className="ml-3 flex flex-col">
                    <span className="block text-sm font-bold text-gray-900">
                      Use a different address
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        ) : null}

        {selectedAddressId === 'new' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Complete Delivery Address
            </label>
            <textarea
              id="address"
              rows={4}
              required
              className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#85142b] focus:ring-[#85142b] sm:text-sm resize-none bg-gray-50 px-4 py-3 transition-colors outline-none"
              placeholder="Enter your street address, apartment, suite, city, state, and PIN code..."
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <Truck className="w-3.5 h-3.5 mr-1" />
              We'll deliver your order to this exact location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
