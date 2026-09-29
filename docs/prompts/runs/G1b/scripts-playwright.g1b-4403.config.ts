// G1b's override: the default config on port 4403, so this lane's runs never share port 4173
// with another worktree's (U74's pattern). The app is built before Playwright, never under it.
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4403;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  outputDir: 'test-results-g1b',
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
    command: `npx vite preview --port ${String(PORT)} --strictPort`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
