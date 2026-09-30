// X42's copy of app/playwright.states.config.ts (not for the commit): port 4643 instead of the shared 4183, never
// reusing a server another checkout may have left on a port, serving the one build in app/build/x42/dist.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.states.config';

const W = '<worktree>';
const PORT = 4643;
const ORIGIN = `http://localhost:${String(PORT)}`;

export default defineConfig({
  ...base,
  testDir: `${W}/app/tests/states`,
  outputDir: `${W}/app/test-results`,
  use: {
    ...base.use,
    baseURL: `${ORIGIN}/PianoProject/`,
  },
  webServer: {
    command: `npx vite preview --port ${String(PORT)} --strictPort --outDir "${process.env.X42_DIST ?? `${W}/app/build/x42/dist`}"`,
    cwd: `${W}/app`,
    url: `${ORIGIN}/PianoProject/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
