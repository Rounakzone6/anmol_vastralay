import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Wishlist',
  description: 'View your saved items on Anmol Vastralay.',
  path: '/wishlist',
  noindex: true,
});

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
