// Kept copy (machine path replaced) of the temporary app/build/e59/playwright.screen.config.ts, deleted at the lane's cleanup.
// E59's look at the Score screen: two preview servers, the new files (4659) and the old (4660); serve only.
import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

const W = '<worktree>';

export default defineConfig({
  ...base,
  testDir: `${W}/app/build/e59`,
  testMatch: 'screen.e59.spec.ts',
  outputDir: `${W}/app/test-results`,
  workers: 1,
  use: { ...base.use, storageState: `${W}/app/build/e59/storageState-two.json` },
  webServer: [
    {
      command: `npx vite preview --port 4659 --strictPort --outDir "${W}/app/dist"`,
      cwd: `${W}/app`,
      url: 'http://localhost:4659/PianoProject/',
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `npx vite preview --port 4660 --strictPort --outDir "${W}/build/e59/dist-b"`,
      cwd: `${W}/app`,
      url: 'http://localhost:4660/PianoProject/',
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
