'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '../../lib/trpc';
import { ShoppingBag, Search, FilterX } from 'lucide-react';

export default function CollectionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch active categories for the filter tabs
  const { data: categoriesData } = trpc.category.list.useQuery({ includeInactive: false });
  const categories = categoriesData?.items || [];

  // Fetch products with filters
  const { data: productsData, isLoading, error } = trpc.product.list.useQuery({
    pageSize: 50,
    includeInactive: false,
    search: debouncedSearch || undefined,
    categorySlug: selectedCategorySlug || undefined,
  });

  const products = productsData?.items || [];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl relative inline-block">
            Our Collections
            <span className="absolute -bottom-3 left-1/4 w-1/2 h-1.5 bg-[#85142b] rounded-full"></span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
            Browse through our extensive catalog of authentic Indian wear, western outfits, and premium accessories.
          </p>
        </div>

        {/* --- Filters & Search Bar --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 sticky top-20 z-20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#85142b] focus:border-[#85142b] transition-all sm:text-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-nowrap md:flex-wrap items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSelectedCategorySlug(undefined)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategorySlug 
                    ? 'bg-[#85142b] text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug || cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategorySlug === (cat.slug || cat.id)
                      ? 'bg-[#85142b] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Product Grid --- */}
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex flex-col items-center text-gray-500 animate-pulse">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <div className="text-lg font-medium">Loading products...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-lg text-red-500">Error loading products. Please try again.</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <FilterX className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 text-base max-w-sm mx-auto">
              We couldn't find anything matching your current filters or search term. Try adjusting them!
            </p>
            {(searchTerm || selectedCategorySlug) && (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategorySlug(undefined); }}
                className="mt-6 px-6 py-2 bg-[#85142b] text-white rounded-full font-medium hover:bg-[#6c1023] transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6 mt-6">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.slug || product.id}`}
                className="group flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#85142b]/30 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <div className="aspect-h-5 aspect-w-4 bg-gray-50 relative overflow-hidden">
                  {product.images.length > 0 ? (
                    <img
                      loading="lazy"
                      src={product.images[0].url}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <ShoppingBag size={40} strokeWidth={1} />
                    </div>
                  )}
                  {Number(product.discountPercent) > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1 mb-1 group-hover:text-[#85142b] transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex items-end gap-2 pt-2">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{Number(product.netPrice).toFixed(2)}
                    </span>
                    {Number(product.discountPercent) > 0 && (
                      <span className="text-sm text-gray-400 line-through mb-0.5">
                        ₹{(Number(product.netPrice) * (1 + Number(product.discountPercent)/100)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 inline-flex">
                    <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      Free Delivery
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
