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

export async function generateSitemaps() {
  let total = 0;
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      const res = await fetch(
        `${api}/product.getSitemapProducts?input=${encodeURIComponent(
          JSON.stringify({ json: { page: 1, pageSize: 1 } }),
        )}`,
      );
      if (res.ok) {
        const data = await res.json();
        total = data?.result?.data?.json?.total || data?.result?.data?.total || 0;
      } else {
        console.error('generateSitemaps: API responded with status', res.status);
      }
    }
  } catch (e: any) {
    console.error('generateSitemaps error fetching total products:', e?.message || e);
  }

  const sitemaps = [{ id: 0 }]; // 0 for static and categories
  const maxProductsPerSitemap = 500;
  for (let i = 0; i < Math.ceil(total / maxProductsPerSitemap); i++) {
    sitemaps.push({ id: i + 1 });
  }
  return sitemaps;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  if (id === 0 || id === undefined) {
    const categoryRoutes: MetadataRoute.Sitemap = [];
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      if (api) {
        const res = await fetch(
          `${api}/category.list?input=${encodeURIComponent(
            JSON.stringify({ json: { includeInactive: false } }),
          )}`,
        );
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
        } else {
          console.error('sitemap: category.list responded with status', res.status);
        }
      }
    } catch (e: any) {
      console.error('sitemap: category generation error:', e?.message || e);
    }

    const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1.0 : 0.7,
    }));

    return [...staticRoutes, ...categoryRoutes];
  }

  // If id > 0, generate product routes using dedicated sitemap endpoint
  const page = id;
  const pageSize = 500;
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      const res = await fetch(
        `${api}/product.getSitemapProducts?input=${encodeURIComponent(
          JSON.stringify({ json: { page, pageSize } }),
        )}`,
      );
      if (res.ok) {
        const data = await res.json();
        const products =
          data?.result?.data?.json?.items || data?.result?.data?.items || [];
        productRoutes = products.map((p: any) => ({
          url: `${baseUrl}/product/${p.slug || p.id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        }));
      } else {
        console.error('sitemap: product.getSitemapProducts responded with status', res.status);
      }
    }
  } catch (e: any) {
    console.error('sitemap: product route generation error:', e?.message || e);
  }

  return productRoutes;
}

