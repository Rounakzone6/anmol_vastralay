import { notFound } from 'next/navigation';
import { fetchPublicTrpc } from '@/lib/server-data';
import { absoluteUrl, jsonLd, pageMetadata } from '@/lib/seo';
import ProductDetailsClient from './ProductDetailsClient';

type Product = {
  id: string;
  name: string;
  slug: string;
  brand?: string | null;
  netPrice: number | string;
  discountPercent?: number | string;
  images?: { url: string }[];
  category?: { name: string; slug: string } | null;
  variants?: unknown[];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchPublicTrpc<Product>('product.getBySlug', { slug });
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } };
  return pageMetadata({
    title: `${product.name}${product.brand ? ` by ${product.brand}` : ''}`,
    description: `Shop ${product.name} from Anmol Vastralay. Explore quality fashion with delivery across India.`,
    path: `/product/${product.slug}`,
    image: product.images?.[0]?.url,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchPublicTrpc<Product>('product.getBySlug', { slug });
  if (!product) notFound();

  const price = Number(product.netPrice);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: absoluteUrl(`/product/${product.slug}`),
    image: product.images?.map((image) => absoluteUrl(image.url)),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/product/${product.slug}`),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} />
      <ProductDetailsClient initialProduct={product} />
    </>
  );
}
