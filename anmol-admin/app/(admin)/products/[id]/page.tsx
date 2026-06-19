'use client';

import { use } from 'react';
import { ProductForm } from '@/components/product-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Eye, EyeOff } from 'lucide-react';

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
    </div>
  );
}
