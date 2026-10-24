// main.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { APIProvider } from '@vis.gl/react-google-maps';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/lib/auth';
import { CONFIG } from '@/lib/config';
import { routeTree } from './routeTree.gen';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <APIProvider apiKey={CONFIG.GOOGLE_MAPS_API_KEY}>
          <RouterProvider router={router} />
        </APIProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
