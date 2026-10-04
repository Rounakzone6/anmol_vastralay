import Image from 'next/image';
import { pageMetadata, jsonLd, absoluteUrl } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About Us',
  description: 'Learn about Anmol Vastralay, our journey, and our commitment to premium ethnic and modern wear.',
  path: '/about',
});

export default function AboutPage() {
  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: absoluteUrl('/about'),
    name: 'About Anmol Vastralay',
    description: 'Learn about Anmol Vastralay, our journey, and our commitment to premium ethnic and modern wear.',
    mainEntity: {
      '@type': 'Organization',
      name: 'Anmol Vastralay',
      foundingDate: '2010', // Just an example
    }
  };

  return (
    <div className="bg-white min-h-screen py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(aboutPageJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl relative inline-block">
            About Anmol Vastralay
            <span className="absolute -bottom-4 left-1/4 w-1/2 h-1.5 bg-[#85142b] rounded-full"></span>
          </h1>
          <p className="mt-8 text-xl text-gray-500 leading-relaxed">
            Your trusted destination for premium ethnic and modern wear. We believe in bringing you the best quality fabrics with the latest designs at unbeatable prices.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="relative aspect-w-3 aspect-h-2 bg-gray-100 rounded-2xl overflow-hidden h-[500px]">
              {/* Using the Saree banner as a placeholder image for the about page */}
              <Image 
                src="/category-icons/cat_saree_1781796874870.png" 
                alt="Anmol Vastralay Storefront" 
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Journey</h2>
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>
                Founded with a passion for traditional Indian textiles and modern fashion, Anmol Vastralay started as a humble boutique and has grown into a premier destination for fashion enthusiasts.
              </p>
              <p>
                Our mission is simple: to provide high-quality, beautifully crafted clothing that makes our customers feel confident and connected to their roots, without breaking the bank.
              </p>
              <p>
                From hand-woven sarees to trendy western wear, our diverse collection ensures that there's something perfect for everyone, for every occasion.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="text-[#85142b] text-4xl font-extrabold mb-2">10K+</div>
            <div className="text-gray-900 font-medium">Happy Customers</div>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="text-[#85142b] text-4xl font-extrabold mb-2">500+</div>
            <div className="text-gray-900 font-medium">Unique Designs</div>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="text-[#85142b] text-4xl font-extrabold mb-2">100%</div>
            <div className="text-gray-900 font-medium">Quality Guaranteed</div>
          </div>
        </div>

      </div>
    </div>
  );
}
