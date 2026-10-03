// CL04's copy of app/playwright.config.ts, for this worktree only (never committed):
// port 5073 instead of 4173, the base URL and preview on that port, an absolute
// storage state (a copy outside app/ resolves it against the working directory),
// its own output folder, and a preview of the dist already built (no build during a run).
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '../..');

export default defineConfig({
  testDir: resolve(app, 'tests/e2e'),
  outputDir: resolve(here, 'test-results'),
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: 'list',
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
    baseURL: 'http://localhost:5073/PianoProject/',
    trace: 'retain-on-failure',
    storageState: resolve(here, 'storageState.5073.json'),
  },
  webServer: {
    command: 'npx vite preview --port 5073 --strictPort',
    cwd: app,
    url: 'http://localhost:5073/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
