// Q76's override (X3d's pattern, docs/prompts/runs/X3d/scripts-playwright.x3d-4363.config.ts): the default
// config on port 4393, so this lane's runs never share port 4173 with another worktree's; at most two
// workers; the preview of an existing build (the app is built before Playwright, never under it). Moved to
// docs/prompts/runs/Q76/ after the runs.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4393;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  workers: 2,
  // Outside the worktree: nothing of the runs is left beside the tracked files.
  outputDir: join(tmpdir(), 'pianopath-q76', 'test-results'),
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
