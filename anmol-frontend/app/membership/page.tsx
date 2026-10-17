'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/lib/useAuth';
import {
  Crown,
  Truck,
  Sparkles,
  Zap,
  MessageCircle,
  Gift,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Star,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import DiyaButtonLoader from '@/components/loaders/DiyaButtonLoader';

export default function MembershipPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const utils = trpc.useUtils();

  const { data: plan, isLoading: isPlanLoading } = trpc.membership.getPlan.useQuery();
  const { data: myMembership, isLoading: isMembershipLoading } = trpc.membership.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const verifyPayment = trpc.membership.verifyPayment.useMutation({
    onSuccess: () => {
      setSuccessMsg('🎉 Congratulations! You are now a proud member of the Anmol VIP Royal Club!');
      utils.membership.getMyMembership.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      setErrorMsg('Payment verification failed: ' + err.message);
    },
  });

  const createOrder = trpc.membership.createOrder.useMutation({
    onSuccess: (data) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key_id',
        amount: Math.round(data.amount * 100),
        currency: 'INR',
        name: 'Anmol Vastralay',
        description: 'Anmol VIP Royal Club Membership',
        order_id: data.razorpayOrderId,
        handler: function (response: any) {
          verifyPayment.mutate({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: user?.name || 'Valued Customer',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#85142b',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMsg('Payment cancelled or failed: ' + response.error.description);
      });
      rzp.open();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to initiate membership order');
    },
  });

  const handleJoinClick = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!isAuthenticated) {
      router.push('/login?redirect=/membership');
      return;
    }
    createOrder.mutate();
  };

  const isMember = myMembership?.isMember;
  const currentPrice = plan?.price ?? 1;
  const deliveryCharge = plan?.deliveryCharge ?? 20;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1c060d] via-[#3d0917] to-[#85142b] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        {/* Decorative ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6 backdrop-blur-sm">
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Exclusive Privileges for Our Royal Patrons</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white mb-6">
            Anmol VIP <span className="text-[#f3dfa2] italic">Royal Club</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-rose-100/90 leading-relaxed font-light mb-8">
            Experience timeless luxury with unlimited <strong>Free Delivery on every single order</strong>, priority express dispatch, exclusive festive previews, and dedicated bridal concierge styling.
          </p>

          {/* Quick Perks Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 text-left">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Truck className="w-4 h-4 shrink-0" />
                <span>Free Delivery</span>
              </div>
              <p className="text-[11px] text-rose-100/70 mt-1">Save ₹{deliveryCharge} on every order</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Zap className="w-4 h-4 shrink-0" />
                <span>24h Dispatch</span>
              </div>
              <p className="text-[11px] text-rose-100/70 mt-1">Priority warehouse processing</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Early Access</span>
              </div>
              <p className="text-[11px] text-rose-100/70 mt-1">First pick in festive sales</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>VIP Stylist</span>
              </div>
              <p className="text-[11px] text-rose-100/70 mt-1">Direct WhatsApp concierge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-12">
        {/* Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* Member Status Card OR Subscription CTA Card */}
        {isMember ? (
          <div className="bg-gradient-to-r from-[#2a0813] via-[#4d1023] to-[#2a0813] text-white rounded-3xl p-8 sm:p-10 shadow-2xl border-2 border-[#d4af37]/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  <Crown className="w-3.5 h-3.5" />
                  <span>ACTIVE VIP MEMBER</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#f3dfa2]">
                  Welcome, {user?.name || 'Royal Patron'}!
                </h2>
                <p className="text-sm text-rose-100/80">
                  You are enjoying unlimited <strong>Free Delivery</strong> and elite VIP privileges on Anmol Vastralay.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-amber-200/90 pt-2 justify-center md:justify-start">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Valid Until:{' '}
                    <strong>
                      {myMembership?.expiresAt
                        ? new Date(myMembership.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Active'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Free Delivery: <strong>Active (₹0)</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                <Link
                  href="/collections"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f3dfa2] text-slate-900 font-bold text-sm shadow-lg hover:brightness-105 transition-transform transform hover:-translate-y-0.5"
                >
                  <span>Shop with Free Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/orders"
                  className="text-center text-xs text-rose-200/80 hover:text-white underline underline-offset-4"
                >
                  View My Orders
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Join Card with Dynamic Price */
          <div className="bg-white rounded-3xl shadow-xl border border-amber-200/60 p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-xs font-bold px-6 py-1.5 rounded-bl-2xl shadow-sm uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Special Offer</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>{plan?.name || 'Anmol VIP Royal Club'}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                  Unlock Free Delivery & VIP Privileges Today
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Join our exclusive inner circle for just <strong>₹{currentPrice}</strong> for an entire year. Never pay standard ₹{deliveryCharge} delivery fees again, and receive royal styling perks with every bridal and festive purchase.
                </p>

                <div className="space-y-2.5 pt-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>100% Free Delivery</strong> on all orders (non-members pay ₹{deliveryCharge}/order)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>24-Hour Express Dispatch</strong> with luxury saree protective wrapping</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Direct WhatsApp Concierge</strong> for custom sizing & saree draping advice</span>
                  </div>
                </div>
              </div>

              {/* Price & Action Column */}
              <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/80 via-[#fffbf3] to-rose-50/50 rounded-2xl p-6 sm:p-8 border border-amber-200/70 text-center flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Annual VIP Membership</span>
                  <div className="flex items-baseline justify-center gap-2 my-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#85142b]">
                      ₹{currentPrice}
                    </span>
                    <span className="text-slate-400 text-sm font-medium line-through">₹499</span>
                    <span className="text-slate-600 text-sm font-medium">/ 1 Year</span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 py-1 px-3 rounded-full inline-block">
                    Save ₹{deliveryCharge} on your very first order!
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleJoinClick}
                    disabled={createOrder.isPending || verifyPayment.isPending || isPlanLoading}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#85142b] via-[#a31a38] to-[#85142b] text-white font-bold text-base shadow-xl shadow-rose-950/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {createOrder.isPending || verifyPayment.isPending ? (
                      <DiyaButtonLoader text="Activating Royal Status..." />
                    ) : (
                      <>
                        <Crown className="w-5 h-5 text-amber-300" />
                        <span>Join Royal Club for ₹{currentPrice}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secure 256-bit Razorpay UPI & Card checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Benefits Section */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Why Our Patrons Love VIP Membership
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every order at Anmol Vastralay becomes a royal experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Perk 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Unlimited Free Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No minimum order value required. Whether you purchase a small accessory or an elaborate bridal lehenga, delivery is <strong>100% free (saving ₹{deliveryCharge} per order)</strong>.
              </p>
            </div>

            {/* Perk 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#85142b] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">24-Hour Express Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                VIP orders are automatically routed to our priority fulfillment bench. Packed with luxury protective saree envelopes and dispatched within 24 hours.
              </p>
            </div>

            {/* Perk 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Festive Early Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get exclusive 24 to 48 hours early access before our Karwa Chauth, Diwali, and Wedding season drops go live to the general public.
              </p>
            </div>

            {/* Perk 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Personal WhatsApp Stylist</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with our master stylists for fabric matching, blouse neckline advice, and real-time video drape consultations.
              </p>
            </div>

            {/* Perk 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Birthday & Anniversary Gift</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an exclusive celebratory discount voucher on your special occasions to celebrate life's milestones in royal attire.
              </p>
            </div>

            {/* Perk 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Hassle-Free Priority Returns</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doorstep return pickup scheduled on your preferred time slot with immediate refund clearance upon parcel handover.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/70 space-y-6">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900">How long is the membership valid?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                The membership is valid for {plan?.durationDays ?? 365} days from the date of activation. All benefits, including unlimited Free Delivery, are active immediately.
              </p>
            </div>

            <div className="py-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900">Is there any minimum cart value for Free Delivery?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                No! As an Anmol VIP member, every order qualifies for 100% Free Delivery, regardless of cart size or item price.
              </p>
            </div>

            <div className="py-4 space-y-1.5">
              <h3 className="font-semibold text-slate-900">Can I renew my membership after 1 year?</h3>
              <p className="text-slate-600 text-xs sm:text-sm">
                Yes, you can renew your membership anytime directly from your profile or this page to maintain continuous VIP privileges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
