'use client';

import { use } from 'react';
import { ProductForm } from '@/components/product-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui';
import { trpc } from '@/lib/trpc';

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
        title={product?.name ?? 'Edit product'}
        description="Update pricing, variants, and stock"
        action={
          product ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActive.mutate({ id, isActive: !product.isActive })}
            >
              {product.isActive ? 'Hide from shop' : 'Publish'}
            </Button>
          ) : null
        }
      />
      <ProductForm productId={id} />
    </div>
  );
}
