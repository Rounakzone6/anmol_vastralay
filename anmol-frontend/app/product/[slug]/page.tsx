'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { trpc } from '../../../lib/trpc';
import { useAuth } from '../../../lib/useAuth';

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Try fetching by slug, fallback to ID if slug not found
  const { data: product, isLoading, error } = trpc.product.getBySlug.useQuery(
    { slug },
    { retry: false }
  );

  const { data: productById } = trpc.product.getById.useQuery(
    { id: slug },
    { enabled: !!error } // Only run if getBySlug failed
  );

  const displayProduct = product || productById;

  const addToCartMutation = trpc.cart.addToCart.useMutation({
    onSuccess: () => {
      router.push('/cart');
    },
    onError: (err) => {
      if (err.data?.code === 'UNAUTHORIZED') {
        router.push('/login?redirect=/product/' + slug);
      } else {
        alert(err.message);
      }
    }
  });

  if (isLoading && !error) {
    return <div className="p-12 text-center text-gray-500 text-lg">Loading product details...</div>;
  }

  if (!displayProduct) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link href="/" className="mt-4 rounded-md bg-[#85142b] px-6 py-2 text-white hover:bg-[#6c1023]">
          Return Home
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    addToCartMutation.mutate({
      productId: displayProduct.id,
      quantity: 1,
    });
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Catalog
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="aspect-h-5 aspect-w-4 w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
              {displayProduct.images.length > 0 ? (
                <img
                  loading="lazy"
                  src={displayProduct.images[0].url}
                  alt={displayProduct.name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ShoppingCart size={48} strokeWidth={1} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">{displayProduct.name}</h1>
            
            <div className="mt-4 flex items-end gap-3">
              <p className="text-3xl font-bold text-gray-900">
                ₹{Number(displayProduct.netPrice).toFixed(2)}
              </p>
              {Number(displayProduct.discountPercent) > 0 && (
                <>
                  <p className="text-lg text-gray-500 line-through mb-1">
                    ₹{(Number(displayProduct.netPrice) * (1 + Number(displayProduct.discountPercent)/100)).toFixed(2)}
                  </p>
                  <span className="text-sm font-bold text-green-600 mb-1.5">
                    {displayProduct.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
            
            <div className="mt-3 inline-flex">
               <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md flex items-center">
                 <Truck className="h-3 w-3 mr-1" /> Free Delivery
               </span>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>{displayProduct.description || "No description provided."}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
              <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-green-600" />
                <span className="font-medium">100% Authentic Quality</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Fast Dispatch</span>
              </div>
            </div>

            <div className="mt-10 flex">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="flex max-w-xs flex-1 items-center justify-center rounded-lg border border-transparent bg-[#85142b] px-8 py-3.5 text-base font-bold text-white hover:bg-[#6c1023] focus:outline-none focus:ring-2 focus:ring-[#85142b] focus:ring-offset-2 disabled:opacity-50 sm:w-full shadow-md transition-all"
              >
                {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                <ShoppingCart className="ml-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              </button>
            </div>
            
            {!isAuthenticated && (
              <p className="mt-4 text-sm text-gray-500 text-center sm:text-left">
                Please <Link href="/login" className="text-[#85142b] hover:underline font-medium">login</Link> or <Link href="/register" className="text-[#85142b] hover:underline font-medium">register</Link> to add items to your cart.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
