import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About Anmol Vastralay | Our Journey in Indian Fashion',
  description: 'Learn about Anmol Vastralay, our history in Gopalganj, Bihar, and our commitment to bringing you premium ethnic and modern wear at the best prices.',
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
