// X3's override (Entry 118): the base config on port 4263, one worker, the preview of an existing
// build (never a build during the run), the storage state rewritten for this origin. Removed after
// the runs; a copy is kept in docs/prompts/runs/X3/scripts/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

const PORT = 4263;
const origin = `http://localhost:${String(PORT)}`;
const state = JSON.parse(readFileSync('tests/e2e/fixtures/storageState.json', 'utf8')) as { origins: { origin: string }[] };
for (const entry of state.origins) entry.origin = origin;
const dir = join(tmpdir(), 'pianopath-x3');
mkdirSync(dir, { recursive: true });
const statePath = join(dir, 'storageState.json');
writeFileSync(statePath, JSON.stringify(state));

export default defineConfig({
  ...base,
  workers: 1,
  outputDir: join(dir, 'test-results'),
  use: { ...base.use, baseURL: `${origin}/PianoProject/`, storageState: statePath },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort`,
    url: `${origin}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
