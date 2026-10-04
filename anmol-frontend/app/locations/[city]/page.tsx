import { notFound } from 'next/navigation';
import { pageMetadata, absoluteUrl, jsonLd } from '@/lib/seo';
import { MapPin, Phone, Clock, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const locations: Record<string, any> = {
  gopalganj: {
    name: 'Gopalganj',
    title: 'Anmol Vastralay - Premium Clothing Store in Gopalganj, Bihar',
    description: 'Visit Anmol Vastralay in Gopalganj for the best sarees, lehengas, and western wear. Experience premium quality ethnic wear locally in Bihar.',
    address: 'Baliwan Sagar, Kuchaikote, Gopalganj, Bihar (841501)',
    phone: '+91-9102171696',
    hours: 'Monday - Sunday: 7:00 AM - 8:00 PM',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1177.362648294691!2d84.35432671065797!3d26.570027455783773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39930f9ccc54e2cb%3A0xc20c683f322f2fae!2sAnmol%20vastralay!5e1!3m2!1sen!2sin!4v1781933271824!5m2!1sen!2sin',
    features: ['In-store shopping', 'Click and collect', 'Trial rooms', 'Alteration services']
  }
};

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const location = locations[city.toLowerCase()];
  if (!location) return { title: 'Location Not Found', robots: { index: false } };
  
  return pageMetadata({
    title: location.title,
    description: location.description,
    path: `/locations/${city}`,
    keywords: [
      `clothing store in ${location.name}`,
      `saree shop ${location.name}`,
      `buy clothes ${location.name}`,
      `best boutique in ${location.name} Bihar`
    ]
  });
}

export default async function LocationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const location = locations[city.toLowerCase()];
  
  if (!location) notFound();

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: `Anmol Vastralay ${location.name}`,
    image: absoluteUrl('/og-image.png'),
    '@id': absoluteUrl(`/locations/${city}`),
    url: absoluteUrl(`/locations/${city}`),
    telephone: location.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Baliwan Sagar, Kuchaikote',
      addressLocality: location.name,
      addressRegion: 'Bihar',
      postalCode: '841501',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '26.4725',
      longitude: '84.4447'
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '20:00'
    }
  };

  return (
    <div className="bg-[#faf9f7] min-h-screen py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessJsonLd) }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Info Section */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <span className="text-sm font-bold text-[#85142b] uppercase tracking-widest mb-4 block">Our Physical Store</span>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
                Anmol Vastralay in {location.name}
              </h1>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-[#85142b] mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                    <p className="text-gray-600 leading-relaxed">{location.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-[#85142b] mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Store Hours</h3>
                    <p className="text-gray-600 leading-relaxed">{location.hours}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-[#85142b] mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Contact</h3>
                    <a href={`tel:${location.phone.replace(/[^0-9+]/g, '')}`} className="text-gray-600 hover:text-[#85142b] transition-colors">{location.phone}</a>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-[#85142b]" /> Store Services
                </h3>
                <ul className="grid grid-cols-2 gap-3">
                  {location.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#85142b] mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-10">
                <Link href="/collections" className="inline-block px-8 py-4 bg-[#85142b] text-white rounded-full font-semibold hover:bg-[#6c1023] transition-colors shadow-lg shadow-[#85142b]/30">
                  Shop Online Instead
                </Link>
              </div>
            </div>
            
            {/* Map Section */}
            <div className="h-[400px] lg:h-auto bg-gray-100 relative">
              <iframe 
                src={location.mapUrl}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map for Anmol Vastralay ${location.name}`}
              />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
