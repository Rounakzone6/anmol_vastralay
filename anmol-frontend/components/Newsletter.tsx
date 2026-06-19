'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 1000);
  };

  return (
    <div className="bg-[#fff5f6] border border-red-100 rounded-2xl mx-4 sm:mx-6 lg:mx-8 mb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <div className="lg:w-0 lg:flex-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl" id="newsletter-headline">
            Subscribe to our Newsletter
          </h2>
          <p className="mt-3 max-w-3xl text-lg leading-6 text-gray-500">
            Get the latest updates on new arrivals, exclusive discounts, and festive offers straight to your inbox.
          </p>
        </div>
        <div className="mt-8 lg:mt-0 lg:ml-8 lg:flex-1">
          <form className="sm:flex" onSubmit={handleSubmit}>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-gray-300 px-5 py-3 placeholder-gray-400 focus:border-[#85142b] focus:ring-1 focus:ring-[#85142b] sm:max-w-xs"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
            <div className="mt-3 rounded-md shadow-sm sm:mt-0 sm:ml-3 sm:flex-shrink-0">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-[#85142b] px-5 py-3 text-base font-medium text-white hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-[#85142b] focus:ring-offset-2 disabled:opacity-70 transition-colors"
              >
                {status === 'loading' ? (
                  'Subscribing...'
                ) : (
                  <>
                    Subscribe
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
          {status === 'success' && (
            <p className="mt-3 text-sm text-green-600 font-medium">
              Thanks for subscribing! Keep an eye on your inbox.
            </p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            We care about the protection of your data. Read our{' '}
            <Link href="/privacy" className="font-medium text-[#85142b] hover:underline">
              Privacy Policy.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
