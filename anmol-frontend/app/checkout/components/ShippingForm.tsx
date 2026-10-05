'use client';

import { Loader2, Truck, LocateFixed } from 'lucide-react';
import { useState } from 'react';
import { calculateDistance } from '@/lib/location';

export function ShippingForm({
  addresses,
  isLoadingAddresses,
  selectedAddressId,
  setSelectedAddressId,
  shippingAddress,
  setShippingAddress,
  formatAddress,
}: any) {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState('');

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage('Location is not supported by this browser.');
      return;
    }

    setLocationStatus('loading');
    setLocationMessage('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const currentLat = coords.latitude;
          const currentLng = coords.longitude;

          // 1. Smart Match: CRM Lookup
          if (addresses && addresses.length > 0) {
            const nearbyAddress = addresses.find((addr: any) => {
              if (addr.lat && addr.lng) {
                const distance = calculateDistance(currentLat, currentLng, addr.lat, addr.lng);
                return distance <= 30; // 30 meters threshold
              }
              return false;
            });

            if (nearbyAddress) {
              setSelectedAddressId(nearbyAddress.id);
              setShippingAddress(formatAddress(nearbyAddress));
              setLocationStatus('idle');
              setLocationMessage('Smart match! We auto-selected your address based on previous orders near this location.');
              return;
            }
          }

          // 2. Fallback: Reverse Geocoding (Mappls/Nominatim)
          const params = new URLSearchParams({
            format: 'jsonv2',
            lat: String(currentLat),
            lon: String(currentLng),
            zoom: '18',
            addressdetails: '1',
            'accept-language': 'en',
          });

          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
          if (!response.ok) throw new Error('Address lookup failed');
          const result = await response.json();
          
          const address = result.address;
          if (!address) throw new Error('No address details');

          const locality = address.neighbourhood || address.suburb || address.residential || address.town;
          const streetParts = [address.house_number, address.road, locality, address.city, address.state, address.postcode, address.country].filter(Boolean);
          
          setSelectedAddressId('new');
          setShippingAddress(streetParts.join(', '));
          
          setLocationStatus('idle');
          setLocationMessage(
            address.house_number 
              ? 'Location found! Please review the address before continuing.'
              : 'Location found, but house number was missing. Please add it manually.'
          );
        } catch {
          setLocationStatus('error');
          setLocationMessage('Could not find the address automatically.');
        }
      },
      (error) => {
        setLocationStatus('error');
        setLocationMessage('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center justify-between w-full">
          <div className="flex items-center">
            <span className="w-6 h-6 rounded-full bg-[#85142b] text-white text-xs flex items-center justify-center mr-2">1</span>
            Shipping Address
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locationStatus === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#85142b]/25 px-3 py-1.5 text-xs font-semibold text-[#85142b] transition-colors hover:bg-[#85142b]/5 disabled:cursor-wait disabled:opacity-60"
          >
            <LocateFixed size={14} />
            {locationStatus === 'loading' ? 'Locating...' : 'Use current location'}
          </button>
        </h2>
      </div>
      <div className="p-6">
        {locationMessage && (
          <p
            className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
              locationStatus === 'error'
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-700'
            }`}
            role="status"
          >
            {locationMessage}
          </p>
        )}
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
