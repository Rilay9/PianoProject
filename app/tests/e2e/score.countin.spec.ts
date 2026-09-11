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
  test('counts the bar over the notation, then gets out of the way', async ({ page }) => {
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

  test('it covers the notation but never the controls', async ({ page }) => {
    // Covering the notation is the whole of what it does. The bar is the
    // exception: during a count-in it stays usable, because stopping a run
    // that has begun counting is exactly what someone reaches for — and a
    // control that is usable but has a numeral drawn across it is not usable
    // in any way that matters. The stage is extended under the bar during a
    // run to win the height, so the count-in has to keep off it deliberately.
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
        const bar = document.querySelector('#score-bar');
        if (!bar || (bar as HTMLElement).hidden) return null;
        const barBox = bar.getBoundingClientRect();
        for (const beat of document.querySelectorAll('#score-countin .score-countin__beat')) {
          const b = beat.getBoundingClientRect();
          if (b.height <= 0) continue;
          if (b.bottom > barBox.top + 1 && b.top < barBox.bottom - 1) {
            return `a beat reaches ${String(Math.round(b.bottom))} and the bar starts at ${String(Math.round(barBox.top))}`;
          }
        }
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
