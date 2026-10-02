// U122b's local copy of playwright.config.ts: port 5443 (never 4173), its own storage state (the
// fixture's origin rewritten to 5443) by an absolute path, its own output folder, and a server that
// only previews the dist built before the run. Not for the commit; kept under the worktree's ignored
// app/build/ and deleted at the end (a copy is kept in docs/prompts/runs/U122b/).
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
const testDir = process.env.U122B_TESTDIR ? path.resolve(app, process.env.U122B_TESTDIR) : path.join(here, 'probe');

export default defineConfig({
  testDir,
  fullyParallel: true,
  retries: 0,
  workers: Number(process.env.U122B_WORKERS ?? 4),
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
    baseURL: 'http://localhost:5443/PianoProject/',
    trace: 'off',
    storageState: path.join(here, 'storageState.5443.json'),
  },
  webServer: {
    command: 'npx vite preview --port 5443 --strictPort',
    cwd: app,
    url: 'http://localhost:5443/PianoProject/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
