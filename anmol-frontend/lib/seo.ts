import type { Metadata } from 'next';

export const SITE_URL = 'https://anmolvastralay.com';
export const SITE_NAME = 'Anmol Vastralay';
export const DEFAULT_TITLE = 'Anmol Vastralay | Premium Ethnic & Western Fashion in India';
export const DEFAULT_DESCRIPTION =
  'Shop premium ethnic wear, western fashion and everyday styles from Anmol Vastralay, Gopalganj, Bihar.';

export function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path;
  return new URL(path, `${SITE_URL}/`).toString();
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
}): Metadata {
  const image = input.image ? absoluteUrl(input.image) : absoluteUrl('/og-image.png');
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: absoluteUrl(input.path) },
    openGraph: {
      title: input.title,
      description: input.description,
      url: absoluteUrl(input.path),
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: { card: 'summary_large_image', title: input.title, description: input.description, images: [image] },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['ClothingStore', 'LocalBusiness', 'Organization'],
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/logo.png'),
  image: absoluteUrl('/og-image.png'),
  telephone: '+91-9102171696',
  email: 'anmolvastralayofficial@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Baliwan Sagar, Kuchaikote',
    addressLocality: 'Gopalganj',
    addressRegion: 'Bihar',
    postalCode: '841501',
    addressCountry: 'IN',
  },
  sameAs: [
    'https://www.facebook.com/share/18k6EaEqDK/',
    'https://www.instagram.com/anmol_vastralay',
    'https://www.youtube.com/@anmol_vastralay'
  ],
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '26.4725',
    longitude: '84.4447'
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '20:00'
    }
  ],
  priceRange: '₹₹',
  areaServed: {
    '@type': 'Country',
    name: 'India'
  },
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, UPI, Net Banking',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9102171696',
    contactType: 'customer service',
    email: 'anmolvastralayofficial@gmail.com',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi']
  },
  hasMap: 'https://maps.app.goo.gl/AnmolVastralay'
};

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function breadcrumbJsonLd(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: absoluteUrl(breadcrumb.item),
    })),
  };
}
