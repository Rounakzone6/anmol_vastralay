import { NextResponse } from 'next/server';

const STATIC_ROUTES = [
  '/',
  '/about',
  '/collections',
  '/cart',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/login',
  '/register',
  '/checkout',
  '/profile',
  '/shipping',
];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  let productUrls: string[] = [];
  try {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (api) {
      const res = await fetch(`${api}/product.list?input=${encodeURIComponent(JSON.stringify({ pageSize: 1000 }))}`);
      if (res.ok) {
        const data = await res.json();
        const products = data?.result?.data?.items || [];
        productUrls = products.map((p: any) => `/product/${p.slug || p.id}`);
      }
    }
  } catch (e) {
    // ignore and continue with static routes
    console.error('sitemap generation error', e);
  }

  const urls = [...STATIC_ROUTES, ...productUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${baseUrl}${u}</loc>\n  </url>`)
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
