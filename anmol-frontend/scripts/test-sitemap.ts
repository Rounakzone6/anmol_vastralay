import type { MetadataRoute } from 'next';
const route: MetadataRoute.Sitemap[0] = {
  url: 'https://example.com',
  lastModified: new Date(),
  changeFrequency: 'daily',
  priority: 1,
  images: ['https://example.com/image.jpg']
};
console.log(route);
