'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { trpc } from '@/lib/trpc';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url:
            process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/trpc',
          headers() {
            if (typeof window !== 'undefined') {
              const token = localStorage.getItem('anmol_token');
              if (token) {
                return {
                  authorization: `Bearer ${token}`,
                };
              }
            }
            return {};
          },
        }),
      ],
    }),
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'missing-google-client-id'}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </GoogleOAuthProvider>
  );
}
