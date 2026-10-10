'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Search, FilterX, Loader2, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

export default function CollectionsClient({ 
  initialSearchTerm = '',
  initialData = null,
  initialCategories = [],
}: { 
  initialSearchTerm?: string;
  initialData?: any;
  initialCategories?: any[];
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchTerm);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>(undefined);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>(undefined);

  const [filterOpen, setFilterOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: categoriesData } = trpc.category.list.useQuery({ includeInactive: false }, { initialData: initialCategories });
  const categories: any[] = categoriesData || initialCategories || [];

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.product.list.useInfiniteQuery(
    {
      pageSize: 30,
      includeInactive: false,
      search: debouncedSearch || undefined,
      categorySlug: selectedCategorySlug || undefined,
      subcategoryId: selectedSubcategoryId || undefined,
    },
    {
      initialData: (!selectedCategorySlug && !selectedSubcategoryId && debouncedSearch === initialSearchTerm) ? initialData : undefined,
      getNextPageParam: (lastPage: any) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    }
  );

  const products = data?.pages.flatMap((page) => page.items) || [];

  // Infinite Scroll Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
        },
        { rootMargin: '400px' }
      );
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const activeCategory = categories.find(
    (c: any) => c.slug === selectedCategorySlug || c.id === selectedCategorySlug
  );
  const activeSubcategories = activeCategory?.subcategories || [];
  const activeSubcategory = activeSubcategories.find((s: any) => s.id === selectedSubcategoryId);


  const hasFilters = !!(searchTerm || selectedCategorySlug);
  const totalProducts = data?.pages[0]?.total;

  const clearAll = () => {
    setSearchTerm('');
    setSelectedCategorySlug(undefined);
    setSelectedSubcategoryId(undefined);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #faf9f7 0%, #f5f3f0 100%)' }}>
      {/* ── Page Hero ───────────────────────────────── */}
      <div
        className="relative py-14 sm:py-20 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a0510 0%, #85142b 50%, #a01a35 100%)',
        }}
      >
        {/* decorative circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 border-[60px] border-white" />

        <div className="relative">
          <span className="inline-block text-[11px] font-bold tracking-[0.3em] text-white/60 uppercase mb-3">
            अनमोल वस्त्रालय
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Our Collections
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto px-4">
            Authentic Indian ethnic wear, modern western styles & premium accessories — all in one place.
          </p>
          {totalProducts !== undefined && (
            <p className="mt-3 text-white/50 text-sm font-medium">
              {totalProducts.toLocaleString('en-IN')} Products
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Sticky Filter Bar ───────────────────────── */}
        <div className="sticky top-16 sm:top-20 z-20 -mx-4 sm:mx-0 py-3">
          <div className="bg-white/95 backdrop-blur-md rounded-none sm:rounded-2xl border-y sm:border border-gray-200 shadow-md px-4 py-3 sm:px-5">
            {/* Row 1: Search + Filter toggle */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="collection-search"
                  type="text"
                  placeholder="Search saree, kurti, jeans…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#85142b]/30 focus:border-[#85142b] transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Filter toggle on mobile */}
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="flex sm:hidden items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors shrink-0"
              >
                <SlidersHorizontal size={15} />
                Filters
                <ChevronDown size={13} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Row 2: Category pills (always visible on desktop, toggle on mobile) */}
            <div className={`mt-3 flex flex-col gap-2 ${filterOpen || true ? 'block' : 'hidden'} sm:block`}>
              {/* Category pills */}
              <div
                className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
                style={{ scrollbarWidth: 'none' }}
              >
                <button
                  id="filter-all"
                  onClick={clearAll}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    !selectedCategorySlug
                      ? 'bg-[#85142b] text-white border-[#85142b] shadow-md shadow-[#85142b]/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#85142b]/40 hover:text-[#85142b]'
                  }`}
                >
                  All
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    id={`filter-cat-${cat.slug || cat.id}`}
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug || cat.id);
                      setSelectedSubcategoryId(undefined);
                    }}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                      selectedCategorySlug === (cat.slug || cat.id)
                        ? 'bg-[#85142b] text-white border-[#85142b] shadow-md shadow-[#85142b]/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#85142b]/40 hover:text-[#85142b]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Subcategory pills */}
              {activeSubcategories.length > 0 && (
                <div
                  className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100"
                  style={{ scrollbarWidth: 'none' }}
                >
                  <button
                    onClick={() => { setSelectedSubcategoryId(undefined); }}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      !selectedSubcategoryId
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    All {activeCategory?.name}
                  </button>
                  {activeSubcategories.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => { setSelectedSubcategoryId(sub.id); }}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                        selectedSubcategoryId === sub.id
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}


            </div>
          </div>
        </div>

        {/* ── Product Grid ────────────────────────────── */}
        <div className="mt-6 pb-16">
          {isLoading ? (
            /* Skeleton Loader */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <div
                    className="w-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
                    style={{ paddingBottom: '130%', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }}
                  />
                  <div className="p-3 sm:p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded-full w-4/5 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <p className="text-red-500 text-lg">Error loading products. Please try again.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <FilterX className="h-16 w-16 text-gray-200 mb-5" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-sm">
                We couldn't find anything matching your search or filters. Try adjusting them!
              </p>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="mt-6 px-8 py-2.5 bg-[#85142b] text-white rounded-full font-semibold hover:bg-[#6c1023] transition-colors shadow-md shadow-[#85142b]/20"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* results count */}
              {(hasFilters || totalProducts) && (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-800">{products.length}</span>
                    {totalProducts ? ` of ${totalProducts.toLocaleString('en-IN')}` : ''} products
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearAll}
                      className="text-xs font-semibold text-[#85142b] hover:underline flex items-center gap-1"
                    >
                      <X size={12} /> Clear filters
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product as any} index={idx} />
                ))}
              </div>

              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="col-span-full mt-12 flex justify-center items-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin text-[#85142b]" />
                      <span className="text-sm font-medium">Loading more…</span>
                    </div>
                  )}
                </div>
              )}

              {!hasNextPage && products.length > 12 && (
                <div className="mt-12 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                    <span className="h-px w-8 bg-gray-200" />
                    You've seen it all
                    <span className="h-px w-8 bg-gray-200" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
