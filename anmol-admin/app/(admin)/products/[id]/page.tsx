'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Eye, EyeOff } from 'lucide-react';

const ProductForm = dynamic(
  () => import('@/components/product-form').then((mod) => mod.ProductForm),
  {
    loading: () => (
      <div className="h- animate-pulse rounded-xl bg-white shadow-sm" />
    ),
  },
);

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const utils = trpc.useUtils();
  const setActive = trpc.product.setActive.useMutation({
    onSuccess: () => {
      utils.product.getById.invalidate({ id });
      utils.product.list.invalidate();
    },
  });
  const { data: product } = trpc.product.getById.useQuery({ id });

  return (
    <div>
      <PageHeader
        title={product?.name ?? 'Edit Product'}
        description="Update pricing, variants, and stock quantities."
        action={
          product ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActive.mutate({ id, isActive: !product.isActive })}
              className={product.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 ring-rose-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-emerald-200'}
            >
              {product.isActive ? (
                <>
                  <EyeOff size={16} className="mr-2" />
                  Hide from shop
                </>
              ) : (
                <>
                  <Eye size={16} className="mr-2" />
                  Publish to shop
                </>
              )}
            </Button>
          ) : null
        }
      />
      <ProductForm productId={id} />
      {product && (
        <div className="mt-6 text-center text-sm font-medium text-slate-500 bg-slate-100 py-3 rounded-xl border border-slate-200">
          <p>Created by {product.createdBy?.name || 'System'} on {new Date(product.createdAt).toLocaleDateString()}</p>
          {product.updatedBy && (
            <p className="mt-1 text-xs text-slate-400">Last modified by {product.updatedBy.name} on {new Date(product.updatedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
