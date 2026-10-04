import CategoryNav from '@/components/CategoryNav';
import HeroSlider from '@/components/HeroSlider';
import LatestArrivals from '@/components/LatestArrivals';
import CategorySection from '@/components/CategorySection';
import CategoryBanner from '@/components/CategoryBanner';
import { fetchPublicTrpc } from '@/lib/server-data';
import { pageMetadata } from '@/lib/seo';

type ProductList = { items: any[] };

export const metadata = pageMetadata({
  title: 'Anmol Vastralay | Premium Ethnic & Western Fashion in India',
  description: 'Shop premium ethnic wear, western fashion and everyday styles from Anmol Vastralay, Gopalganj, Bihar. Discover sarees, kurtis, jeans, and more.',
  path: '/',
});

export default async function Home() {
  const [banners, latest, sarees, women, men, kids, innerwear] = await Promise.all([
    fetchPublicTrpc<any[]>('banner.getBanners', { placement: 'HERO' }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 8, includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 4, categorySlug: 'saree', includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 4, categorySlug: 'women', includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 4, categorySlug: 'men', includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 4, categorySlug: 'kids', includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 4, categorySlug: 'innerwear', includeInactive: false }),
  ]);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <CategoryNav />
      <header>
        <HeroSlider initialBanners={banners || []} />
      </header>
      <main>
        <div className="sr-only">
          <h1>Anmol Vastralay - Premium Ethnic & Western Fashion for Every Occasion</h1>
        </div>
        <LatestArrivals initialProducts={latest?.items || []} />
        <CategoryBanner title="Premium Sarees" slug="saree" />
        <CategorySection title="Top Picks for Sarees" slug="saree" initialProducts={sarees?.items || []} />
        <CategoryBanner title="Women's Collection" slug="women" />
        <CategorySection title="Latest in Women's Fashion" slug="women" initialProducts={women?.items || []} />
        <CategoryBanner title="Men's Collection" slug="men" />
        <CategorySection title="Trending in Men's Wear" slug="men" initialProducts={men?.items || []} />
        <CategoryBanner title="Kidswear" slug="kids" />
        <CategorySection title="Adorable Kids Fashion" slug="kids" initialProducts={kids?.items || []} />
        <CategoryBanner title="Innerwear Essentials" slug="innerwear" />
        <CategorySection title="Comfortable Innerwear" slug="innerwear" initialProducts={innerwear?.items || []} />
      </main>
    </div>
  );
}
