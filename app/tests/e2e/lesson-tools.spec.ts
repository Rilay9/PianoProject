/**
 * A rung's tools are controls, and they open the thing they name (`04` §3d).
 *
 * Sixty lessons carry a "Tools for this rung" paragraph and a paragraph cannot
 * be tapped: `chords-pop.3` tells the learner to pick D and take I–IV–V–I in
 * the accompaniment lab, which is now one preset chip the lesson had no way to
 * open. What has to be true is not that a button exists — it is that pressing
 * it lands somewhere specific, because a control that goes to the wrong screen
 * is worse than the paragraph it replaced.
 *
 * And the negative case matters as much: a rung that names no tool must draw no
 * block at all. An empty heading reading "Ways to play this" is the dead space
 * `00-invariants` §1 and `04` §0 R4 both forbid, and it would sit above the
 * options, which are what the page is for.
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
      // Every explain-it-once card counts as seen, for the same reason the
      // tour counts as skipped: this spec is not about meeting them
      // (`04` §5f, `help-strip.spec.ts` is the one that drives them).
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

test('the lab tool opens the lab already in the rung’s preset', async ({ page }) => {
  await page.goto('/#/lesson/chords-pop.3');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  await expect(page.locator('#lesson-tools-block')).toBeVisible();

  // The button carries the preset it claims it will open, so the assertion is
  // "the control goes where it says" rather than a preset id copied in here.
  // The copy failed the day `chords-pop.3` was repointed from the four-chord
  // preset to the one that plays the progression it actually teaches, which
  // reported a correct change as a broken test.
  const tool = page.locator('#lesson-tool-lab');
  const declared = await tool.getAttribute('data-preset');
  expect(declared, 'the lab tool names no preset, so this test proves nothing').toBeTruthy();

  await tool.click();
  await expect(page).toHaveURL(new RegExp(`preset=${declared ?? ''}`));
  await expect(page.locator('section[data-screen="lab"]')).toBeVisible();
  // Arrived *in* the preset, not merely at the lab.
  await expect(page.locator('#lab-preset')).toHaveAttribute('data-preset', declared ?? '');
  await expect(page.locator('#lab-progression')).toBeDisabled();
});

test('the duet tool opens a piece from the rung with one hand chosen', async ({ page }) => {
  await page.goto('/#/lesson/blues.4');
  await expect(page.locator('#lesson-tools-block')).toBeVisible();

  // The rung names no `item`, so the button takes its first playable song —
  // whichever that is, it must be one the rung actually offers.
  const offered = await page.locator('#lesson-songs .list-row[data-item]').evaluateAll((rows) =>
    rows.map((row) => row.getAttribute('data-item')),
  );
  expect(offered.length, 'blues.4 offers no songs, so this test proves nothing').toBeGreaterThan(0);

  await page.locator('#lesson-tool-duet').click();
  await expect(page.locator('section[data-screen="score"]')).toBeVisible();
  const hash = new URL(page.url()).hash;
  expect(hash).toMatch(/hands=R/);
  expect(
    offered.some((id) => id !== null && hash.includes(encodeURIComponent(id))),
    `the duet opened something the rung does not offer: ${hash}`,
  ).toBe(true);
});

test('a rung that names its Simon opens that one, not the stage’s', async ({ page }) => {
  // blues.3 is a Stage 3 rung, where the stage rule would open the white-key
  // game. It names the Simon seeded from the blues scale, which is one of its
  // own exercises, and the button has to go there.
  await page.goto('/#/lesson/blues.3');
  await expect(page.locator('#lesson-tools-block')).toBeVisible();
  const offered = await page.locator('#lesson-exercises .list-row[data-item]').evaluateAll((rows) =>
    rows.map((row) => row.getAttribute('data-item')),
  );
  expect(offered).toContain('drill.ear.simon-blues-c');
  await page.locator('#lesson-tool-simon').click();
  await expect(page).toHaveURL(/#\/drill\/drill\.ear\.simon-blues-c/);
  await expect(page.locator('section[data-screen="drill"]')).toBeVisible();
});

test('2.5’s check opens the G edition with the notation hidden from the first frame', async ({ page }) => {
  // Wave 1(b): the learner plays the theme a fifth higher from their own working-out, then checks it
  // against the shipped G edition. The check is only a check if the page never shows: the button must
  // land on that edition, blind, and the stage must be hidden from the moment it exists, not after.
  await page.goto('/#/lesson/2.5');
  await expect(page.locator('#lesson-tools-block')).toBeVisible();
  const tool = page.locator('#lesson-tool-blind');
  await expect(tool).toHaveText('Check your G version, page hidden');

  // Watch the stage from before the click: the first time it exists, and the first time ink is in it.
  await page.evaluate(() => {
    const seen: { stageBlindAtBirth?: boolean; inkVisibilityAtBirth?: string } = {};
    (window as unknown as { __blindSeen: typeof seen }).__blindSeen = seen;
    new MutationObserver(() => {
      const stage = document.querySelector('#score-stage');
      if (stage && seen.stageBlindAtBirth === undefined) {
        seen.stageBlindAtBirth = stage.classList.contains('score-stage--blind');
      }
      const svg = stage?.querySelector('svg');
      if (svg && seen.inkVisibilityAtBirth === undefined) {
        seen.inkVisibilityAtBirth = getComputedStyle(svg).visibility;
      }
    }).observe(document.body, { childList: true, subtree: true });
  });

  await tool.click();
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-blind', 'true', { timeout: 60_000 });
  const hash = new URL(page.url()).hash;
  expect(hash).toContain(encodeURIComponent('song.classical.ode-to-joy.g'));
  expect(hash).toMatch(/blind=1/);
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  const seen = await page.evaluate(
    () => (window as unknown as { __blindSeen: { stageBlindAtBirth?: boolean; inkVisibilityAtBirth?: string } }).__blindSeen,
  );
  expect(seen.stageBlindAtBirth, 'the stage existed once without being blind').toBe(true);
  expect(seen.inkVisibilityAtBirth, 'the first ink in the stage was drawn visible').toBe('hidden');
});

test('a rung that names no tool draws no block', async ({ page }) => {
  // 1.1 is the first rung of the core path and names none.
  await page.goto('/#/lesson/1.1');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  await expect(page.locator('#lesson-exercises .list-row').first()).toBeVisible();
  await expect(page.locator('#lesson-tools-block')).toBeHidden();
});
