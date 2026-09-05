import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Deployed to GitHub Pages under the repo name by default; override with
// VITE_BASE for local/other hosting (see docs/01-architecture.md §9).
const base = process.env.VITE_BASE ?? '/PianoProject/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // we call registerSW() ourselves in main.ts
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '/',
        name: 'PianoPath',
        short_name: 'PianoPath',
        description: 'An all-in-one piano-teaching app with sheet music that follows your playing.',
        start_url: '.',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Content (scores, catalog/curriculum JSON, lesson markdown, the
        // bundled soundfont) is precached alongside the app shell so the
        // whole app works fully offline once installed. The soundfont in
        // particular can be tens of MB, hence the raised size cap.
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico,woff2}',
          'content/**/*.{json,mxl,musicxml,md,sf2}',
        ],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/content\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2022',
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
