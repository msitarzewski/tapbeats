import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    // Self-signed HTTPS cert for local dev (required for getUserMedia)
    basicSsl(),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5173,
    // Required headers for SharedArrayBuffer support (used by AudioWorklet
    // ring buffers when available, with fallback for browsers that do not
    // support cross-origin isolation).
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunk for long-term caching
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },

  // Serve public/ directory as-is (includes worklet scripts)
  publicDir: 'public',

  define: {
    // Strip devtools middleware and debug logging in production
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});
