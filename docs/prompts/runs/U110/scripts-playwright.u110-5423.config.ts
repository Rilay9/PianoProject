// U110's copy of app/playwright.config.ts, for this worktree only (never committed): port 5423
// instead of 4173, the base URL and preview on that port, an absolute storage state carrying that
// origin, its own output folder, and a preview of the dist already built (no build during a run).
// U110_PROBES=1 runs this folder's probe specs instead of tests/e2e.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '../..');
const probes = process.env.U110_PROBES === '1';

export default defineConfig({
  testDir: probes ? here : resolve(app, 'tests/e2e'),
  testMatch: probes ? /u110.*\.spec\.ts$/ : undefined,
  outputDir: resolve(here, 'test-results'),
  fullyParallel: !probes,
  retries: 0,
  workers: probes ? 1 : 4,
  reporter: 'list',
  timeout: probes ? 600_000 : undefined,
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      ...chromiumExecutable,
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
    baseURL: 'http://localhost:5423/PianoProject/',
    trace: 'retain-on-failure',
    storageState: resolve(here, 'storageState.5423.json'),
  },
  webServer: {
    command: 'npx vite preview --port 5423 --strictPort',
    cwd: app,
    url: 'http://localhost:5423/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
