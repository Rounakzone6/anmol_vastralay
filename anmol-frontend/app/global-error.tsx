'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected root layout exceptions
    console.error('Global application boundary error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#faf7f2] text-gray-900 font-sans antialiased flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-lg w-full bg-white border border-[#e5dcd3] p-8 sm:p-10 rounded-2xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#85142b]/10 flex items-center justify-center text-[#85142b]">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#85142b]">
              Something went wrong!
            </h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              We encountered an unexpected error while loading the storefront. Our technical team has been notified.
            </p>
            {error?.digest && (
              <p className="mt-2 text-xs font-mono text-gray-400">
                Error Reference: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => reset()}
              type="button"
              className="flex-1 py-3 px-5 rounded-lg text-sm font-semibold text-white bg-[#85142b] hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] transition-all shadow-md active:scale-[0.98]"
            >
              Try Again
            </button>
            <a
              href="/"
              className="flex-1 py-3 px-5 rounded-lg text-sm font-semibold text-[#85142b] bg-white border border-[#85142b]/30 hover:bg-[#85142b]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] transition-all text-center"
            >
              Return Home
            </a>
          </div>

          <div className="pt-4 border-t border-[#f0eae1] text-xs text-gray-500">
            Need urgent assistance? Contact us at{' '}
            <a
              href="mailto:support@anmolvastralay.com"
              className="text-[#85142b] underline hover:opacity-80"
            >
              support@anmolvastralay.com
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
