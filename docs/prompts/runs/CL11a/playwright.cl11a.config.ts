// A copy of ../../playwright.config.ts for lane CL11a: port 5513, the storage state's origin rewritten to it,
// the state named by an absolute path (a config kept outside `app/` resolves it against the working
// directory), one worker from the command line, and the preview served here and stopped with the run.
// Not for the commit (it lives under the gitignored `build/`).
import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromiumExecutable } from '../../tests/e2e/fixtures/chromium';

const PORT = 5513;
const HERE = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: resolve(HERE, '../../tests/e2e'),
  outputDir: resolve(HERE, 'test-results'),
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
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
    baseURL: `http://localhost:${String(PORT)}/PianoProject/`,
    trace: 'off',
    storageState: resolve(HERE, 'storageState.json'),
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort`,
    cwd: resolve(HERE, '../..'),
    url: `http://localhost:${String(PORT)}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
