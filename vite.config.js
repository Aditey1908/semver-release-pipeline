import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

// The dashboard lives in web/ and is bundled into dist/ by scripts/build.js.
export default defineConfig({
  root: path.join(root, 'web'),
  // Relative asset URLs: the same build works at "/" (container) and "/<repo>/" (GitHub Pages)
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.join(root, 'web/src'),
      // The semver engine is shared with the server
      '@core': path.join(root, 'src/core'),
    },
  },
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: true,
  },
  // `npm run dev:web` (hot reload) proxies data and API calls to `npm run dev` on :3000
  server: {
    proxy: Object.fromEntries(
      ['/api', '/health', '/build-info.json', '/releases.json'].map((p) => [p, 'http://localhost:3000']),
    ),
  },
});
