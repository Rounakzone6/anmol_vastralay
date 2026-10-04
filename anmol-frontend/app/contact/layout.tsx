import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact Us | Customer Support & Store Location',
  description: 'Get in touch with Anmol Vastralay. We are here to help you with your orders, returns, and any queries about our ethnic and western clothing collections.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
