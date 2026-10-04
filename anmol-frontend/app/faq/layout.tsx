import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'FAQ | Shipping, Returns & Payments',
  description: 'Find answers to frequently asked questions about Anmol Vastralay orders, shipping, payments, and our 7-day return policy.',
  path: '/faq',
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
