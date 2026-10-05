import CategoryNav from '@/components/CategoryNav';
import HeroSlider from '@/components/HeroSlider';
import LatestArrivals from '@/components/LatestArrivals';
import CategorySection from '@/components/CategorySection';
import CategoryBanner from '@/components/CategoryBanner';
import { fetchPublicTrpc } from '@/lib/server-data';
import { pageMetadata, jsonLd, absoluteUrl, SITE_URL } from '@/lib/seo';

type ProductList = { items: any[] };

export const metadata = pageMetadata({
  title: 'Premium Ethnic & Western Fashion in India',
  description: 'Shop premium ethnic wear, western fashion and everyday styles from Anmol Vastralay, Gopalganj, Bihar. Discover sarees, kurtis, jeans, and more.',
  path: '/',
});

export default async function Home() {
  const [banners, latest, allProducts, categories] = await Promise.all([
    fetchPublicTrpc<any[]>('banner.getBanners', { placement: 'HERO' }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 8, includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 100, includeInactive: false }),
    fetchPublicTrpc<any[]>('category.list', { includeInactive: false }),
  ]);

  const productsByCategory = new Map<string, any[]>();
  for (const product of allProducts?.items || []) {
    const categoryId = product.category?.id || product.categoryId;
    if (!categoryId) continue;
    const products = productsByCategory.get(categoryId) || [];
    if (products.length < 4) products.push(product);
    productsByCategory.set(categoryId, products);
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: absoluteUrl('/search?q={search_term_string}'),
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }} />
      <CategoryNav initialCategories={categories || []} />
      <header>
        <HeroSlider initialBanners={banners || []} />
      </header>
      <LatestArrivals initialProducts={latest?.items || []} />
      {(categories || []).map((category: any) => {
        const categoryProducts = productsByCategory.get(category.id) || [];
        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.id}>
            <CategoryBanner title={category.name} slug={category.slug} />
            <CategorySection
              title={`Latest ${category.name}`}
              slug={category.slug}
              initialProducts={categoryProducts}
            />
          </section>
        );
      })}
    </div>
  );
}
