// U113's copy of app/playwright.config.ts (not for the suite; run from app/build/u113/): port 4532,
// serve only (the app is built once before a run into a folder under build/u113/, never rebuilt
// under a run), testDir, output and storage state by absolute path. `U113_SPECS=1` runs the repo's
// own e2e specs named on the command line instead of the probe; `U113_DIST` names the build served.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = process.env.U113_WORKTREE ?? '<worktree>';
const PORT = 4532;
const ORIGIN = `http://localhost:${String(PORT)}`;
const SPECS = process.env.U113_SPECS === '1';
const DIST = process.env.U113_DIST ?? `${W}/build/u113/dist`;

export default defineConfig({
  ...base,
  testDir: SPECS ? `${W}/app/tests/e2e` : `${W}/app/build/u113`,
  ...(SPECS ? {} : { testMatch: /u113-probe\.spec\.ts$/ }),
  outputDir: `${W}/app/test-results`,
  workers: Number(process.env.U113_WORKERS ?? '2'),
  retries: 0,
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    storageState: `${W}/app/build/u113/storageState-4532.json`,
    trace: 'off',
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir "${DIST}"`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
