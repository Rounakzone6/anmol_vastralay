'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../lib/useAuth';
import { ShieldCheck, Truck, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('RAZORPAY');
  const [checkoutError, setCheckoutError] = useState('');

  const utils = trpc.useUtils();
  const { data: cart, isLoading } = trpc.cart.getCart.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: addresses, isLoading: isLoadingAddresses } = trpc.customer.getAddresses.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const formatAddress = (addr: any) => {
    const parts: string[] = [];
    if (addr.fullName) parts.push(addr.fullName);
    if (addr.phone) parts.push(addr.phone);
    if (addr.street) parts.push(addr.street);
    parts.push(`${addr.city}, ${addr.state} ${addr.zipCode}`);
    if (addr.country) parts.push(addr.country);
    return parts.join(', ');
  };

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
      setShippingAddress(formatAddress(defaultAddr));
    }
  }, [addresses]);

  const verifyPayment = trpc.payment.verifyRazorpayPayment.useMutation({
    onSuccess: () => {
      utils.cart.getCart.invalidate();
      router.push('/profile?tab=orders&success=true');
    },
    onError: (err) => setCheckoutError('Payment verification failed: ' + err.message),
  });

  const createOrder = trpc.order.createOrder.useMutation({
    onSuccess: (data) => {
      if (data.method === 'COD') {
        utils.cart.getCart.invalidate();
        router.push('/profile?tab=orders&success=true');
      } else if (data.method === 'RAZORPAY') {
        // Initialize Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key_id',
          amount: data.amount * 100,
          currency: 'INR',
          name: 'Anmol Vastralay',
          description: 'Secure Checkout',
          order_id: data.razorpayOrderId,
          handler: function (response: any) {
            verifyPayment.mutate({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          prefill: {
            name: 'Customer',
          },
          theme: {
            color: '#85142b',
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'Pay via UPI',
                  instruments: [
                    { method: 'upi' },
                  ],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: false,
              },
            },
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setCheckoutError('Payment failed: ' + response.error.description);
        });
        rzp.open();
      }
    },
    onError: (err) => setCheckoutError(err.message),
  });

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#85142b] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <ShieldCheck className="w-16 h-16 text-[#85142b] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Checkout</h2>
          <p className="text-gray-500 mb-6">Please log in or create an account to complete your purchase safely.</p>
          <button onClick={() => router.push('/login?redirect=/checkout')} className="w-full rounded-xl bg-[#85142b] px-6 py-3 text-white font-semibold hover:bg-[#6c1023] transition-colors">
            Login / Register
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#85142b] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Preparing your checkout...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add some beautiful items to your cart before checking out.</p>
          <Link href="/collections" className="inline-flex w-full justify-center rounded-xl bg-[#85142b] px-6 py-3 text-white font-semibold hover:bg-[#6c1023] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.product.netPrice) * item.quantity,
    0
  );

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setCheckoutError('Shipping address is required');
      return;
    }
    setCheckoutError('');
    createOrder.mutate({ shippingAddress, paymentMethod });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
        </div>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              
              {/* Address Section */}
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
                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-[#85142b] focus:ring-[#85142b] sm:text-sm resize-none bg-gray-50 px-4 py-3 transition-colors"
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

              {/* Payment Method Section */}
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

              {/* Error Display */}
              {checkoutError && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-4 flex items-start">
                  <ShieldCheck className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{checkoutError}</p>
                </div>
              )}

              {/* Submit Button (Mobile view usually puts this at bottom, but keeping it here for logical flow) */}
              <div className="lg:hidden">
                <button
                  type="submit"
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
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="mt-10 lg:mt-0 lg:col-span-5 relative">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              </div>
              
              {/* Items List */}
              <div className="px-6 py-4 max-h-[400px] overflow-y-auto hide-scrollbar">
                <ul className="divide-y divide-gray-100">
                  {cart.items.map((item) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
