'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearToken, getToken } from '@/lib/auth';
import { trpc } from '@/lib/trpc';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/trpc',
          headers() {
            const token = getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export function useLogout() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return () => {
    clearToken();
    utils.invalidate();
    router.push('/login');
    router.refresh();
  };
}
