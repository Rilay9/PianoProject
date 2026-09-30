// U105a's local copy of playwright.config.ts: port 4793 (never 4173), two
// workers, its own storage state (the fixture's origin names port 4173,
// rewritten to 4793) by an absolute path, its own output folder, and a server
// that only previews the dist built before the run (no rebuild under a running
// suite, no reuse of another builder's server). Not for the commit; kept under
// the worktree's gitignored app/build/.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
const testDir = process.env.U105A_TESTDIR ? path.resolve(app, process.env.U105A_TESTDIR) : path.join(app, 'tests/e2e');

export default defineConfig({
  testDir,
  fullyParallel: true,
  retries: 0,
  workers: 2,
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
    baseURL: 'http://localhost:4793/PianoProject/',
    trace: 'off',
    storageState: path.join(here, 'storageState.4793.json'),
  },
  webServer: {
    command: 'npx vite preview --port 4793 --strictPort',
    cwd: app,
    url: 'http://localhost:4793/PianoProject/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
