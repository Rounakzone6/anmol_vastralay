'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/lib/useAuth';
import { ProductGallery } from '@/app/product/[slug]/components/ProductGallery';
import { ProductInfo } from '@/app/product/[slug]/components/ProductInfo';
import { ProductReviews } from '@/app/product/[slug]/components/ProductReviews';
import { RelatedProducts } from '@/app/product/[slug]/components/RelatedProducts';

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
          <ProductGallery
            images={images}
            displayProduct={displayProduct}
            discountPct={discountPct}
            activeImageIdx={activeImageIdx}
            setActiveImageIdx={setActiveImageIdx}
            showZoom={showZoom}
            setShowZoom={setShowZoom}
          />
          <ProductInfo
            displayProduct={displayProduct}
            variants={variants}
            netPrice={netPrice}
            discountPct={discountPct}
            mrp={mrp}
            savings={savings}
            availableColors={availableColors}
            availableSizes={availableSizes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedVariant={selectedVariant}
            handleColorSelect={handleColorSelect}
            setSelectedSize={setSelectedSize}
            isWishlisted={isWishlisted}
            setIsWishlisted={setIsWishlisted}
            addToCartMutation={addToCartMutation}
            handleAddToCart={handleAddToCart}
            addedToCart={addedToCart}
            isAuthenticated={isAuthenticated}
            slug={slug}
            reviewStats={reviewStats}
            router={router}
          />
        </div>

        <ProductReviews
          displayProduct={displayProduct}
          reviewsData={reviewsData}
          reviewStats={reviewStats}
          isAuthenticated={isAuthenticated}
          slug={slug}
          refetchReviews={refetchReviews}
          refetchStats={refetchStats}
        />
        
        <RelatedProducts suggestedProducts={suggestedProducts} />
      </div>
    </div>
  );
}
