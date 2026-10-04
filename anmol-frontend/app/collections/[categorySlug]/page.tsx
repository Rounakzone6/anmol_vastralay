import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { fetchPublicTrpc } from '@/lib/server-data';
import { pageMetadata } from '@/lib/seo';

type Category = { name: string; slug: string; description?: string | null };
type ProductList = { items: any[]; total: number };

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await fetchPublicTrpc<Category>('category.getBySlug', { slug: categorySlug });
  if (!category) return { title: 'Category not found', robots: { index: false, follow: false } };
  return pageMetadata({
    title: category.metaTitle || `${category.name} Collection`,
    description: category.metaDescription || category.description || `Explore the latest ${category.name.toLowerCase()} styles at Anmol Vastralay.`,
    path: `/collections/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await fetchPublicTrpc<Category>('category.getBySlug', { slug: categorySlug });
  if (!category) notFound();
  const products = await fetchPublicTrpc<ProductList>('product.list', { categorySlug, pageSize: 30, includeInactive: false });
  return (
    <main className="min-h-screen bg-[#faf9f7] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-gray-500"><Link href="/">Home</Link> <span aria-hidden="true">/</span> {category.name}</nav>
        <h1 className="text-4xl font-extrabold text-gray-900">{category.name}</h1>
        {category.description && <p className="mt-3 max-w-2xl text-gray-600">{category.description}</p>}
        <section aria-label={`${category.name} products`} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {(products?.items || []).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </section>
      </div>
    </main>
  );
}
