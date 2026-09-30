// G101's lane override (X3e's pattern, docs/prompts/runs/X3e/scripts-playwright.x3e-4383.config.ts): the
// default config on port 4617, so this lane never shares a port with another worktree's preview and
// nothing runs on 4173 (the main checkout's chains own it); two workers; the preview of an existing build
// (`npm run build:app` runs before Playwright, never under it). The fixture's storage state names port
// 4173's origin, so the same two flags are given here for this origin. Not for the commit: moved to
// docs/prompts/runs/G101/ after the runs.
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4617;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  workers: 2,
  // Under the worktree's build/ (the brief's rule for temp state), resolved against this file's folder.
  outputDir: '../build/g101/test-results',
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
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
