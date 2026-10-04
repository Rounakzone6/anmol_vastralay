import { SITE_URL } from '@/lib/seo';

export async function GET() {
  const content = `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /checkout\nDisallow: /profile\nDisallow: /orders\nDisallow: /wishlist\nDisallow: /login\nDisallow: /register\nDisallow: /chatbot\nDisallow: /*?search=\nDisallow: /*?*category=\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  return new Response(content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
