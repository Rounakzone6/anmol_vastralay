import { pageMetadata } from '@/lib/seo';
import CollectionsClient from './CollectionsClient';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const hasFilters = Object.keys(params).length > 0;
  
  return pageMetadata({
    title: 'All Collections | Anmol Vastralay',
    description: 'Browse our complete collection of premium ethnic wear, western fashion, sarees, kurtis, and accessories.',
    path: '/collections',
    noindex: hasFilters, // Do not index faceted search results
  });
}

export default function CollectionsPage() {
  return <CollectionsClient />;
}
