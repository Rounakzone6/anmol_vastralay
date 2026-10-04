import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Sign In',
  description: 'Sign in to your Anmol Vastralay account to track orders and save your wishlist.',
  path: '/login',
  noindex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
