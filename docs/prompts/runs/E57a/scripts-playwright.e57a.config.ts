// E57a's copy of app/playwright.config.ts (E57's copy, its port and folder changed; not for the commit): port 4671, serve
// only (the app is built once before the run into app/dist by `npm run build:app`, never rebuilt under it), testDir,
// output and storage state by absolute path (the storage state's origin set to this port).
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = '<worktree>';
const PORT = 4671;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  testDir: `${W}/app/tests/e2e`,
  outputDir: `${W}/app/test-results`,
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    storageState: `${W}/app/build/e57a/storageState-4671.json`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir "${W}/app/dist"`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
