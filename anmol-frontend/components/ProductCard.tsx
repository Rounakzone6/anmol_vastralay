import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ product }: { product: any }) {
  return (
    <Link 
      href={`/product/${product.slug || product.id}`}
      className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors shadow-sm hover:shadow-md"
    >
      <div className="aspect-h-5 aspect-w-4 bg-gray-100 relative">
        {product.images?.length > 0 ? (
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
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
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
  );
}
