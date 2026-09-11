/**
 * A control in the `⋯` sheet has to stay in one piece.
 *
 * The gallery cell `sheet--more-upright` shows what happens when it does not.
 * `Bars in window` is a stepper — minus, the value, plus — and on a 342 px
 * phone the three of them each took a line of their own: the `−` at the top,
 * `2 bars` under it, the `+` under that. The two halves of one control ended up
 * a finger's length apart with the number they change sitting between them, and
 * the row grew to nearly three times the height of its neighbours, which is
 * what pushed `Layout` off the bottom fold of the sheet.
 *
 * The cause is `flex-wrap: wrap` on the control holder against a words column
 * that would not give up any width. Flexbox wraps before it shrinks (`08`
 * §9.23), so the holder kept its content width, ran out of room and broke — the
 * same fault as the control bar's second row and the folder's saved notice.
 *
 * So: no control holder may occupy more than one line. It is asserted at every
 * width the gallery shoots and again at 115 % text, because the thing that
 * decides this is how wide a word is, and the CI runner's fonts are not the
 * owner's. A row measured only at one font size is a row measured by luck.
 */
import { expect, test } from '@playwright/test';
import { openScoreMenu } from './scoreControls';

const WIDTHS = [280, 320, 342, 360, 412, 740];
const SONG = 'song.folk.hot-cross-buns';

/** Which rows broke into more than one line, and into how many. */
async function wrappedRows(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const rows = [...document.querySelectorAll<HTMLElement>('#score-more-sheet .score-menu-row')];
    for (const row of rows) {
      if (row.hidden || row.offsetParent === null) continue;
      const holder = row.querySelector<HTMLElement>('.score-menu-row__control');
      if (!holder) continue;
      const kids = [...holder.children].filter(
        (kid): kid is HTMLElement => kid instanceof HTMLElement && kid.offsetParent !== null,
      );
      if (kids.length < 2) continue;
      // Not "different top edges" — the holder centres its children, so a
      // plain text label sits a couple of pixels below a taller button while
      // plainly on the same line. A line break is when two of them do not
      // overlap vertically at all.
      const boxes = kids
        .map((kid) => kid.getBoundingClientRect())
        .sort((a, b) => a.top - b.top);
      let lines = 1;
      for (let i = 1; i < boxes.length; i += 1) {
        const above = boxes[i - 1];
        const here = boxes[i];
        if (above && here && here.top >= above.bottom - 1) lines += 1;
      }
      if (lines > 1) {
        const label = row.querySelector('.score-menu-row__label')?.textContent ?? '?';
        out.push(`${label}: ${String(kids.length)} controls on ${String(lines)} lines`);
      }
    }
    return out;
  });
}

/** Anything sticking out past the sheet's own box, which nowrap can cause. */
async function overflowing(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const body = document.querySelector<HTMLElement>('#score-more-sheet .sheet__body');
    if (!body) return ['the sheet has no body'];
    const box = body.getBoundingClientRect();
    for (const row of document.querySelectorAll<HTMLElement>('#score-more-sheet .score-menu-row')) {
      if (row.hidden || row.offsetParent === null) continue;
      for (const kid of row.querySelectorAll<HTMLElement>('button, select, span')) {
        const b = kid.getBoundingClientRect();
        if (b.width <= 0) continue;
        if (b.right > box.right + 1 || b.left < box.left - 1) {
          const label = row.querySelector('.score-menu-row__label')?.textContent ?? '?';
          out.push(`${label}: ${kid.textContent ?? '?'} runs from ${String(Math.round(b.left))} to ${String(Math.round(b.right))} in a body of ${String(Math.round(box.left))}–${String(Math.round(box.right))}`);
          break;
        }
      }
    }
    return out;
  });
}

test('no control in the sheet is split across lines', async ({ page }) => {
  const faults: string[] = [];
  for (const scale of [1, 1.15]) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 500 ? 740 : 360 });
      await page.goto(`/#/score/${SONG}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      if (scale !== 1) {
        await page.evaluate((pct) => {
          document.documentElement.style.fontSize = `${String(16 * pct)}px`;
        }, scale);
        await page.waitForTimeout(150);
      }
      await openScoreMenu(page);
      await page.waitForTimeout(150);
      const where = `${String(width)} px at ${String(Math.round(scale * 100))} % text`;
      for (const fault of await wrappedRows(page)) faults.push(`${where} — ${fault}`);
      // The other half of `nowrap`: a control that cannot break has to fit, or
      // it leaves the sheet instead of leaving its line. One of those faults
      // cannot be traded for the other.
      for (const fault of await overflowing(page)) faults.push(`${where} — overflow — ${fault}`);
    }
  }
  expect(faults, `a stepper's two halves ended up on separate lines:\n${faults.join('\n')}`).toEqual([]);
});
