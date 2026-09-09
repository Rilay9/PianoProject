import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from './tests/e2e/fixtures/chromium';

/**
 * The corpus: whole songs on every form factor (`tests/tour/corpus.spec.ts`).
 *
 * The tour's config with the pictures at 1× — they are read as contact sheets
 * (`tools/contact_sheet.py`), where a fault survives the scaling and a page of
 * twelve is one picture to open. Output: build/corpus/.
 */
export default defineConfig({
  testDir: './tests/tour',
  // One at a time: the screenshots are the point, and a loaded machine makes
  // them race the renderer.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  timeout: 180_000,
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: { ...chromiumExecutable },
    baseURL: 'http://localhost:4173/PianoProject/',
    // The S25's own pixel ratio, so the shots are the size he will see.
    deviceScaleFactor: 1,
    // His phone is dark, so the tour is dark. Shooting the light theme was
    // reviewing an app nobody uses.
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/152.0.0.0 Mobile Safari/537.36',
  },
  webServer: {
    command: 'npm run build:app && npm run preview',
    url: 'http://localhost:4173/PianoProject/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
