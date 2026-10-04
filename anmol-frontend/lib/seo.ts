import type { Metadata } from 'next';

export const SITE_URL = 'https://anmolvastralay.com';
export const SITE_NAME = 'Anmol Vastralay';
export const DEFAULT_TITLE = 'Anmol Vastralay | Premium Ethnic & Western Fashion in India';
export const DEFAULT_DESCRIPTION =
  'Shop premium ethnic wear, western fashion and everyday styles from Anmol Vastralay, Gopalganj, Bihar.';

export function absoluteUrl(path = '/') {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const image = input.image ? absoluteUrl(input.image) : absoluteUrl('/og-image.png');
  return {
    title: input.title,
    description: input.description,
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
  };
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['ClothingStore', 'LocalBusiness'],
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/logo.png'),
  image: absoluteUrl('/og-image.png'),
  telephone: '+91-9430490696',
  email: 'anmolvastralay@gmail.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Gopalganj',
    addressRegion: 'Bihar',
    postalCode: '841428',
    addressCountry: 'IN',
  },
};

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
