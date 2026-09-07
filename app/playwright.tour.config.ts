import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from './tests/e2e/fixtures/chromium';

/**
 * The UX tour: screenshots of every screen on a Galaxy S25, both ways up.
 *
 * A *tool*, not a test. It asserts almost nothing — it drives the app and
 * photographs it, so that a change to the look of the thing can be reviewed by
 * looking at it. Its own config so that `npm run e2e` and CI never touch it,
 * and so that deleting it later is deleting two files and a script.
 *
 *   npm run tour                     # both orientations, contact sheet
 *   npm run tour -- --grep score     # one screen while iterating
 *
 * Output: build/tour/, with an index.html to flip through.
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
    deviceScaleFactor: 3,
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
