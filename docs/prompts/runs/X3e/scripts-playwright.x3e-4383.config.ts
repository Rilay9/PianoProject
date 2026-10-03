// X3e's override (X3d's pattern, docs/prompts/runs/X3d/scripts-playwright.x3d-4363.config.ts): the default
// config on port 4383 — the brief's 4373 was held by another worktree's preview (port-4373-taken.txt) — so
// this lane's runs never share a port with another worktree's and nothing runs on 4173; at most two workers;
// the preview of an existing build (the build runs before Playwright, never under it). Moved to
// docs/prompts/runs/X3e/ after the runs.
//
// The first version of this file was a copy of playwright.config.ts with the port changed, which kept the
// fixture's storage state for port 4173's origin: at 4383 the first-sight card then covered the Score screen
// and every case that opens the tempo sheet timed out on its click (e2e-targeted-first.txt).
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4383;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  workers: 2,
  // Outside the worktree: nothing of the runs is left beside the tracked files.
  outputDir: join(tmpdir(), 'pianopath-x3e', 'test-results'),
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
