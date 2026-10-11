import dynamic from 'next/dynamic';
import CategoryNav from '@/components/CategoryNav';
import HeroSlider from '@/components/HeroSlider';
import SpotlightDualBanners from '@/components/SpotlightDualBanners';
import RoyalCuratedTabs from '@/components/RoyalCuratedTabs';
import OccasionShowcase from '@/components/OccasionShowcase';
import HeritageValues from '@/components/HeritageValues';
import BrideTestimonials from '@/components/BrideTestimonials';
import { fetchPublicTrpc } from '@/lib/server-data';
import { pageMetadata, jsonLd, absoluteUrl, SITE_URL } from '@/lib/seo';

const CategorySection = dynamic(() => import('@/components/CategorySection'));
const CategoryBanner = dynamic(() => import('@/components/CategoryBanner'));

type ProductList = { items: any[] };

export const metadata = pageMetadata({
  title: 'Anmol Vastralay | Royal Indian Ethnic Wear & Bridal Couture',
  description:
    'Discover handcrafted Banarasi silk sarees, regal bridal lehengas, and designer anarkali suits at Anmol Vastralay. Authentic handloom weaves, pan-India delivery & best prices.',
  path: '/',
});

export default async function Home() {
  const [banners, latest, allProducts, categories] = await Promise.all([
    fetchPublicTrpc<any[]>('banner.getBanners', { placement: 'HERO' }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 8, includeInactive: false }),
    fetchPublicTrpc<ProductList>('product.list', { pageSize: 40, includeInactive: false }),
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
    name: 'Anmol Vastralay',
    description: 'Luxury Indian ethnic wear, bridal lehengas, and pure handloom silk sarees.',
    potentialAction: {
      '@type': 'SearchAction',
      target: absoluteUrl('/search?q={search_term_string}'),
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="bg-[#faf8f5] min-h-screen text-[#1c1417]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
      />

      {/* ── 1. Circular Curated Category Story Bubbles ────────── */}
      <CategoryNav initialCategories={categories || []} />

      {/* ── 2. Cinema-Grade Luxury Hero Slider ──────────────── */}
      <header>
        <HeroSlider initialBanners={banners || []} />
      </header>

      {/* ── 3. High-Impact Dual Editorial Spotlights ─────────── */}
      <SpotlightDualBanners />

      {/* ── 4. Interactive Royal Curated Masterpiece Tabs ─────── */}
      <RoyalCuratedTabs initialProducts={latest?.items || []} />

      {/* ── 5. Shop By Royal Occasion Showcase ───────────────── */}
      <OccasionShowcase />

      {/* ── 6. Category Sections with Dedicated Banners ──────── */}
      {(categories || []).map((category: any) => {
        const categoryProducts = productsByCategory.get(category.id) || [];
        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.id}>
            <CategoryBanner title={category.name} slug={category.slug} />
            <CategorySection
              title={`Latest in ${category.name}`}
              slug={category.slug}
              initialProducts={categoryProducts}
            />
          </section>
        );
      })}

      {/* ── 7. The Anmol Promise & Artisan Heritage Values ───── */}
      <HeritageValues />

      {/* ── 8. Bride Testimonials & Social Proof ─────────────── */}
      <BrideTestimonials />
    </div>
  );
}
