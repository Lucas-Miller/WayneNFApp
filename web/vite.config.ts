// vite.config.ts

import { fileURLToPath, URL } from 'node:url';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Code shared with the mobile app (../shared)
        '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      },
    },
    build: {
      // The bundled boundary snapshot (~1.5 MB) is its own lazy chunk, only fetched when
      // both the API and ODNR are unreachable
      chunkSizeWarningLimit: 1600,
    },
    server: {
      fs: { allow: ['..'] },
      // In dev, /api is proxied to the Go backend so the browser never makes a
      // cross-origin request. Production builds call VITE_API_BASE_URL directly.
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'https://wayneapi.lucasmiller.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
