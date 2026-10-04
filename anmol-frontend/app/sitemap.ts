import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const STATIC_ROUTES = [
  '',
  '/about',
  '/collections',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/shipping',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      // Simplified fetch for sitemap to avoid large payloads, ideally paginate this in a real scenario
      const res = await fetch(`${api}/product.list?input=${encodeURIComponent(JSON.stringify({ json: { pageSize: 500 } }))}`);
      if (res.ok) {
        const data = await res.json();
        const products = data?.result?.data?.json?.items || data?.result?.data?.items || [];
        productRoutes = products.map((p: any) => ({
          url: `${baseUrl}/product/${p.slug || p.id}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        }));
      }
    }
  } catch (e) {
    console.error('sitemap generation error', e);
  }

  // Generate category routes
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      const res = await fetch(`${api}/category.list?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`);
      if (res.ok) {
        const data = await res.json();
        const categories = data?.result?.data?.json || data?.result?.data || [];
        categories.forEach((cat: any) => {
          categoryRoutes.push({
            url: `${baseUrl}/collections/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
          });
          
          if (cat.subcategories) {
            cat.subcategories.forEach((sub: any) => {
              categoryRoutes.push({
                url: `${baseUrl}/collections/${cat.slug}/${sub.slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
              });
            });
          }
        });
      }
    }
  } catch (e) {
    console.error('category sitemap generation error', e);
  }

  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
