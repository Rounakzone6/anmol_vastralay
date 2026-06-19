'use client';

import Link from 'next/link';
import Image from 'next/image';
import { trpc } from '../lib/trpc';
import { ShoppingBag } from 'lucide-react';

export default function LatestArrivals() {
  const { data: productsData, isLoading, error } = trpc.product.list.useQuery({
    pageSize: 8, // Just get the top 8 for the homepage latest arrivals
    includeInactive: false
  });

  const products = productsData?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 mb-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight relative inline-block">
          Latest Arrivals
          <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#85142b] rounded-full"></span>
        </h2>
        <Link href="/collections" className="text-sm font-medium text-[#85142b] hover:text-[#6c1023] hover:underline">
          View All Products &rarr;
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg aspect-4/5 flex items-center justify-center overflow-hidden">
              <div className="animate-pulse flex flex-col items-center justify-center opacity-70">
                <div className="animate-bounce">
                  <ShoppingBag className="w-10 h-10 sm:w-16 sm:h-16 text-[#85142b]/20" />
                </div>
                <div className="h-2 w-16 bg-gray-200 rounded mt-4"></div>
                <div className="h-2 w-10 bg-gray-200 rounded mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-lg text-red-500">Error loading products. Please try again.</div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No products available at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.slug || product.id}`}
              className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors shadow-sm hover:shadow-md"
            >
              <div className="aspect-h-5 aspect-w-4 bg-gray-100 relative">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <ShoppingBag size={40} strokeWidth={1} />
                  </div>
                )}
                {Number(product.discountPercent) > 0 && (
                  <div className="absolute top-2 left-2 bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">
                    {product.discountPercent}% OFF
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4 flex flex-col grow">
                <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-1 mb-1">
                  {product.name}
                </h3>
                <div className="mt-auto flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{Number(product.netPrice).toFixed(2)}
                  </span>
                  {Number(product.discountPercent) > 0 && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{(Number(product.netPrice) * (1 + Number(product.discountPercent)/100)).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="mt-2 inline-flex">
                  <span className="bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Free Delivery
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
