'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles, Tag, ArrowRight, Loader2, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface SearchAutocompleteProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  placeholder?: string;
}

export default function SearchAutocomplete({
  variant = 'desktop',
  onNavigate,
  placeholder = 'Saree, Jeans, Kurti, T-shirt khojein...',
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input to reduce unnecessary calls (150ms for snappy feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Open dropdown when query has >= 2 characters
  const shouldFetch = debouncedQuery.length >= 2;

  // tRPC suggestions query with backend Bloom Filter gate
  const { data, isLoading } = trpc.product.searchSuggestions.useQuery(
    { query: debouncedQuery, limit: 6 },
    {
      enabled: shouldFetch,
      staleTime: 60 * 1000,
    }
  );

  const products = data?.products || [];
  const categories = data?.categories || [];
  const totalItems = categories.length + products.length;

  // Reset highlight index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [products, categories]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    // If an item was highlighted with keyboard, navigate to it
    if (highlightedIndex >= 0) {
      if (highlightedIndex < categories.length) {
        const cat = categories[highlightedIndex];
        goToCategory(cat.slug || cat.name);
        return;
      } else {
        const prod = products[highlightedIndex - categories.length];
        if (prod) {
          goToProduct(prod.slug);
          return;
        }
      }
    }

    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const goToProduct = (slug: string) => {
    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/product/${slug}`);
  };

  const goToCategory = (categorySlug: string) => {
    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push(`/collections?category=${encodeURIComponent(categorySlug)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || totalItems === 0) {
      if (e.key === 'Enter') handleSubmit(e);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Helper to highlight matching prefix/word in product name
  const highlightMatch = (text: string, prefix: string) => {
    if (!prefix || !text) return text;
    const index = text.toLowerCase().indexOf(prefix.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + prefix.length);
    const after = text.slice(index + prefix.length);

    return (
      <>
        {before}
        <strong className="text-[#85142b] font-bold underline decoration-[#85142b]/40 decoration-2">
          {match}
        </strong>
        {after}
      </>
    );
  };

  const isDesktop = variant === 'desktop';

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          className={
            isDesktop
              ? 'w-full rounded-full border border-gray-300 bg-gray-50/90 py-2 pl-4 pr-16 text-sm transition-all focus:border-[#85142b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#85142b]/20 shadow-xs'
              : 'w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-4 pr-16 text-sm transition-all focus:border-[#85142b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#85142b]/20 shadow-xs'
          }
        />

        {/* Clear & Submit Actions inside search input */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="submit"
            className="p-1.5 rounded-full text-gray-400 hover:text-[#85142b] hover:bg-[#85142b]/5 transition-colors"
            aria-label="Search"
          >
            {isLoading && shouldFetch ? (
              <Loader2 size={16} className="animate-spin text-[#85142b]" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>
      </form>

      {/* Live Suggestions Dropdown Popover */}
      {isOpen && shouldFetch && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 ${
            isDesktop ? 'w-full' : 'w-full'
          }`}
        >
          {/* Header Bar with Bloom Filter Indicator */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80 border-b border-gray-100 text-[11px]">
            <span className="font-medium text-gray-600 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-600" />
              Suggestions for &ldquo;{debouncedQuery}&rdquo;
            </span>

            {/* Bloom Filter Verified Badge */}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold tracking-wide"
              title="Bloom Filter verified term in catalog with zero false negatives"
            >
              <Zap size={10} className="text-emerald-600 fill-emerald-600" />
              Bloom Filter ⚡
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && products.length === 0 && categories.length === 0 && (
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-gray-100 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-gray-100 rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Results Container */}
          {!isLoading && totalItems === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                <Search size={18} />
              </div>
              <p className="text-sm font-medium text-gray-800">
                Koi item nahi mila &ldquo;{debouncedQuery}&rdquo; ke liye
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bloom Filter ne check kiya. Try &ldquo;Kurti&rdquo;, &ldquo;Saree&rdquo;, &ldquo;Jeans&rdquo;, ya &ldquo;Suit&rdquo;
              </p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-3 text-xs font-semibold text-[#85142b] hover:underline"
              >
                Search all collections for &ldquo;{debouncedQuery}&rdquo; →
              </button>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
              {/* Matching Categories Pill Section */}
              {categories.length > 0 && (
                <div className="p-2.5 bg-gray-50/50">
                  <p className="text-[10px] uppercase font-bold text-gray-400 px-1 mb-1.5 tracking-wider">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat, idx) => {
                      const isHighlighted = highlightedIndex === idx;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => goToCategory(cat.slug || cat.name)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isHighlighted
                              ? 'bg-[#85142b] text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-[#85142b] hover:text-[#85142b]'
                          }`}
                        >
                          <Tag size={12} className={isHighlighted ? 'text-amber-200' : 'text-amber-600'} />
                          <span>{highlightMatch(cat.name, debouncedQuery)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Products List */}
              {products.length > 0 && (
                <div className="py-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 px-3 pt-2 pb-1 tracking-wider">
                    Products
                  </p>
                  {products.map((product, idx) => {
                    const actualIdx = categories.length + idx;
                    const isHighlighted = highlightedIndex === actualIdx;
                    return (
                      <div
                        key={product.id}
                        onClick={() => goToProduct(product.slug)}
                        onMouseEnter={() => setHighlightedIndex(actualIdx)}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                          isHighlighted ? 'bg-[#85142b]/5' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Thumbnail Image */}
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200/60">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Search size={16} />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-800 truncate">
                            {highlightMatch(product.name, debouncedQuery)}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {product.categoryName && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium truncate max-w-[120px]">
                                {product.categoryName}
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#85142b]">
                              ₹{product.sellingPrice?.toLocaleString('en-IN')}
                            </span>
                            {product.discountPercent > 0 && (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{product.netPrice?.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow hint on highlight */}
                        <ArrowRight
                          size={14}
                          className={`transition-transform text-gray-400 ${
                            isHighlighted ? 'text-[#85142b] translate-x-0.5' : 'opacity-0'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer "See all results" */}
              <div className="p-2 bg-gray-50/80 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full py-2 px-3 flex items-center justify-between text-xs font-semibold text-[#85142b] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-amber-200"
                >
                  <span className="flex items-center gap-1.5">
                    <Search size={13} />
                    View all results for &ldquo;{debouncedQuery}&rdquo;
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">
                    Press Enter ↵
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
