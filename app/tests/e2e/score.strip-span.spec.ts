/**
 * The keyboard shows the whole chord, not the bottom of it.
 *
 * The strip follows the music by scrolling to the note being waited for, and
 * the note it chose was the lowest. For one hand that is the same thing. For
 * two it is not: Chopin's Nocturne Op. 27 No. 1 opens with the left hand an
 * octave apart, and at 342 px the strip centred the lower note and put the
 * upper one just past the right edge — off the screen, with nothing to say it
 * was there. A beginner looking at the keyboard to find out what to press was
 * being shown half of what to press.
 *
 * Found by measuring rather than by looking: the picture shows a keyboard with
 * some keys lit, and a key that is not drawn looks exactly like a key that is
 * not wanted. Two other faults read off the same contact sheets did not survive
 * being measured, which is the reason this one is an assertion.
 *
 * The rule is: if the reach fits on the screen at a playable key size, all of
 * it is on the screen. If it does not, the lowest note anchors the view — a
 * consistent anchor beats a centred view showing the middle of a chord and
 * neither end.
 */
import { expect, test } from '@playwright/test';
import { pressControl } from './scoreControls';

/** The owner's phone. Sideways has width to spare and is not where this bites. */
const PHONE = { width: 342, height: 740 };

const PIECES = [
  // Two hands an octave apart: the case that failed.
  'song.classical.chopin-nocturne-op27-1.nifc',
  // Two hands two octaves apart, which already worked — it must keep working.
  'song.folk.twinkle.ht',
  // One hand, dense: nothing to frame, and it must not start scrolling about.
  'song.classical.chopin-scherzo-2.nifc',
];

for (const piece of PIECES) {
  test(`every key the score is waiting for is on the strip: ${piece}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(PHONE);
    await page.goto(`/#/score/${piece}`);
    // The same opening every other score spec uses. Visible is not ready: the
    // screen has to have chosen a mode and drawn something before `Play` means
    // anything, and under eight workers that is nowhere near instant — this is
    // where the suite flakes, not in the engine.
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-mode',
      /wait|tempo/,
      { timeout: 60_000 },
    );
    await page.waitForFunction(
      () => {
        const svg = document.querySelector('#score-stage .is-front svg');
        return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
      },
      undefined,
      { timeout: 60_000 },
    );
    // Wait mode, so the strip is waiting for a chord rather than counting in.
    await page.locator('#score-mode').selectOption('wait');
    // Through the helper: the bar folds three seconds into a run and a folded
    // bar takes no taps.
    await pressControl(page, '#score-play');
    // Waited on, not slept through. Under eight workers the run takes longer to
    // reach its first step than any fixed pause is worth, and a sleep that is
    // long enough alone is not long enough in the suite — which is what a
    // suite-only failure always means here.
    await page.waitForFunction(
      () => document.querySelectorAll('.keyboard-strip .key.is-expected').length > 0,
      undefined,
      { timeout: 60_000 },
    );
    // And the scroll it triggers is smooth, so it has to land before it is read.
    await page.waitForFunction(
      () => {
        const strip = document.querySelector<HTMLElement>('.keyboard-strip');
        if (!strip) return false;
        const w = window as unknown as { __lastLeft?: number; __still?: number };
        const now = strip.scrollLeft;
        if (w.__lastLeft === now) w.__still = (w.__still ?? 0) + 1;
        else w.__still = 0;
        w.__lastLeft = now;
        return (w.__still ?? 0) > 4;
      },
      undefined,
      { timeout: 30_000, polling: 100 },
    );

    const seen = await page.evaluate(() => {
      const strip = document.querySelector<HTMLElement>('.keyboard-strip');
      if (!strip) return null;
      const keys = [...strip.querySelectorAll<HTMLElement>('.key.is-expected')];
      if (keys.length === 0) return null;
      const left = strip.scrollLeft;
      const right = left + strip.clientWidth;
      // The reach itself, so a genuinely unplayable span can be told from a
      // scroll that simply stopped in the wrong place.
      const lo = Math.min(...keys.map((k) => k.offsetLeft));
      const hi = Math.max(...keys.map((k) => k.offsetLeft + k.offsetWidth));
      return {
        fits: hi - lo <= strip.clientWidth,
        off: keys
          .filter((k) => k.offsetLeft < left || k.offsetLeft + k.offsetWidth > right)
          .map((k) => k.dataset.midi ?? '?'),
      };
    });

    expect(seen, 'nothing was being waited for — the run did not start').not.toBeNull();
    if (seen?.fits === false) test.skip(true, 'the reach is wider than the screen; the anchor rule applies');
    expect(seen?.off ?? [], `keys the score wants, drawn off the screen: ${(seen?.off ?? []).join(', ')}`).toEqual([]);
  });
}
