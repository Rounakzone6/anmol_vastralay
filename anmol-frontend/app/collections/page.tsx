import { pageMetadata } from '@/lib/seo';
import { fetchPublicTrpc } from '@/lib/server-data';
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

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const initialSearchTerm = typeof params.q === 'string' ? params.q : '';
  
  let initialData: any = null;
  let categories: any[] = [];
  try {
    const [products, cats] = await Promise.all([
      fetchPublicTrpc('product.list', { pageSize: 30, includeInactive: false, search: initialSearchTerm || undefined }),
      fetchPublicTrpc('category.list', { includeInactive: false })
    ]);
    initialData = { pages: [products], pageParams: [undefined] };
    categories = (cats as any[]) || [];
  } catch (e) {
    console.error('Failed to fetch initial collections data', e);
  }

  return <CollectionsClient initialSearchTerm={initialSearchTerm} initialData={initialData} initialCategories={categories} />;
}
