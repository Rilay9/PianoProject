import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from './tests/e2e/fixtures/chromium';

// Prefer the Chromium already installed in this sandbox/CI image at
// /opt/pw-browsers (see docs/01-architecture.md §10) so tests don't need a
// fresh ~300MB browser download; fall back to Playwright's own managed
// install (via `npx playwright install chromium`) when that path is absent,
// which is what CI does explicitly in .github/workflows/ci.yml.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: { ...chromiumExecutable },
    // Matches vite.config.ts's `base` (the app is served under the repo name
    // path, same as it will be on GitHub Pages).
    baseURL: 'http://localhost:4173/PianoProject/',
    trace: 'retain-on-failure',
  },
  webServer: {
    // `build:app`, not `build`: content is an *input* to these tests, not
    // something they should produce. `npm run build` rebuilds it through
    // `prebuild`, which — now that `--if-missing` is gone (replan §7.9) — meant
    // every e2e run reconverted the whole library, and meant the render check
    // rebuilt the very catalog it had been handed to measure. Build content
    // first with `python3 tools/content/build.py`; CI and render_check.py both
    // already do.
    command: 'npm run build:app && npm run preview',
    url: 'http://localhost:4173/PianoProject/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
