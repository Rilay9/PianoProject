import { defineConfig, devices } from '@playwright/test';
import { chromiumExecutable } from './tests/e2e/fixtures/chromium';

/**
 * The state gallery: one picture per cell of `docs/08-score-render-states.md`.
 *
 * Not the tour, and deliberately not. The tour walks a *journey* — open this,
 * play that, photograph what it finds — so what it covers is whatever the walk
 * happens to touch, and a state nobody walks through is a state nobody sees.
 * This enumerates the **state space** from the spec's §2 and drives the screen
 * into each cell on purpose, then photographs it *and* measures it.
 *
 * The measurements matter as much as the pictures: every shot writes a record
 * of what the spec cares about — the arrangement, the drawn scale, both slots'
 * ranges, which bands exist and where, the bar's height, the keys view — so
 * the invariants in `08` §9 can be checked as numbers rather than by eye. The
 * eye is for whether it *looks* right; the numbers are for whether it *is*.
 *
 * Its own port and its own output directory, so it can run while another suite
 * is running — which is the point of it. **It serves, it does not build.** Two
 * Playwright configs both running `npm run build:app` write the same `dist`
 * at the same time, and the second one reads a chunk the first has just
 * replaced: the run dies with an `ENOENT` on a file that existed a moment ago.
 * The port was never the collision; the build directory was.
 *
 * So: build once, then run this as often as you like, alongside anything.
 *
 *   npm run states                    # builds, then shoots every cell
 *   npm run states:only               # shoots against whatever is in dist/
 *   npm run states:only -- --grep bar # one branch while iterating
 *
 * Output: build/states/, with index.html and states.json.
 */
export default defineConfig({
  testDir: './tests/states',
  // One at a time: the pictures are the point and a loaded machine makes them
  // race the renderer.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  timeout: 180_000,
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: { ...chromiumExecutable },
    baseURL: 'http://localhost:4183/PianoProject/',
    // The S25's pixel ratio, so a shot is the size he will see.
    deviceScaleFactor: 3,
    // His phone is dark; light is shot deliberately where it is the subject.
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    // Serve only — see above.
    command: 'npm run preview:states',
    url: 'http://localhost:4183/PianoProject/',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
