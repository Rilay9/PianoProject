// X3b's override (Entry 128): the default config on port 4347, so this lane's runs never share port
// 4173 with another worktree's; at most two workers; the preview of an existing build (the build runs
// before Playwright, never under it). X3a's copy (docs/prompts/runs/X3a/) is the pattern. Port 4347,
// not the brief's 4343: a vendor service on this machine (AcerCCAgent.exe) listens on 0.0.0.0:4343 and
// [::]:4343 (`port-4343-held.txt`), and another lane's preview held 4333. Moved to docs/prompts/runs/X3b/
// after the runs.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4347;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  workers: 2,
  // Outside the worktree: nothing of the runs is left beside the tracked files.
  outputDir: join(tmpdir(), 'pianopath-x3b', 'test-results'),
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
