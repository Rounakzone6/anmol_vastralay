import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/cart',
        '/checkout',
        '/profile',
        '/orders',
        '/wishlist',
        '/login',
        '/register',
        '/chatbot',
        '/*?search=',
        '/*?*category=', // Keep this if we have query filters
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
