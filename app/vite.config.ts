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
        // Android's "share to app" for a bought score (docs/04 §4). The POST
        // is answered by public/share-target.js inside the service worker.
        share_target: {
          action: 'share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            files: [
              {
                name: 'score',
                accept: [
                  'application/vnd.recordare.musicxml+xml',
                  'application/vnd.recordare.musicxml',
                  'application/pdf',
                  'application/xml',
                  'text/xml',
                  '.musicxml',
                  '.mxl',
                  '.xml',
                  '.pdf',
                ],
              },
            ],
          },
        },
        file_handlers: [
          {
            action: '.',
            accept: {
              'application/pdf': ['.pdf'],
              'application/vnd.recordare.musicxml+xml': ['.musicxml'],
              'application/vnd.recordare.musicxml': ['.mxl'],
            },
          },
        ],
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
        // Loaded at the top of the generated worker, before Workbox's own
        // routes, so the share-target POST is handled rather than falling
        // through to the navigation fallback.
        importScripts: ['share-target.js'],
        // Everything is precached — app shell plus every score, the catalog,
        // the curriculum, every lesson and the soundfont — so that after the
        // first launch the app never needs the network again (docs/00 D20).
        //
        // The audio pattern is deliberately wide. The bundled soundfont is
        // currently a .js file, so it happens to be caught by the first
        // pattern; swapping it for an .sf2, .mp3 or .ogg would silently drop
        // it from the precache and the app would work perfectly until the
        // first time it was opened offline.
        //
        // `.mjs` is in the first pattern for a concrete reason: pdfjs-dist
        // ships its worker as `pdf.worker.min.mjs`, and with `js` alone the
        // worker was built, hashed and then silently left out of the
        // precache — so a PDF opened offline would have hung on a fetch.
        globPatterns: [
          '**/*.{js,mjs,css,html,svg,png,ico,woff2}',
          'content/**/*.{json,mxl,musicxml,md}',
          'content/**/*.{sf2,sf3,mp3,ogg,wav,js}',
        ],
        // Workbox's default is 2 MB and it skips larger files *silently*.
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        // Take control of the page that installed us, so the very first visit
        // is offline-capable rather than the second (docs/00 D20). Safe
        // without skipWaiting: this only claims clients that no worker is
        // controlling yet, so it never swaps assets under a running page.
        clientsClaim: true,
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
