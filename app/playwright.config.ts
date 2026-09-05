import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Prefer the Chromium already installed in this sandbox/CI image at
// /opt/pw-browsers (see docs/01-architecture.md §10) so tests don't need a
// fresh ~300MB browser download; fall back to Playwright's own managed
// install (via `npx playwright install chromium`) when that path is absent,
// which is what CI does explicitly in .github/workflows/ci.yml.
const bundledChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const hasBundledChromium = existsSync(bundledChromium);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    ...(hasBundledChromium ? { launchOptions: { executablePath: bundledChromium } } : {}),
    // Matches vite.config.ts's `base` (the app is served under the repo name
    // path, same as it will be on GitHub Pages).
    baseURL: 'http://localhost:4173/PianoProject/',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/PianoProject/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
