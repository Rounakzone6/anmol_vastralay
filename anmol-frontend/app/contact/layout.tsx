import { pageMetadata, jsonLd, absoluteUrl } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact Us',
  description: 'Get in touch with Anmol Vastralay. We are here to help you with your orders and queries.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const contactPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: absoluteUrl('/contact'),
    name: 'Contact Anmol Vastralay',
    description: 'Contact Anmol Vastralay customer support.',
    mainEntity: {
      '@type': 'Organization',
      name: 'Anmol Vastralay',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9102171696',
        contactType: 'customer service',
        email: 'anmolvastralayofficial@gmail.com',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi']
      }
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(contactPageJsonLd) }} />
      {children}
    </>
  );
}
