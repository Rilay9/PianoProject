// U110's copy of app/playwright.states.config.ts, for this worktree only (never committed): the
// state gallery on port 5423 instead of 4183, serving the dist already built.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '../..');

export default defineConfig({
  testDir: resolve(app, 'tests/states'),
  outputDir: resolve(here, 'test-results-states'),
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  timeout: 180_000,
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: { ...chromiumExecutable },
    baseURL: 'http://localhost:5423/PianoProject/',
    deviceScaleFactor: 3,
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: 'npx vite preview --port 5423 --strictPort',
    cwd: app,
    url: 'http://localhost:5423/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
