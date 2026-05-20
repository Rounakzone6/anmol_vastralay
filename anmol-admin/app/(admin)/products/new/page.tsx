import { ProductForm } from '@/components/product-form';
import { PageHeader } from '@/components/page-header';

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Add product" description="Create a new item for your shop" />
      <ProductForm />
    </div>
  );
}
