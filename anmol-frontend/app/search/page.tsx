import { pageMetadata } from '@/lib/seo';
import CollectionsClient from '@/app/collections/CollectionsClient';

export const metadata = pageMetadata({
  title: 'Search Results',
  description: 'Search results for products at Anmol Vastralay.',
  path: '/search',
  noindex: true,
});

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {q ? `Search Results for "${q}"` : 'Search Products'}
        </h1>
        {/* We can re-use CollectionsClient which has fetching logic, 
            or build a custom search results component. */}
        <CollectionsClient initialSearchTerm={q || ''} />
      </div>
    </div>
  );
}
