// PH2's own browser runs: the app's config on port 4396, two workers, its own output folder. Run from app/:
//   npx playwright test --config build/ph2/playwright.ph2.config.ts <spec>
// after `npm run build:app` (no rebuild while it runs).
import { defineConfig } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import base from '../../playwright.config';

const PORT = Number(process.env.PH2_PORT ?? 4396);
// The shared storage state is keyed to origin localhost:4173; on another port it would seed nothing (no skipped
// tour, no seen first-sight cards). A copy keyed to this port.
const STATE = `${process.cwd()}/build/ph2/storageState.${String(PORT)}.json`;
writeFileSync(
  STATE,
  readFileSync(`${process.cwd()}/tests/e2e/fixtures/storageState.json`, 'utf8').replaceAll('http://localhost:4173', `http://localhost:${String(PORT)}`),
);

export default defineConfig({
  ...base,
  testDir: process.env.PH2_TESTDIR ?? '../../tests/e2e',
  outputDir: './test-results',
  workers: 2,
  retries: 0,
  use: {
    ...base.use,
    baseURL: `http://localhost:${String(PORT)}/PianoProject/`,
    // Run from app/: the base config's relative path, made absolute so the copy's folder does not move it.
    storageState: STATE,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort`,
    cwd: '../..',
    url: `http://localhost:${String(PORT)}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
