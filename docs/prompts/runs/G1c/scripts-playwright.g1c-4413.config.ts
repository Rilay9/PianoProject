// G1c's override: the default config on port 4413, so this lane's runs never share port 4173 with
// another worktree's (U74's pattern, as G1b's 4403). The app is built before Playwright, never under
// it (a build mid-run swaps the service worker). `G1C_DIST` serves another build folder (the
// committed code's, for the red run and the before pictures); `G1C_OUT` puts Playwright's output
// outside `app/`.
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4413;
const ORIGIN = `http://localhost:${String(PORT)}`;
const DIST = process.env.G1C_DIST ?? 'dist';

export default defineConfig({
  ...base,
  outputDir: process.env.G1C_OUT ?? 'test-results-g1c',
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    // The fixture's storage state names port 4173's origin; the same two flags here.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: ORIGIN,
          localStorage: [
            { name: 'pianopath.setup', value: '{"status":"skipped","at":"2026-09-09T00:00:00.000Z","version":1}' },
            { name: 'pianopath.firstSight', value: '["*"]' },
          ],
        },
      ],
    },
  },
  webServer: {
    command: `npx vite preview --outDir "${DIST}" --port ${String(PORT)} --strictPort`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
