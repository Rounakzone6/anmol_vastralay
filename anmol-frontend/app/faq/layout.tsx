import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Find answers to frequently asked questions about Anmol Vastralay orders, shipping, payments, and our 7-day return policy.',
  keywords: ['Anmol Vastralay FAQ', 'how to return', 'track order', 'clothing store FAQ', 'payment methods'],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
