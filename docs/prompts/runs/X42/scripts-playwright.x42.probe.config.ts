// X42's product probe config (not for the commit): the e2e config copy's settings on port 4642, the probe folder as
// its tests, and X42_DIST naming which build `vite preview` serves (the committed reader's or the amended one's).
import { defineConfig } from '@playwright/test';
import x42 from './playwright.x42.config';

const W = '<worktree>';
const DIST = process.env.X42_DIST ?? `${W}/app/build/x42/dist`;

export default defineConfig({
  ...x42,
  testDir: `${W}/app/build/x42/probe`,
  workers: 1,
  webServer: {
    command: `npx vite preview --port 4642 --strictPort --outDir "${DIST}"`,
    cwd: `${W}/app`,
    url: 'http://localhost:4642/PianoProject/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
