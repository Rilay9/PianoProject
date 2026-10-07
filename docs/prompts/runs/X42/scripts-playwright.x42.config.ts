// X42's copy of app/playwright.config.ts (not for the commit): port 4642, serve only (the app is built once before
// a run into app/build/x42/dist, never rebuilt under a run), testDir, output and storage state by absolute path.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = '<worktree>';
const PORT = 4642;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  testDir: `${W}/app/tests/e2e`,
  outputDir: `${W}/app/test-results`,
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    storageState: `${W}/app/build/x42/storageState-4642.json`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir "${process.env.X42_DIST ?? `${W}/app/build/x42/dist`}"`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
