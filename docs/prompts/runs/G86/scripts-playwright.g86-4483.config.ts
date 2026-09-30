// G86's local copy of playwright.config.ts: port 4483, two workers, its own
// storage state (the fixture's origin names port 4173). Not for the commit.
import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from './tests/e2e/fixtures/chromium';

export default defineConfig({
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: 'list',
  outputDir: './build/g86-probe/test-results',
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
    baseURL: 'http://localhost:4483/PianoProject/',
    trace: 'off',
    storageState: 'build/g86-probe/storageState.4483.json',
  },
  projects: [
    { name: 'e2e', testDir: './tests/e2e' },
    { name: 'probe', testDir: './build/g86-probe' },
  ],
  webServer: {
    // The red run builds the committed screen beside the new unit file, which imports a constant
    // that screen does not have, so it skips `tsc -b` (G86_NO_TSC); every other run is `build:app`.
    command: `${process.env.G86_NO_TSC ? 'node scripts/generate-icons.mjs && npx vite build' : 'npm run build:app'} && npx vite preview --port 4483 --strictPort`,
    url: 'http://localhost:4483/PianoProject/',
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
