import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Create Account',
  description: 'Create an Anmol Vastralay account to track orders and save your wishlist.',
  path: '/register',
  noindex: true,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
