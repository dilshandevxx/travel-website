import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The Express server in server.ts mounts Vite as middleware in development,
// so there is no separate dev server or proxy to configure here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    // The JSON database changes on every write; don't reload the page for it.
    watch: { ignored: ['**/data/**', '**/legacy/**'] },
  },
  // One bundle for all three apps is fine for a simulator; don't warn about its size.
  build: { outDir: 'dist', chunkSizeWarningLimit: 700 },
});
