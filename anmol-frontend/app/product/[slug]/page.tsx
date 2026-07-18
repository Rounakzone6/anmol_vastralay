'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  ArrowLeft,
  Truck,
  RotateCcw,
  Star,
  Heart,
  Share2,
  ChevronRight,
  Package,
  BadgeCheck,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { useAuth } from '../../../lib/useAuth';
import ProductCard from '../../../components/ProductCard';

/* ──────────────────────────────────────────────────────
   Skeleton loader while product fetches
────────────────────────────────────────────────────── */
function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-14">
          {/* image skeleton */}
          <div className="skeleton-shimmer rounded-2xl" style={{ paddingBottom: '120%' }} />
          {/* info skeleton */}
          <div className="mt-10 lg:mt-0 space-y-5">
            <div className="skeleton-shimmer h-5 w-1/4 rounded-full" />
            <div className="skeleton-shimmer h-9 w-3/4 rounded-xl" />
            <div className="skeleton-shimmer h-5 w-1/3 rounded-full" />
            <div className="skeleton-shimmer h-10 w-1/2 rounded-xl" />
            <div className="skeleton-shimmer h-24 rounded-xl" />
            <div className="skeleton-shimmer h-14 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────────── */
export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const { data: product, isLoading, error } = trpc.product.getBySlug.useQuery(
    { slug },
    { retry: false }
  );
  const { data: productById } = trpc.product.getById.useQuery(
    { id: slug },
    { enabled: !!error }
  );

  const displayProduct = product || productById;

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  // Reviews Data
  const { data: reviewsData, refetch: refetchReviews } = trpc.review.listByProduct.useQuery(
    { productId: displayProduct?.id || '' },
    { enabled: !!displayProduct?.id }
  );
  
  const { data: reviewStats, refetch: refetchStats } = trpc.review.stats.useQuery(
    { productId: displayProduct?.id || '' },
    { enabled: !!displayProduct?.id }
  );

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const addReviewMutation = trpc.review.add.useMutation({
    onSuccess: () => {
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      refetchReviews();
      refetchStats();
      alert('Review added successfully!');
    },
    onError: (err) => alert(err.message)
  });

  // Suggested products (same category)
  const { data: suggestedData } = trpc.product.list.useQuery(
    {
      pageSize: 6,
      includeInactive: false,
      categorySlug: displayProduct?.category?.slug || undefined,
    },
    { enabled: !!displayProduct?.category?.slug }
  );
  const suggestedProducts = (suggestedData?.items || []).filter(
    (p) => p.id !== displayProduct?.id
  ).slice(0, 4);

  useEffect(() => {
    if (displayProduct?.variants?.length) {
      const firstColor = displayProduct.variants[0].color;
      setSelectedColor(firstColor);
      const firstWithColor = displayProduct.variants.find((v: any) => v.color === firstColor);
      setSelectedSize(firstWithColor?.size || '');
    }
  }, [displayProduct]);

  const addToCartMutation = trpc.cart.addToCart.useMutation({
    onSuccess: () => {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    },
    onError: (err) => {
      if (err.data?.code === 'UNAUTHORIZED') {
        router.push('/login?redirect=/product/' + slug);
      } else {
        alert(err.message);
      }
    },
  });

  /* ── Loading / Not found states ── */
  if (isLoading && !error) return <ProductDetailSkeleton />;

  if (!displayProduct) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center gap-5 px-4">
        <Package size={64} strokeWidth={1} className="text-gray-200" />
        <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
        <p className="text-gray-500">This product may have been removed or the link is incorrect.</p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 rounded-full bg-[#85142b] px-8 py-3 text-white font-semibold hover:bg-[#6c1023] transition-colors shadow-lg shadow-[#85142b]/25"
        >
          <ArrowLeft size={16} /> Browse Collections
        </Link>
      </div>
    );
  }

  /* ── Derived data ── */
  const variants = displayProduct.variants || [];
  const images = displayProduct.images || [];
  const netPrice = Number(displayProduct.netPrice);
  const discountPct = Number(displayProduct.discountPercent || 0);
  const mrp = discountPct > 0
    ? netPrice * (1 + discountPct / 100)
    : null;
  const savings = mrp ? mrp - netPrice : 0;

  const availableColors = Array.from(
    new Set(variants.map((v: any) => v.color).filter(Boolean))
  ) as string[];

  const availableSizes = Array.from(
    new Set(
      variants
        .filter((v: any) => v.color === selectedColor && v.size)
        .map((v: any) => v.size)
    )
  ) as string[];

  const selectedVariant = variants.find(
    (v: any) =>
      v.color === selectedColor &&
      (v.size === selectedSize || (!v.size && !selectedSize))
  );

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const sizesForColor = variants
      .filter((v: any) => v.color === color && v.size)
      .map((v: any) => v.size);
    if (sizesForColor.length > 0 && !sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0]);
    } else if (sizesForColor.length === 0) {
      setSelectedSize('');
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/product/' + slug);
      return;
    }
    if (variants.length > 0 && !selectedVariant) {
      alert('Please select a valid color and size');
      return;
    }
    addToCartMutation.mutate({
      productId: displayProduct.id,
      variantId: selectedVariant?.id,
      quantity: 1,
    });
  };

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
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {/* ── Breadcrumb ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 py-3 text-xs text-gray-400 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link href="/" className="hover:text-[#85142b] transition-colors font-medium">Home</Link>
            <ChevronRight size={12} />
            <Link href="/collections" className="hover:text-[#85142b] transition-colors font-medium">Collections</Link>
            {displayProduct.category?.name && (
              <>
                <ChevronRight size={12} />
                <Link
                  href={`/collections?category=${displayProduct.category?.slug || ''}`}
                  className="hover:text-[#85142b] transition-colors font-medium"
                >
                  {displayProduct.category.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-gray-700 font-semibold truncate max-w-[180px]">{displayProduct.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16">

          {/* ═══════════════════════════════════════════
              LEFT — Image Gallery
          ═══════════════════════════════════════════ */}
          <div className="flex flex-col gap-3">
            {/* Main Image */}
            <div
              className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm cursor-zoom-in product-detail-img"
              style={{ paddingBottom: '120%' }}
              onClick={() => setShowZoom(true)}
            >
              {images.length > 0 ? (
                <Image
                  src={images[activeImageIdx]?.url || images[0].url}
                  alt={displayProduct.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top absolute inset-0 transition-all duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-200 bg-gray-50">
                  <Package size={80} strokeWidth={0.5} />
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 opacity-70">
                <ZoomIn size={12} /> Zoom
              </div>

              {/* Discount badge on image */}
              {discountPct > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#85142b] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-md">
                  <Zap size={11} fill="white" strokeWidth={0} />
                  {Math.round(discountPct)}% OFF
                </div>
              )}

              {/* Nav arrows for multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImageIdx((i) => Math.max(0, i - 1)); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-gray-600 hover:bg-white transition-all"
                    style={{ display: activeImageIdx === 0 ? 'none' : 'flex' }}
                  >
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImageIdx((i) => Math.min(images.length - 1, i + 1)); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-gray-600 hover:bg-white transition-all"
                    style={{ display: activeImageIdx === images.length - 1 ? 'none' : 'flex' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto thumb-strip pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`shrink-0 relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      activeImageIdx === i
                        ? 'border-[#85142b] shadow-md shadow-[#85142b]/20'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${displayProduct.name} ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges row */}
            <div className="hidden lg:grid grid-cols-3 gap-3 mt-2">
              {[
                { icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-50', label: '100% Authentic' },
                { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Free Delivery' },
                { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Easy Returns' },
              ].map(({ icon: Icon, color, bg, label }) => (
                <div key={label} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${bg} border border-gray-100`}>
                  <Icon size={20} className={color} />
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              RIGHT — Product Info
          ═══════════════════════════════════════════ */}
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
                  onClick={() => setIsWishlisted((w) => !w)}
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
                  {availableColors.map((color) => (
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
                  {availableSizes.map((size) => {
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

            {/* ── Trust badges (mobile) ── */}
            <div className="lg:hidden grid grid-cols-3 gap-2.5 mt-6">
              {[
                { icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-50', label: '100% Authentic' },
                { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Free Delivery' },
                { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Easy Returns' },
              ].map(({ icon: Icon, color, bg, label }) => (
                <div key={label} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${bg} border border-gray-100`}>
                  <Icon size={18} className={color} />
                  <span className="text-[10px] font-semibold text-gray-700 text-center">{label}</span>
                </div>
              ))}
            </div>

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
        </div>

        {/* ═══════════════════════════════════════════
            REVIEWS SECTION
        ═══════════════════════════════════════════ */}
        <div id="reviews-section" className="mt-16 border-t border-gray-100 pt-12">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Customer Reviews
              </h2>
              <div className="mt-1.5 h-1 w-12 rounded-full bg-[#85142b]" />
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-5 py-2.5 rounded-full border border-[#85142b] text-[#85142b] text-sm font-semibold hover:bg-[#85142b] hover:text-white transition-colors"
            >
              Write a Review
            </button>
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <div className="mb-10 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden transform transition-all duration-500 ease-in-out">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#85142b] to-rose-400"></div>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-rose-50 rounded-full text-[#85142b]">
                  <Star size={24} fill="currentColor" strokeWidth={0} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900 leading-tight">Write a Review</h3>
                  <p className="text-sm text-gray-500">Help others by sharing your feedback</p>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="bg-gray-50/80 p-8 rounded-2xl text-center border border-gray-100">
                  <p className="text-base text-gray-600 mb-4 font-medium">Please log in to share your thoughts.</p>
                  <Link href={`/login?redirect=/product/${slug}`} className="inline-flex items-center gap-2 px-8 py-3 bg-[#85142b] text-white rounded-full text-sm font-bold hover:bg-[#6c1023] hover:scale-105 transition-all shadow-lg shadow-[#85142b]/20">
                    Login Now
                  </Link>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addReviewMutation.mutate({
                    productId: displayProduct.id,
                    rating: reviewRating,
                    title: reviewTitle,
                    comment: reviewComment,
                  });
                }} className="space-y-6">
                  
                  {/* Rating selection */}
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-800 mb-3 text-center sm:text-left">Overall Rating</label>
                    <div className="flex justify-center sm:justify-start gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`relative p-2 rounded-xl transition-all duration-300 ${
                            reviewRating >= star 
                              ? 'text-yellow-400 bg-yellow-50 scale-110 shadow-sm' 
                              : 'text-gray-300 bg-white hover:bg-gray-50 hover:text-yellow-200'
                          }`}
                        >
                          <Star size={28} fill="currentColor" strokeWidth={0} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Review Title (Optional)</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 focus:border-[#85142b] transition-all text-sm font-medium outline-none"
                        placeholder="Sum up your experience in one sentence"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">Review Details (Optional)</label>
                      <textarea
                        rows={4}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 focus:border-[#85142b] transition-all text-sm font-medium outline-none resize-none"
                        placeholder="What did you like or dislike? How did it fit?"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addReviewMutation.isPending}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#85142b] text-white text-sm font-bold rounded-xl hover:bg-[#6c1023] disabled:opacity-70 transition-all shadow-lg shadow-[#85142b]/25 hover:-translate-y-0.5 flex justify-center items-center gap-2"
                    >
                      {addReviewMutation.isPending ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Reviews List */}
          <div className="grid gap-6">
            {!reviewsData || reviewsData.items.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviewsData.items.map((review: any) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex flex-shrink-0 items-center justify-center text-gray-500 font-bold uppercase text-sm overflow-hidden">
                      {review.user?.profileImage ? (
                        <Image
                          src={review.user.profileImage}
                          alt=""
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        review.user?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i >= review.rating ? 'text-gray-200' : ''} />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {review.title && <h4 className="font-semibold text-gray-900 text-sm mt-3 mb-1">{review.title}</h4>}
                  {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            RELATED PRODUCTS
        ═══════════════════════════════════════════ */}
        {suggestedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-12">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  You May Also Like
                </h2>
                <div className="mt-1.5 h-1 w-12 rounded-full bg-[#85142b]" />
              </div>
              <Link
                href="/collections"
                className="text-sm font-semibold text-[#85142b] hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {suggestedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p as any} index={idx} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Zoom Modal ───────────────────────────────── */}
      {showZoom && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowZoom(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
            onClick={() => setShowZoom(false)}
          >
            ✕
          </button>
          <div className="relative w-[90vw] max-w-lg" style={{ paddingBottom: '120%' }}>
            <Image
              src={images[activeImageIdx]?.url || images[0].url}
              alt={displayProduct.name}
              fill
              className="object-contain object-center"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}
