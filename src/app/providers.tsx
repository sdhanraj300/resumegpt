// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react'; // <-- Import SessionProvider
import { ReactNode, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  // This is your existing, correct setup for React Query
  const [queryClient] = useState(() => new QueryClient());

  // We simply nest the providers.
  // SessionProvider makes user session data available.
  // QueryClientProvider makes React Query's cache and hooks available.
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}