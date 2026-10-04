import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'AI Assistant',
  description: 'Chat with our AI assistant for styling tips and product recommendations.',
  path: '/chatbot',
  noindex: true,
});

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
