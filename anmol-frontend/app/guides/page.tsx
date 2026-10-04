import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Style Guides & Fashion Tips',
  description: 'Read our expert style guides, fashion tips, and lookbooks for ethnic and western wear.',
  path: '/guides',
  keywords: ['fashion tips', 'saree draping guide', 'wedding wear', 'fabric care', 'size guides']
});

const guides = [
  {
    title: 'The Ultimate Saree Draping Guide for Beginners',
    slug: 'saree-draping-guide',
    description: 'Learn step-by-step how to drape a saree perfectly for any occasion. From Nivi style to Bengali drape.',
    date: '2026-10-01',
    category: 'Style Guide'
  },
  {
    title: 'Wedding Wear: Choosing the Perfect Lehenga',
    slug: 'wedding-wear-lehenga-guide',
    description: 'A comprehensive guide to selecting the right lehenga color, fabric, and work for your special day.',
    date: '2026-09-15',
    category: 'Wedding'
  }
];

export default function GuidesPage() {
  return (
    <div className="bg-[#faf9f7] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Style Guides & Tips</h1>
        <p className="text-lg text-gray-600 mb-12">Expert advice, styling tips, and deep dives into traditional fashion.</p>
        
        <div className="space-y-8">
          {guides.map((guide) => (
            <article key={guide.slug} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-[#85142b] uppercase tracking-wider mb-2 block">{guide.category}</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                <Link href={`/guides/${guide.slug}`} className="hover:text-[#85142b] transition-colors">
                  {guide.title}
                </Link>
              </h2>
              <p className="text-gray-600 mb-4">{guide.description}</p>
              <div className="flex items-center justify-between mt-6">
                <span className="text-sm text-gray-400">{new Date(guide.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <Link href={`/guides/${guide.slug}`} className="text-sm font-semibold text-[#85142b] hover:underline">
                  Read Article &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
