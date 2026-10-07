import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

// X46's re-walk config (a copy of the 2026-10-02 walk's): port 5433, one worker, the e2e config's Chromium
// flags, no stored state (the walk starts from nothing and skips the tour itself). Lives in app/build/x46/.
export default defineConfig({
  testDir: '.',
  testMatch: /walk-x46\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results-walk',
  timeout: 900_000,
  use: {
    ...devices['Desktop Chrome'],
    hasTouch: true,
    deviceScaleFactor: 1,
    launchOptions: {
      ...chromiumExecutable,
      args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
    },
    baseURL: 'http://localhost:5433/PianoProject/',
    trace: 'off',
    actionTimeout: 15_000,
  },
  webServer: {
    command: 'npx vite preview --port 5433 --strictPort',
    cwd: '../..',
    url: 'http://localhost:5433/PianoProject/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
