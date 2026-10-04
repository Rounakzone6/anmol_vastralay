import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { fetchPublicTrpc } from '@/lib/server-data';
import { pageMetadata, absoluteUrl, jsonLd } from '@/lib/seo';

type Category = { name: string; slug: string; description?: string | null; metaTitle?: string | null; metaDescription?: string | null; };
type ProductList = { items: any[]; total: number };

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await fetchPublicTrpc<Category>('category.getBySlug', { slug: categorySlug });
  if (!category) return { title: 'Category not found', robots: { index: false, follow: false } };
  return pageMetadata({
    title: category.metaTitle || `${category.name} Collection`,
    description: category.metaDescription || category.description || `Explore the latest ${category.name.toLowerCase()} styles at Anmol Vastralay.`,
    path: `/collections/${category.slug}`,
    keywords: [
      `${category.name.toLowerCase()} shop in Gopalganj`,
      `buy ${category.name.toLowerCase()} online Bihar`,
      `${category.name.toLowerCase()} online India`,
      `${category.name.toLowerCase()} ethnic wear`,
      `${category.name.toLowerCase()} store near me`
    ]
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await fetchPublicTrpc<Category>('category.getBySlug', { slug: categorySlug });
  if (!category) notFound();
  const products = await fetchPublicTrpc<ProductList>('product.list', { categorySlug, pageSize: 30, includeInactive: false });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: absoluteUrl('/collections') },
      { '@type': 'ListItem', position: 3, name: category.name, item: absoluteUrl(`/collections/${category.slug}`) }
    ]
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (products?.items || []).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/product/${p.slug || p.id}`)
    }))
  };
  return (
    <main className="min-h-screen bg-[#faf9f7] py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListJsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-gray-500"><Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/collections">Collections</Link> <span aria-hidden="true">/</span> {category.name}</nav>
        <h1 className="text-4xl font-extrabold text-gray-900">{category.name}</h1>
        <p className="mt-3 max-w-3xl text-gray-600 leading-relaxed">
          {category.description || `Welcome to our ${category.name} collection. Anmol Vastralay offers a wide range of premium ethnic and western wear for every occasion. We take pride in delivering the highest quality clothing with the latest trends and traditional roots.`}
        </p>
        <section aria-label={`${category.name} products`} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {(products?.items || []).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </section>
      </div>
    </main>
  );
}
