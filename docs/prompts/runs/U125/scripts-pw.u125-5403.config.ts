// U125's config copy: app/playwright.config.ts on this lane's port (5403),
// serving the dist named by U125_DIST so each variant is the same test run
// against its own build. Run from app/.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const app = process.cwd();
const dist = path.resolve(app, process.env.U125_DIST ?? 'dist');

export default defineConfig({
  testDir: app,
  testMatch: ['tests/e2e/**/*.spec.ts', 'build/u125/specs/**/*.spec.ts'],
  // The 53147902 tree extracted under build/u125/base carries its own tests.
  testIgnore: ['**/build/u125/base/**'],
  outputDir: path.join(app, 'build/u125/test-results'),
  fullyParallel: true,
  retries: 0,
  // Throttled 16x, opening /dev/score outlasts the default 5 s expect and 30 s
  // test timeouts. Only the setup polls (openDevScore's toHaveText and
  // waitForFunction); the U66 case's own assertions read values once and do
  // not retry, so these change nothing it judges.
  timeout: 180_000,
  expect: { timeout: 60_000 },
  workers: Number(process.env.U125_WORKERS ?? 4),
  reporter: [['list'], ['json', { outputFile: path.join(app, 'build/u125/last-run.json') }]],
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
    baseURL: 'http://localhost:5403/PianoProject/',
    trace: 'off',
    // The fixture's origin rewritten to this port: localStorage is per origin,
    // and on 5403 the 4173 state (tour skipped, first-sight cards seen) is not read.
    storageState: path.join(app, 'build/u125/storageState.5403.json'),
  },
  webServer: {
    command: `npx vite preview --port 5403 --strictPort --outDir "${dist}"`,
    cwd: app,
    url: 'http://localhost:5403/PianoProject/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
