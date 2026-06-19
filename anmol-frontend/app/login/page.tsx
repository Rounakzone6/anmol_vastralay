'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Form from 'next/form';
import { GoogleLogin } from '@react-oauth/google';
import { trpc } from '../../lib/trpc';
import { useAuth } from '../../lib/useAuth';
import { Eye, EyeOff, Lock, ArrowRight, ShieldCheck, Truck, Gift, Sparkles, UserCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuth } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.push('/');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const googleAuthMutation = trpc.auth.googleAuth.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.push('/');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ identifier, password });
  };

  const isPending = loginMutation.isPending || googleAuthMutation.isPending;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-shrink-0 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1a0a10 0%, #2d0b18 25%, #85142b 65%, #b01e3f 100%)' }} />
        
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
        
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 text-white w-full">
          {/* Top */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome back!
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              Good to See<br />You Again
            </h1>
            <p className="mt-3 text-base text-white/60 max-w-sm leading-relaxed">
              Sign in to access your wishlist, orders, and exclusive member offers.
            </p>
          </div>
          
          {/* Trust badges */}
          <div className="space-y-3 my-8">
            {[
              { icon: ShieldCheck, title: '100% Authentic', desc: 'Guaranteed genuine quality' },
              { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹999' },
              { icon: Gift, title: 'Member Benefits', desc: 'Exclusive deals & early access' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3.5 bg-white/[0.07] backdrop-blur-sm rounded-xl px-4 py-3 transition-all hover:bg-white/[0.12]">
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-none">{title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-white/70">&copy; {new Date().getFullYear()} Anmol Vastralay. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-5 py-8 sm:px-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile heading */}
          <div className="lg:hidden mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-7">
            <h2 className="text-[26px] font-bold text-gray-900 tracking-tight">Sign in to your account</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              New to Anmol Vastralay?{' '}
              <Link href="/register" className="font-semibold text-[#85142b] hover:underline transition-colors">
                Create account →
              </Link>
            </p>
          </div>

          {/* Google */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  setError('');
                  googleAuthMutation.mutate({ credential: credentialResponse.credential });
                }
              }}
              onError={() => setError('Google sign-in failed. Please try again.')}
              text="signin_with"
              shape="pill"
              size="large"
              width={420}
              theme="outline"
            />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-300">or</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2.5">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          <Form action="" className="space-y-4" onSubmit={handleSubmit}>
            {/* Identifier */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5" htmlFor="identifier">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserCircle2 className={`h-[18px] w-[18px] transition-colors ${focusedField === 'identifier' ? 'text-[#85142b]' : 'text-gray-300'}`} />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:border-[#85142b] focus:ring-2 focus:ring-[#85142b]/10 focus:outline-none hover:border-gray-300 hover:bg-white"
                  placeholder="Enter email or phone number"
                  value={identifier}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className={`h-[18px] w-[18px] transition-colors ${focusedField === 'password' ? 'text-[#85142b]' : 'text-gray-300'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:bg-white focus:border-[#85142b] focus:ring-2 focus:ring-[#85142b]/10 focus:outline-none hover:border-gray-300 hover:bg-white"
                  placeholder="Enter your password"
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-[#85142b] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-[#85142b]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-1"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </Form>

          <p className="mt-6 text-center text-[11px] text-gray-400 leading-relaxed lg:hidden">
            New here?{' '}
            <Link href="/register" className="font-semibold text-[#85142b] hover:underline">Create account</Link>
          </p>

          <p className="mt-5 text-center text-[11px] text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-500">Terms</Link>
            {' '}&{' '}
            <Link href="/privacy" className="underline hover:text-gray-500">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
