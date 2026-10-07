// U110b's copy of app/playwright.config.ts: port 5473 instead of 4173, the base URL and preview
// on that port, an absolute storage state carrying that origin, its own output folder, and a
// preview of the dist already built (no build during a run).
// U110B_PROBES=1 runs this folder's probe specs instead of tests/e2e.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '../..');
const probes = process.env.U110B_PROBES === '1';

export default defineConfig({
  testDir: probes ? here : resolve(app, 'tests/e2e'),
  testMatch: probes ? /u110b.*\.spec\.ts$/ : undefined,
  outputDir: resolve(here, 'test-results'),
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: probes ? 600_000 : undefined,
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
    baseURL: 'http://localhost:5473/PianoProject/',
    trace: 'retain-on-failure',
    storageState: resolve(here, 'storageState.5473.json'),
  },
  webServer: {
    command: `npx vite preview --port 5473 --strictPort${process.env.U110B_DIST ? ` --outDir ${process.env.U110B_DIST}` : ''}`,
    cwd: app,
    url: 'http://localhost:5473/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
