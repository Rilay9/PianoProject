/**
 * You can see the beat (P21c §A6).
 *
 * The count-in was clicks only. On a phone on a music stand with the sound
 * low, the first note of a piece therefore arrives unannounced — the one
 * moment a beginner most needs to know when to start. And during the run
 * there was no way to check the tempo except by hearing the click.
 */
import { expect, test, type Page } from '@playwright/test';

const ITEM = 'song.folk.hot-cross-buns';

async function openScore(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
    'data-mode',
    /wait|tempo/,
    { timeout: 60_000 },
  );
  await expect(page.locator('#score-bar')).toHaveAttribute('data-visible', 'true');
}

test.describe('the count-in you can see', () => {
  test('counts the bar beside ⏸, then gets out of the way', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();

    const countIn = page.locator('#score-countin');
    await expect(countIn).toBeVisible({ timeout: 30_000 });
    // One number per beat of the piece's own bar, and exactly one of them lit.
    const beats = page.locator('#score-countin .score-countin__beat');
    expect(await beats.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('#score-countin .is-now')).toHaveCount(1);

    // It is a count-in, so it ends when the music starts.
    await expect(countIn).toBeHidden({ timeout: 30_000 });
  });

  // Replaced by U122c (class: replace). It held that the count covers the notation, "the whole of what
  // it does", and keeps off the bar. Its numerals sat on the very notes the learner reads to come in
  // (walk finding 8). Now it is beside ⏸ in the row the folded controls leave: off the notation, off
  // ⏸, whole in the window, the current beat distinct. Every cell and moment is in
  // `score.task-chrome.spec.ts`; this keeps the count's own three shapes.
  test('it stays off the notation and off ⏸', async ({ page }) => {
    for (const size of [
      { width: 342, height: 740 },
      { width: 740, height: 342 },
      { width: 360, height: 780 },
    ]) {
      await page.setViewportSize(size);
      await openScore(page);
      await page.locator('#score-mode').selectOption('tempo');
      await page.locator('#score-play').click();
      await expect(page.locator('#score-countin')).toBeVisible({ timeout: 30_000 });

      const clash = await page.evaluate(() => {
        const overlaps = (a: DOMRect, b: DOMRect): boolean =>
          a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
        const play = document.querySelector('#score-play')!.getBoundingClientRect();
        const stage = document.querySelector('#score-stage')!.getBoundingClientRect();
        const ink = [...document.querySelectorAll('#score-stage .score-buffer.is-front svg path, #score-stage .score-buffer.is-front svg text')]
          .map((el) => el.getBoundingClientRect())
          .filter((b) => b.width + b.height > 0 && overlaps(b, stage));
        const beats = [...document.querySelectorAll('#score-countin .score-countin__beat')].map((el) => el.getBoundingClientRect());
        if (beats.length < 2) return `${String(beats.length)} numerals`;
        for (const b of beats) {
          if (b.left < 0 || b.right > window.innerWidth || b.top < 0 || b.bottom > window.innerHeight) return 'a numeral outside the window';
          if (overlaps(b, play)) return 'a numeral over ⏸';
          if (ink.some((i) => overlaps(b, i))) return 'a numeral over the notation';
        }
        if (ink.length === 0) return 'no notation measured';
        return null;
      });
      expect(clash, `${String(size.width)}x${String(size.height)}: ${clash ?? ''}`).toBeNull();
    }
  });

  test('the beat dot pulses in Tempo and stays away in Wait', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('tempo');
    await page.locator('#score-play').click();
    await expect(page.locator('#score-beat')).toBeVisible({ timeout: 30_000 });
  });

  test('Wait mode shows no beat dot: there is no clock to show', async ({ page }) => {
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-play').click();
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-running',
      'true',
    );
    await page.waitForTimeout(2_000);
    await expect(page.locator('#score-beat')).toBeHidden();
  });
});
