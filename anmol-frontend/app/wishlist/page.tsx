import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-20 h-20 bg-rose-50 text-[#85142b] flex items-center justify-center rounded-full mb-6">
        <Heart size={40} className="fill-[#85142b]" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Your Wishlist</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        The wishlist feature is coming soon! Keep an eye out for updates as we work to bring you this functionality.
      </p>
      <Link 
        href="/collections"
        className="px-8 py-3 bg-[#85142b] text-white font-bold rounded-xl shadow-lg shadow-[#85142b]/25 hover:bg-[#6c1023] transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
