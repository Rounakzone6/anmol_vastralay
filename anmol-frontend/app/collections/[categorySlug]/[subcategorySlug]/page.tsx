import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { fetchPublicTrpc } from '@/lib/server-data';
import { pageMetadata, absoluteUrl, jsonLd } from '@/lib/seo';

type Subcategory = { id: string; name: string; slug: string; description?: string | null; metaTitle?: string | null; metaDescription?: string | null };
type Category = { name: string; slug: string; subcategories: Subcategory[] };
type ProductList = { items: any[]; total: number };

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string, subcategorySlug: string }> }) {
  const { categorySlug, subcategorySlug } = await params;
  const category = await fetchPublicTrpc<Category>('category.getBySlug', { slug: categorySlug });
  const subcategory = category?.subcategories?.find(s => s.slug === subcategorySlug);
  
  if (!category || !subcategory) return { title: 'Subcategory not found', robots: { index: false, follow: false } };
  
  return pageMetadata({
    title: subcategory.metaTitle || `${subcategory.name} in ${category.name} | Anmol Vastralay`,
    description: subcategory.metaDescription || subcategory.description || `Shop the latest ${subcategory.name.toLowerCase()} in ${category.name.toLowerCase()} at Anmol Vastralay.`,
    path: `/collections/${category.slug}/${subcategory.slug}`,
    keywords: [
      `${subcategory.name.toLowerCase()} shop in Gopalganj`,
      `buy ${subcategory.name.toLowerCase()} online Bihar`,
      `${subcategory.name.toLowerCase()} online India`,
      `${category.name.toLowerCase()} ${subcategory.name.toLowerCase()}`
    ]
  });
}

export default async function SubcategoryPage({ params }: { params: Promise<{ categorySlug: string, subcategorySlug: string }> }) {
  const { categorySlug, subcategorySlug } = await params;
  const category = await fetchPublicTrpc<Category>('category.getBySlug', { slug: categorySlug });
  const subcategory = category?.subcategories?.find(s => s.slug === subcategorySlug);
  
  if (!category || !subcategory) notFound();
  
  const products = await fetchPublicTrpc<ProductList>('product.list', { 
    categorySlug, 
    subcategoryId: subcategory.id,
    pageSize: 30, 
    includeInactive: false 
  });
  
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: absoluteUrl('/collections') },
      { '@type': 'ListItem', position: 3, name: category.name, item: absoluteUrl(`/collections/${category.slug}`) },
      { '@type': 'ListItem', position: 4, name: subcategory.name, item: absoluteUrl(`/collections/${category.slug}/${subcategory.slug}`) }
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
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/">Home</Link> <span aria-hidden="true">/</span> 
          <Link href="/collections">Collections</Link> <span aria-hidden="true">/</span> 
          <Link href={`/collections/${category.slug}`}>{category.name}</Link> <span aria-hidden="true">/</span> 
          {subcategory.name}
        </nav>
        <h1 className="text-4xl font-extrabold text-gray-900">{subcategory.name}</h1>
        <p className="mt-3 max-w-3xl text-gray-600 leading-relaxed">
          {subcategory.description || `Browse the latest ${subcategory.name} in our ${category.name} collection at Anmol Vastralay. We offer top-notch quality and the best styles in ethnic and western fashion. Delivery across India.`}
        </p>
        <section aria-label={`${subcategory.name} products`} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {(products?.items || []).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </section>
      </div>
    </main>
  );
}
