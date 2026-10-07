// U118b's local copy of playwright.states.config.ts: port 5343 (never 4173 or 4183), one worker, its own
// output folder, and a server that only previews the dist built before the run. Not for the commit.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');

export default defineConfig({
  testDir: path.join(app, 'tests/states'),
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  timeout: 180_000,
  outputDir: path.join(here, 'test-results-states'),
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: { ...chromiumExecutable },
    baseURL: 'http://localhost:5343/PianoProject/',
    deviceScaleFactor: 3,
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: 'npx vite preview --port 5343 --strictPort',
    cwd: app,
    url: 'http://localhost:5343/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
