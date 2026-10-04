import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMetadata, absoluteUrl, jsonLd } from '@/lib/seo';

const articles: Record<string, any> = {
  'saree-draping-guide': {
    title: 'The Ultimate Saree Draping Guide for Beginners',
    description: 'Learn step-by-step how to drape a saree perfectly for any occasion. From Nivi style to Bengali drape.',
    date: '2026-10-01',
    author: 'Anmol Vastralay Team',
    category: 'Style Guide',
    content: `
      <p>Draping a saree is an art form. It brings elegance and grace to the wearer.</p>
      <h2>1. The Classic Nivi Drape</h2>
      <p>The Nivi drape originated in Andhra Pradesh and is the most widely accepted style of draping today. It requires a well-fitted blouse, a petticoat, and your beautiful saree.</p>
      <h2>2. Fabric Choices</h2>
      <p>For beginners, lightweight fabrics like Georgette, Chiffon, or Crepe are recommended as they are easier to pleat and carry compared to stiff Cottons or heavy Kanjeevaram silks.</p>
      <h2>Ready to Shop?</h2>
      <p>Check out our latest <a href="/collections/sarees">Saree Collection</a> to find the perfect fabric for your next occasion!</p>
    `
  },
  'wedding-wear-lehenga-guide': {
    title: 'Wedding Wear: Choosing the Perfect Lehenga',
    description: 'A comprehensive guide to selecting the right lehenga color, fabric, and work for your special day.',
    date: '2026-09-15',
    author: 'Anmol Vastralay Team',
    category: 'Wedding',
    content: `
      <p>Your wedding lehenga is one of the most important outfits you'll ever wear.</p>
      <h2>1. Choose the Right Color</h2>
      <p>While red is traditional, modern brides are opting for pastels, emerald greens, and deep maroons.</p>
      <h2>2. Fabric Matters</h2>
      <p>Velvet is great for winter weddings, while lightweight net and organza are perfect for summer and destination weddings.</p>
      <h2>Explore Lehengas</h2>
      <p>Visit our <a href="/collections/lehengas">Lehenga Collection</a> for premium options.</p>
    `
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return { title: 'Article Not Found', robots: { index: false } };
  
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/guides/${slug}`,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: absoluteUrl('/og-image.png'),
    datePublished: new Date(article.date).toISOString(),
    author: {
      '@type': 'Organization',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Anmol Vastralay',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png')
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/guides/${slug}`)
    }
  };

  return (
    <article className="bg-white min-h-screen py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-sm font-bold text-[#85142b] uppercase tracking-widest">{article.category}</span>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">{article.title}</h1>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>By {article.author}</span>
            <span>&bull;</span>
            <time dateTime={article.date}>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
          </div>
        </div>
        
        <div 
          className="prose prose-lg max-w-none prose-a:text-[#85142b] prose-a:font-semibold hover:prose-a:text-[#b01e3f] prose-headings:font-bold prose-headings:text-gray-900"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        <div className="mt-16 pt-8 border-t border-gray-200">
          <Link href="/guides" className="text-[#85142b] font-medium hover:underline flex items-center">
            &larr; Back to all guides
          </Link>
        </div>
      </div>
    </article>
  );
}
