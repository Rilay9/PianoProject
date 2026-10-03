import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

// A config copy for the rolling H2 walk (2026-10-02): its own port, one worker,
// the same Chromium flags as the e2e config. Not committed (app/build is ignored).
export default defineConfig({
  testDir: '.',
  testMatch: /walk.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results',
  timeout: 900_000,
  use: {
    ...devices['Desktop Chrome'],
    hasTouch: true,
    deviceScaleFactor: 1,
    launchOptions: {
      ...chromiumExecutable,
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
    baseURL: 'http://localhost:5393/PianoProject/',
    trace: 'off',
    actionTimeout: 15_000,
  },
  webServer: {
    command: 'npx vite preview --port 5393 --strictPort',
    cwd: '../..',
    url: 'http://localhost:5393/PianoProject/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
