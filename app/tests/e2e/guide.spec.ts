/**
 * The guide (docs/04 §7e): reachable from Settings, every section with its
 * picture shipped, and every "open" button landing on the screen it names.
 *
 * The order is asserted in full, not just its first title, because the order
 * *is* the guide: connecting the piano comes second because nothing the app
 * does works until it can hear you, and the five sections about your own
 * music are one run rather than a scatter. A reshuffle that reads fine on
 * screen would otherwise pass silently.
 */
import { expect, test } from '@playwright/test';

/** The eleven sections, in the order a person needs them. */
const TITLES = [
  'What it does',
  'Connecting the piano',
  'The score screen',
  'Lessons, drills and skills',
  'Finding pieces to add',
  'Adding your own scores',
  'A whole folder of scores',
  'PDF sheet music',
  'The books you own',
  'Progress and backups',
  'Offline, updates and diagnostics',
];

test.describe('the guide', () => {
  test('opens from Settings, with every section and every picture', async ({ page }) => {
    await page.goto('/#/settings');
    await page.locator('#open-guide').click();
    const guide = page.locator('[data-screen="guide"]');
    await expect(guide).toBeVisible({ timeout: 60_000 });
    await expect(guide.locator('.guide-section')).toHaveCount(TITLES.length);

    // Every picture the guide names is a file the build ships: a missing one
    // would be a broken box on the phone, and this is the only place it shows.
    const sources = await guide.locator('.guide-figure img').evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
    expect(sources.length).toBeGreaterThanOrEqual(TITLES.length);
    for (const src of sources) {
      const response = await page.request.get(src);
      expect(response.status(), `${src} is missing`).toBe(200);
      expect(Number(response.headers()['content-length'] ?? '1'), `${src} is empty`).toBeGreaterThan(1000);
    }
  });

  test('the section buttons open the screens they describe', async ({ page }) => {
    await page.goto('/#/settings/guide');
    await expect(page.locator('[data-screen="guide"]')).toBeVisible({ timeout: 60_000 });
    await page.locator('#guide-open-folder-browse-a-score-folder').click();
    await expect(page.locator('[data-screen="folder"]')).toBeVisible();
    await page.goto('/#/settings/guide');
    await page.locator('#guide-open-piano-run-the-setup-tour').click();
    await expect(page.locator('[data-screen="setup"]')).toBeVisible({ timeout: 60_000 });
  });

  test('the contents jump within the page and the sections read in order', async ({ page }) => {
    await page.goto('/#/settings/guide');
    await expect(page.locator('[data-screen="guide"]')).toBeVisible({ timeout: 60_000 });
    expect(await page.locator('.guide-section h2').allTextContents()).toEqual(TITLES);
    // One contents line per section, in the same order.
    expect(await page.locator('.guide-contents__link').allTextContents()).toEqual(TITLES);
    await page.locator('.guide-contents__link', { hasText: 'PDF sheet music' }).click();
    expect(new URL(page.url()).hash).toBe('#/settings/guide');
  });

  test('the procedures are steps and the modes are labelled, not prose', async ({ page }) => {
    await page.goto('/#/settings/guide');
    await expect(page.locator('[data-screen="guide"]')).toBeVisible({ timeout: 60_000 });

    // Getting the archive onto the phone is the thing that had to be asked
    // about twice. It is a numbered list, and the step that decides whether
    // it works — which of the two same-named folders to pick — is in it.
    const steps = page.locator('[data-guide="folder"] ol.guide-steps li');
    expect(await steps.count()).toBeGreaterThanOrEqual(5);
    await expect(steps.filter({ hasText: 'library.json' })).not.toHaveCount(0);

    // The four score modes, one term apiece rather than one paragraph.
    const modes = page.locator('[data-guide="score"] dl.guide-terms dt');
    expect(await modes.allTextContents()).toEqual(['Wait for me', 'Keep tempo', 'Play it to me', 'Free play']);
    // A term is a term at a glance, without a stylesheet rule.
    await expect(page.locator('[data-guide="score"] dl.guide-terms dt strong').first()).toBeVisible();

    // The three ways the app can hear you, in the section you reach first.
    const inputs = page.locator('[data-guide="piano"] dl.guide-terms dt');
    expect(await inputs.allTextContents()).toEqual(['A USB cable', 'The on-screen keys', 'The microphone']);
  });
});
