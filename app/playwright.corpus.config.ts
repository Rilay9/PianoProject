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
  /*
   * Three at a time, and why that is not obviously safe.
   *
   * At one worker the corpus is 92 legs of about 27 s, run strictly in
   * sequence: **41 minutes**, and it is run several times a day. The legs are
   * independent pieces, so wall-clock is pure waiting.
   *
   * The caution behind `workers: 1` was real, though. This suite measures
   * timing-sensitive things — the scale a run settles on, whether the stave
   * holds still, where the cursor sits while the sheet slides — and those are
   * the measurements that go wrong when browsers compete for a machine. On
   * 2026-09-10 two corpus runs overlapped by accident and produced eighteen
   * failures that were not real, all `ERR_CONNECTION_REFUSED` and destroyed
   * execution contexts.
   *
   * Three is chosen to stay well inside a normal machine rather than to use it
   * up, and `fullyParallel` has to come with it: the whole corpus is one file,
   * so without it the workers have nothing to share out.
   *
   * **Not yet validated.** The thing to check is not whether it passes — it is
   * whether the *numbers* agree: run it twice at this setting and compare the
   * scales each leg settles on against a known-good single-worker run. A
   * collision shows up as connection errors rather than plausible readings, so
   * a green run with different scales is the signal to put this back to 1.
   */
  workers: 3,
  fullyParallel: true,
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
