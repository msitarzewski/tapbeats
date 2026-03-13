import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import type { Plugin } from 'vite';

function collectFiles(dir: string, prefix: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const urlPath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      collectFiles(fullPath, urlPath, out);
    } else {
      out.push(urlPath);
    }
  }
}

function swManifestPlugin(): Plugin {
  return {
    name: 'sw-manifest',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const swPath = resolve(distDir, 'sw.js');

      if (!existsSync(swPath)) return;

      const assets: string[] = ['/index.html'];

      // Collect hashed assets
      const assetsDir = resolve(distDir, 'assets');
      if (existsSync(assetsDir)) {
        for (const file of readdirSync(assetsDir)) {
          assets.push(`/assets/${file}`);
        }
      }

      // Include samples and worklets from public/
      for (const dir of ['samples', 'worklets', 'fonts', 'icons']) {
        const fullDir = resolve(distDir, dir);
        if (existsSync(fullDir)) {
          collectFiles(fullDir, `/${dir}`, assets);
        }
      }

      let swContent = readFileSync(swPath, 'utf-8');
      swContent = swContent.replace(
        'self.__PRECACHE_MANIFEST__ || []',
        JSON.stringify(assets),
      );
      writeFileSync(swPath, swContent);
    },
  };
}

export default defineConfig({
  plugins: [react(), swManifestPlugin()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 8087,
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
