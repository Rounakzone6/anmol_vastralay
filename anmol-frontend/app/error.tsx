'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in a real app
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Something went wrong!</h1>
          <p className="mt-2 text-sm text-gray-600">
            We apologize for the inconvenience. Our team has been notified.
          </p>
        </div>

        <div className="mt-8 flex flex-col space-y-4">
          <button
            onClick={() => reset()}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#85142b] hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
