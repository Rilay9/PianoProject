// U32's copy of app/playwright.config.ts, as it was kept at app/build/u32/ for the lane's runs (deleted
// at the end with the build folders it served): port 4473, serve only (the app is built once before a
// run, never under it), testDir and storage state by absolute path, and U32_DIST naming the build
// folder under app/ that `vite preview` serves. The gallery's and the corpus's copies were the same
// shape over playwright.states.config.ts (testDir tests/states) and playwright.corpus.config.ts
// (testDir tests/tour, two workers). Not for the commit.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = 'C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3';
const PORT = 4473;
const ORIGIN = `http://localhost:${String(PORT)}`;
/** Which build to serve: `dist` unless U32_DIST names another folder under app/. */
const DIST = process.env.U32_DIST ?? 'dist';

export default defineConfig({
  ...base,
  testDir: `${W}/app/tests/e2e`,
  outputDir: `${W}/app/test-results`,
  workers: 2,
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    storageState: `${W}/build/u32/storageState-4473.json`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir ${DIST}`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
