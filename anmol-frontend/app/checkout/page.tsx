'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/lib/useAuth';
import { ShieldCheck, Truck, ArrowLeft, Loader2 } from 'lucide-react';
import { ShippingForm } from '@/app/checkout/components/ShippingForm';
import { PaymentOptions } from '@/app/checkout/components/PaymentOptions';
import { OrderSummary } from '@/app/checkout/components/OrderSummary';

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
    (total: number, item: any) => total + Number(item.product.netPrice) * item.quantity,
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
              
              <ShippingForm
                addresses={addresses}
                isLoadingAddresses={isLoadingAddresses}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                shippingAddress={shippingAddress}
                setShippingAddress={setShippingAddress}
                formatAddress={formatAddress}
              />

              <PaymentOptions
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />

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
            <OrderSummary
              cart={cart}
              subtotal={subtotal}
              handleCheckoutSubmit={handleCheckoutSubmit}
              createOrder={createOrder}
              verifyPayment={verifyPayment}
              paymentMethod={paymentMethod}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
