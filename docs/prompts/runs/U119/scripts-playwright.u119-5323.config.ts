// U119's local copy of playwright.config.ts: port 5323 (never 4173), four
// workers, its own storage state (the fixture's origin rewritten to 5323) by an
// absolute path, its own output folder, and a server that only previews the dist
// built before the run (no rebuild under a running suite, no reuse of another
// builder's server). Not for the commit; kept under the worktree's ignored
// app/build/.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
const testDir = process.env.U119_TESTDIR ? path.resolve(app, process.env.U119_TESTDIR) : path.join(app, 'tests/e2e');

export default defineConfig({
  testDir,
  fullyParallel: true,
  retries: 0,
  workers: 4,
  reporter: 'list',
  outputDir: path.join(here, 'test-results'),
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
    baseURL: 'http://localhost:5323/PianoProject/',
    trace: 'off',
    storageState: path.join(here, 'storageState.5323.json'),
  },
  webServer: {
    command: 'npx vite preview --port 5323 --strictPort',
    cwd: app,
    url: 'http://localhost:5323/PianoProject/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
