// E57's copy of app/playwright.config.ts (not for the commit): port 4657, serve only (the app is built once before
// the run into app/dist by `npm run build:app`, never rebuilt under it), testDir, output and storage state by absolute path.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = '<worktree>';
const PORT = 4657;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  testDir: `${W}/app/tests/e2e`,
  outputDir: `${W}/app/test-results`,
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    storageState: `${W}/app/build/E57/storageState-4657.json`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir "${W}/app/dist"`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
