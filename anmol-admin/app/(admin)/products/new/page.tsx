import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';

const ProductForm = dynamic(
  () => import('@/components/product-form').then((mod) => mod.ProductForm),
  {
    loading: () => (
      <div className="h-[720px] animate-pulse rounded-xl bg-white shadow-sm" />
    ),
  },
);

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Add product" description="Create a new item for your shop" />
      <ProductForm />
    </div>
  );
}
