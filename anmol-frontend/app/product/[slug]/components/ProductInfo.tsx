'use client';

import Link from 'next/link';
import { Heart, Share2, Star, Zap, Truck, BadgeCheck, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProductInfo({
  displayProduct,
  variants,
  netPrice,
  discountPct,
  mrp,
  savings,
  availableColors,
  availableSizes,
  selectedColor,
  selectedSize,
  selectedVariant,
  handleColorSelect,
  setSelectedSize,
  isWishlisted,
  setIsWishlisted,
  addToCartMutation,
  handleAddToCart,
  addedToCart,
  isAuthenticated,
  slug,
  reviewStats,
  router,
}: any) {
  /* ── Color → hex helper ── */
  const colorHex: Record<string, string> = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
    black: '#111827', white: '#f5f5f5', pink: '#ec4899', purple: '#a855f7',
    orange: '#f97316', brown: '#92400e', grey: '#9ca3af', gray: '#9ca3af',
    maroon: '#85142b', navy: '#1e3a5f', beige: '#d4c5a9', cream: '#fffdd0',
    teal: '#14b8a6', cyan: '#06b6d4', gold: '#d4af37', silver: '#c0c0c0',
    violet: '#7c3aed', indigo: '#4f46e5', magenta: '#d946ef', peach: '#ffcba4',
    lavender: '#e6e6fa', olive: '#808000', khaki: '#c3b091', coral: '#ff7f50',
  };
  const getHex = (c: string) => colorHex[c.toLowerCase().trim()] || '#d1d5db';

  return (
    <div className="mt-8 lg:mt-0 flex flex-col">
      {/* Brand + actions row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          {displayProduct.brand && (
            <p className="text-xs font-bold uppercase tracking-widest text-[#85142b] mb-1">
              {displayProduct.brand}
            </p>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
            {displayProduct.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:shadow transition-all"
            aria-label="Wishlist"
          >
            <Heart
              size={18}
              className={isWishlisted ? 'fill-[#85142b] stroke-[#85142b]' : 'stroke-gray-500'}
            />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: displayProduct.name, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:shadow transition-all"
            aria-label="Share"
          >
            <Share2 size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Ratings */}
      {reviewStats && reviewStats.totalCount > 0 ? (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md">
            <Star size={11} fill="white" strokeWidth={0} />
            {reviewStats.averageRating.toFixed(1)}
          </div>
          <span className="text-xs text-gray-400">{reviewStats.totalCount} reviews</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-green-600 font-semibold cursor-pointer hover:underline" onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
            Read reviews
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <Star size={14} className="text-gray-300" /> No reviews yet
        </div>
      )}

      {/* Price Block */}
      <div className="mt-5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            ₹{netPrice.toLocaleString('en-IN')}
          </span>
          {mrp && (
            <span className="text-lg text-gray-400 line-through font-medium">
              ₹{Math.round(mrp).toLocaleString('en-IN')}
            </span>
          )}
          {discountPct > 0 && (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
              <Zap size={12} /> {Math.round(discountPct)}% off
            </span>
          )}
        </div>
        {savings > 0 && (
          <p className="mt-1.5 text-sm text-green-700 font-semibold">
            You save ₹{Math.round(savings).toLocaleString('en-IN')} 🎉
          </p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
          <Truck size={14} className="text-green-600" />
          <span className="font-semibold text-green-700">Free Delivery</span>
          <span className="text-gray-400 text-xs"> · Usually ships in 2–4 days</span>
        </div>
      </div>

      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Color
            </h3>
            <span className="text-sm font-medium text-[#85142b] capitalize">{selectedColor}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {availableColors.map((color: string) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                title={color}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                  selectedColor === color
                    ? 'border-[#85142b] bg-rose-50 text-[#85142b] shadow-md shadow-[#85142b]/15'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-200 shadow-sm shrink-0"
                  style={{ background: getHex(color) }}
                />
                {color}
                {selectedColor === color && (
                  <BadgeCheck size={14} className="text-[#85142b]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Size
            </h3>
            <span className="text-sm font-medium text-[#85142b]">{selectedSize}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size: string) => {
              const variant = variants.find(
                (v: any) => v.color === selectedColor && v.size === size
              );
              const outOfStock = variant && variant.stockQty <= 0;
              return (
                <button
                  key={size}
                  onClick={() => !outOfStock && setSelectedSize(size)}
                  disabled={outOfStock}
                  className={`relative min-w-[52px] px-4 py-2.5 text-sm font-bold rounded-xl border-2 text-center transition-all duration-200 ${
                    selectedSize === size
                      ? 'border-[#85142b] bg-[#85142b] text-white shadow-md shadow-[#85142b]/25'
                      : outOfStock
                      ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-[#85142b]/50 hover:text-[#85142b]'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status */}
      {variants.length > 0 && selectedVariant && (
        <div className="mt-3">
          {selectedVariant.stockQty > 10 ? (
            <p className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              In Stock
            </p>
          ) : selectedVariant.stockQty > 0 ? (
            <p className="text-sm text-orange-600 font-semibold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Only {selectedVariant.stockQty} left — order soon!
            </p>
          ) : (
            <p className="text-sm text-red-600 font-semibold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              Out of Stock
            </p>
          )}
        </div>
      )}

      {/* ── CTA Buttons ── */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          id="btn-add-to-cart"
          onClick={handleAddToCart}
          disabled={
            addToCartMutation.isPending ||
            (variants.length > 0 && (!selectedVariant || selectedVariant.stockQty <= 0))
          }
          className={`flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-6 py-4 text-base font-bold transition-all duration-200 shadow-sm ${
            addedToCart
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-[#85142b] bg-white text-[#85142b] hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <ShoppingCart size={20} />
          {addToCartMutation.isPending
            ? 'Adding…'
            : addedToCart
            ? '✓ Added to Cart!'
            : variants.length > 0 && (selectedVariant?.stockQty ?? 1) <= 0
            ? 'Out of Stock'
            : 'Add to Cart'}
        </button>

        <button
          type="button"
          id="btn-buy-now"
          onClick={() => {
            if (!isAuthenticated) { router.push('/login?redirect=/product/' + slug); return; }
            if (variants.length > 0 && !selectedVariant) { alert('Please select color & size'); return; }
            addToCartMutation.mutate(
              { productId: displayProduct.id, variantId: selectedVariant?.id, quantity: 1 },
              { onSuccess: () => router.push('/cart') }
            );
          }}
          disabled={
            addToCartMutation.isPending ||
            (variants.length > 0 && (!selectedVariant || selectedVariant.stockQty <= 0))
          }
          className="flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-2xl bg-[#85142b] px-6 py-4 text-base font-bold text-white hover:bg-[#6c1023] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#85142b]/30"
        >
          <Zap size={18} fill="white" strokeWidth={0} />
          Buy Now
        </button>
      </div>

      {/* Login nudge */}
      {!isAuthenticated && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          <Link href="/login" className="text-[#85142b] hover:underline font-semibold">Login</Link>
          {' '}or{' '}
          <Link href="/register" className="text-[#85142b] hover:underline font-semibold">Register</Link>
          {' '}to add items to your cart.
        </p>
      )}

      {/* ── Product Specifications ── */}
      <div className="mt-7 border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">
          Product Details
        </h3>
        <dl className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm text-sm divide-y divide-gray-50">
          {[
            displayProduct.brand && ['Brand', displayProduct.brand],
            ['Product', displayProduct.name],
            displayProduct.category?.name && ['Category', displayProduct.category.name],
            displayProduct.subcategory?.name && ['Subcategory', displayProduct.subcategory.name],
            displayProduct.itemType?.name && ['Type', displayProduct.itemType.name],
          ]
            .filter(Boolean)
            .map((row: any, i) => (
              <div
                key={i}
                className={`flex items-start px-5 py-3 gap-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
              >
                <dt className="w-28 shrink-0 font-semibold text-gray-500">{row[0]}</dt>
                <dd className="text-gray-800 font-medium">{row[1]}</dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
}
