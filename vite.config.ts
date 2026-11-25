import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { resolveCanonicalSiteOrigin } from './src/config/siteConfig';

export default defineConfig(() => {
  const siteUrl = resolveCanonicalSiteOrigin(process.env.SITE_URL);

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
                return 'vendor-firestore';
              }
              if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
                return 'vendor-auth';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-ui';
              }
              return 'vendor-core';
            }
          },
        },
      },
    },
  };
});
