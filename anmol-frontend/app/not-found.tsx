import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h1 className="mt-6 text-6xl font-extrabold text-[#85142b]">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Explore our collections</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link href="/collections/saree" className="text-gray-600 hover:text-[#85142b] p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">Sarees</Link>
            <Link href="/collections/women" className="text-gray-600 hover:text-[#85142b] p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">Women's Wear</Link>
            <Link href="/collections/men" className="text-gray-600 hover:text-[#85142b] p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">Men's Wear</Link>
            <Link href="/collections/kids" className="text-gray-600 hover:text-[#85142b] p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">Kids Collection</Link>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#85142b] hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85142b] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
