import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The frontend builds into `public/`, which is exactly what both runtimes
 * already serve: Fastify via @fastify/static locally, and Vercel's CDN in
 * production (`outputDirectory: "public"`). Nothing in `src/` or `api/` had to
 * change to accommodate React.
 *
 * `web/public/` holds the self-hosted fonts. They are copied verbatim, so the
 * page has no third-party font request and cannot flash or fail on venue wi-fi.
 */
export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
    // The whole app is ~30kb of JS. Splitting it would cost a round trip to
    // save nothing, and this page is judged on how fast the first paint lands.
    cssCodeSplit: false,
  },
  server: {
    port: 5199,
    // Dev only: the API keeps running under `npm run dev` on 3600.
    proxy: {
      '/api': 'http://localhost:3600',
      '/health': 'http://localhost:3600',
    },
  },
});
