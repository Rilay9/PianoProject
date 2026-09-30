// U63's local copy of playwright.config.ts: port 4673, two workers, its own storage state (the
// fixture's origin names port 4173, so it is re-keyed to 4673 and named by an absolute path), its own
// output folder. U63_DIST names a prebuilt folder to preview (the committed build, for the red runs
// and the before pictures); without it the app is built first and then previewed. U63_TESTDIR points
// the run at the lane's probes. Not for the commit; kept under the worktree's app/build/.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
const testDir = process.env.U63_TESTDIR ? path.resolve(app, process.env.U63_TESTDIR) : path.join(app, 'tests/e2e');
const dist = process.env.U63_DIST ? path.resolve(app, process.env.U63_DIST) : undefined;
const serve = dist
  ? `npx vite preview --port 4673 --strictPort --outDir "${dist}"`
  : 'npm run build:app && npx vite preview --port 4673 --strictPort';

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
    baseURL: 'http://localhost:4673/PianoProject/',
    trace: 'off',
    storageState: path.join(here, 'storageState-4673.json'),
  },
  webServer: {
    command: serve,
    cwd: app,
    url: 'http://localhost:4673/PianoProject/',
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
