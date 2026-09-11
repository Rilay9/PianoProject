/**
 * The control bar's targets, and the row they have to fit in.
 *
 * The geometric sweep reported the bar's controls as under `04` §0 R4's "about
 * forty" on 118 gallery cells. Most of that was the instrument — `R`, `L` and
 * `Both` are one segmented control, not three targets, and they say so now with
 * `data-tap-group`. What was real is the tempo readout, which was 43 x 17 and
 * is a control because it opens the tempo sheet; its height cost nothing
 * horizontally, and the sheet's own toggles were narrow in a full-screen sheet
 * with a column to spare.
 *
 * `#score-play` and `#score-more` are the two that could not be fixed. A 342 px
 * row carrying six controls has no forty pixels to give them, and two CI runs
 * proved it the hard way: widening them wrapped the bar onto a second line on
 * the Linux runner, where the same words are wider. Wrapping is §9.23's fault
 * and it is the worse of the two.
 *
 * So this asserts both ends and lets neither buy the other — one row, and no
 * target under forty except the two named above. The exceptions are a list so
 * that the day the bar carries fewer controls, it is obvious what can go.
 */
import { expect, test } from '@playwright/test';

/** `04` §0 R4. */
const TAP_MIN = 40;

/**
 * Which controls may leave the bar, and which must stay on it.
 *
 * The point of the overflow is that no control needs an exception: whatever the
 * row cannot afford goes into the `...` sheet instead of being drawn too small.
 * So there is no allow-list here any more — only a check that the two which can
 * never leave are still there, because `...` is where the others go and a
 * gateway that hid itself would be a trap.
 */
const MUST_STAY = ['score-play', 'score-more'];

/** Every width the gallery shoots, plus the owner's real phone. */
const WIDTHS = [280, 320, 342, 360, 412, 740, 780, 1200];

/** The longest title in the authored library, which is what wrapped the row. */
const LONG_TITLE = 'song.folk.when-the-saints.alternating';
const PLAIN = 'song.folk.hot-cross-buns';

test('every control on the bar is big enough to hit, and the row never wraps', async ({ page }) => {
  const faults: string[] = [];
  for (const song of [PLAIN, LONG_TITLE]) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 500 ? 740 : 360 });
      await page.goto(`/#/score/${song}`);
      await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(700);

      const seen = await page.evaluate(({ min, stay }) => {
        const bar = document.querySelector('#score-bar');
        if (!bar) return null;
        const controls = [
          ...bar.querySelectorAll<HTMLElement>('button, select, [role="button"], .score-tempo-label'),
        ];
        const small = controls
          // A segmented control is one target, not one per segment: `R`, `L`
          // and `Both` are 23 px each and together are a 92 x 40 control. The
          // app marks those groups, and the group is what is judged.
          .filter((el) => el.hasAttribute('data-tap-group') || el.closest('[data-tap-group]') === null)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { id: el.id || el.className, w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter((el) => el.w > 0 && (el.w < min || el.h < min));
        const missing = stay.filter((id) => {
          const el = document.getElementById(id);
          return !el || !bar.contains(el) || el.getBoundingClientRect().width <= 0;
        });
        // One row, from the bar's height rather than its children's tops: a
        // zero-height child sits at the top whatever the row does.
        const tops = new Set(
          [...bar.children]
            .filter((k) => k.getBoundingClientRect().height > 0)
            .map((k) => Math.round(k.getBoundingClientRect().top)),
        );
        // Nothing squeezed into illegibility.
        //
        // The row survives a wider font because one control gives ground: the
        // mode select may shrink, so the six of them can never wrap onto two
        // lines whatever the machine's font does. The risk that buys is the
        // other one — a select squeezed until its own words are cut off — so
        // that is what is checked. `.score-bar__title` is exempt: truncating
        // is what it is for, it says so with `text-overflow: ellipsis`, and a
        // 53-character piece name has nowhere else to go.
        const cut = [...bar.querySelectorAll<HTMLElement>('select, button')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => `${el.id || el.className} needs ${String(el.scrollWidth)}px in ${String(el.clientWidth)}px`);
        return { rows: tops.size, small, cut, missing, held: [...bar.children].map((k) => k.id || k.className) };
      }, { min: TAP_MIN, stay: MUST_STAY });

      if (!seen) throw new Error(`no control bar at ${String(width)}px`);
      const where = `${song.replace('song.folk.', '')} at ${String(width)}px`;
      if (seen.rows > 1) faults.push(`${where}: the bar wrapped onto ${String(seen.rows)} rows`);
      for (const el of seen.cut) faults.push(`${where}: ${el}`);
      for (const id of seen.missing) faults.push(`${where}: ${id} left the bar, and it may not`);
      console.log(`${where}: bar holds ${seen.held.filter((h) => h).join(', ')}`);
      for (const el of seen.small) {
        faults.push(`${where}: ${el.id} is ${String(el.w)}x${String(el.h)}, under ${String(TAP_MIN)}`);
      }
    }
  }
  expect(faults, faults.join('\n')).toEqual([]);
});

test('a control that leaves the bar is still reachable, with a word for it', async ({ page }) => {
  // The whole trade is that a control is better in the sheet than drawn too
  // small on the bar. That only holds if it is actually *there* — one that
  // quietly vanished at a narrow width would be worse than either.
  await page.setViewportSize({ width: 280, height: 740 });
  await page.goto(`/#/score/${PLAIN}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(700);

  // By class: the hands group is a `div.score-group` and carries no id of its
  // own — only its three buttons do.
  await expect(
    page.locator('#score-bar .score-group'),
    'nothing overflowed at 280px, so this proves nothing',
  ).toHaveCount(0);

  await page.locator('#score-more').click();
  const sheet = page.locator('#score-more-sheet');
  await expect(sheet).toBeVisible();
  // Three groups live in this sheet — layout and keys are always there — so
  // the hands one is found by a button only it has.
  await expect(sheet.locator('#score-hands-L')).toBeVisible();
  // And with its name beside it: the bar is the place where a bare glyph has to
  // do, the sheet is not.
  await expect(
    sheet.locator('.score-menu-row', { has: page.locator('#score-hands-L') }),
  ).toContainText('Hands');
  // And it still works from in there.
  await expect(sheet.locator('#score-hands-L')).toBeEnabled();
});
