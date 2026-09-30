// U32a's copy of app/playwright.config.ts (not for the commit): port 4531, serve only (the app is
// built once before a run into a folder under build/u32a/, never rebuilt under a run), testDir and
// storage state by absolute path, U32A_DIST naming the folder `vite preview` serves.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = 'C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ac01cdc63c9797105';
const PORT = 4531;
const ORIGIN = `http://localhost:${String(PORT)}`;
const DIST = process.env.U32A_DIST ?? `${W}/build/u32a/dist-final`;

export default defineConfig({
  ...base,
  testDir: `${W}/app/tests/e2e`,
  outputDir: `${W}/app/test-results`,
  workers: Number(process.env.U32A_WORKERS ?? '2'),
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
    storageState: `${W}/build/u32a/storageState-4531.json`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir "${DIST}"`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
