/**
 * How much room the music is allowed to take, and where it sits in it.
 *
 * Filling the width was the fix for the phone and the fault on the laptop. A
 * slot draws one system and OSMD stretches a page's last system to the page's
 * width, so the same rule that pulled a dense bar out to 96 % of a 342 px
 * screen smeared four notes of a beginner's tune across 1512 px, and the eye
 * had to travel the whole display to find the next note. Neither the gallery
 * nor the corpus caught it, because every fixture is a phone.
 *
 * Two assertions, at both ends of the same guardrail: the phone must keep the
 * fill it was given, and a wide screen must keep human note spacing and then
 * centre what it has rather than pinning it to a corner of an empty screen.
 */
import { expect, test } from '@playwright/test';
import { openDevScore, waitForStableLayout } from './fixtures/devScore';

const SONG = 'song.folk.hot-cross-buns';

const PHONE = { width: 342, height: 740 };
const TABLET = { width: 900, height: 1200 };
const LAPTOP = { width: 1512, height: 850 };

/** Below this the phone is back to the third-of-a-screen sheet (`09` §35). */
const PHONE_FILL_MIN = 0.85;
/**
 * How much wider than the engraver's natural width a bar may be drawn, at its
 * sheet's scale, before its notes are spread: line widths and rounding.
 *
 * **Replaced 2026-09-25 (T38).** This was `WIDE_FILL_MAX = 0.7`, a share of
 * the stage's width above which the bar was taken to be "stretched rather than
 * engraved". Since T34 a bar is engraved at its natural spacing and the window
 * scaled uniformly as large as the stage allows, so a natural bar may reach
 * across a wide stage and a share of the width cannot tell it from a stretched
 * one (`04` §5, the note to whoever writes the test). When T38 stopped the
 * greyed next row from sizing the window, Hot Cross Buns' natural bars at
 * 900 px reached 81 % of the width and this read them as stretched. The claim
 * the test exists for — four notes are not pulled apart across a display — is
 * now read bar by bar from the glass: each bar's stave, divided by its sheet's
 * scale, against the bar's natural width from the engraver (`debugFit`).
 */
const SPACED_AS_ENGRAVED = 1.03;

/**
 * Below this share of the width, being left-aligned reads as a broken layout.
 *
 * Above it, it reads as a right margin — which is what a page of music has.
 */
const CENTRE_BELOW_FILL = 0.5;

interface Drawn {
  width: number;
  left: number;
  right: number;
  /** Each bar on this sheet: its drawn width at the sheet's scale over its natural width. */
  spacing: { bar: number; ratio: number }[];
}

async function drawn(page: import('@playwright/test').Page, viewport: number): Promise<Drawn[]> {
  await page.goto(`/#/score/${SONG}`);
  const screen = page.locator('[data-screen="score"]');
  await expect(screen).toBeVisible({ timeout: 60_000 });
  await expect(screen).toHaveAttribute('data-mode', /wait|tempo/, { timeout: 60_000 });
  // The fit settles a frame or two after the score arrives, and the probe's
  // measurement of the piece lands after that — the density judgement reads it,
  // so measuring before it has landed measures the fallback instead.
  await page.waitForTimeout(2_500);
  const seen = await page.evaluate(() => {
    const fit = (
      window as unknown as {
        __pianopath?: {
          scoreFit?: () => { slots?: { bars?: { number: number; bar: number; natural: number }[] }[] } | null;
        };
      }
    ).__pianopath?.scoreFit?.();
    const out: { width: number; left: number; right: number; spacing: { bar: number; ratio: number }[] }[] = [];
    for (const host of document.querySelectorAll<HTMLElement>('.score-buffer.is-front')) {
      let left = Infinity;
      let right = -Infinity;
      for (const stave of host.querySelectorAll('.staffline, .vf-stave')) {
        const r = stave.getBoundingClientRect();
        if (r.width <= 0) continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
      const match = /scale\(([\d.]+)\)/.exec(host.style.transform);
      const scale = match ? Number(match[1]) : 0;
      const laid = fit?.slots?.[Number(host.dataset.slot)]?.bars ?? [];
      const spacing: { bar: number; ratio: number }[] = [];
      for (const measure of host.querySelectorAll<SVGGElement>('.vf-measure')) {
        const lines: DOMRect[] = [];
        for (const line of measure.querySelectorAll(':scope > path')) {
          const box = line.getBoundingClientRect();
          if (box.height <= 1.5 && box.width >= 10) lines.push(box);
        }
        const bar = laid.find((b) => String(b.number) === measure.id);
        if (lines.length < 5 || !bar || !(bar.natural > 0) || !(scale > 0)) continue;
        const drawnWidth = (Math.max(...lines.map((b) => b.right)) - Math.min(...lines.map((b) => b.left))) / scale;
        spacing.push({ bar: bar.bar, ratio: drawnWidth / bar.natural });
      }
      if (Number.isFinite(left)) out.push({ width: right - left, left, right, spacing });
    }
    return out;
  });
  expect(seen.length, `nothing was drawn at ${String(viewport)} px`).toBeGreaterThan(0);
  return seen;
}

test('a phone still gets the width filled', async ({ page }) => {
  await page.setViewportSize(PHONE);
  const slots = await drawn(page, PHONE.width);
  const widest = Math.max(...slots.map((s) => s.width));
  expect(
    widest / PHONE.width,
    `the phone drew ${String(Math.round(widest))}px of ${String(PHONE.width)}`,
  ).toBeGreaterThan(PHONE_FILL_MIN);
});

for (const size of [TABLET, LAPTOP]) {
  test(`a ${String(size.width)}px screen keeps note spacing and centres it`, async ({ page }) => {
    await page.setViewportSize(size);
    const slots = await drawn(page, size.width);
    const widest = Math.max(...slots.map((s) => s.width));
    // Note spacing, from the outcome: no bar on the glass wider than the
    // engraver sets its notes, at the one scale (see `SPACED_AS_ENGRAVED`).
    const spread = slots.flatMap((s) => s.spacing).filter((b) => b.ratio > SPACED_AS_ENGRAVED);
    expect(
      spread.map((b) => `bar ${String(b.bar + 1)} at x${b.ratio.toFixed(2)} of its natural width`),
      `${String(size.width)}px spread a bar's notes`,
    ).toEqual([]);
    expect(slots.flatMap((s) => s.spacing).length, 'no bar on the glass could be read').toBeGreaterThan(0);

    // Every slot starts in the same place: they are engraved separately, so
    // centring each on its own ink put four stacked systems at four different
    // left edges.
    const lefts = slots.map((s) => Math.round(s.left));
    expect(new Set(lefts).size, `slots began at ${lefts.join(', ')}`).toBe(1);

    // Centred only where being left-aligned would read as a failure.
    //
    // A page of music with a right margin is a page of music: the tablet draws
    // about two thirds of its width and sitting to the left of that is what
    // sheet music looks like. What is not acceptable is a third of a desktop
    // display of notes in the corner of an otherwise empty screen, so the
    // centring is asked for only once the music has stopped filling the space
    // in any recognisable way.
    const at = slots.find((s) => s.width === widest);
    if (!at) throw new Error('the widest slot went missing');
    if (widest / size.width >= CENTRE_BELOW_FILL) return;
    const before = at.left;
    const after = size.width - at.right;
    expect(
      Math.abs(before - after),
      `${String(Math.round(before))}px before the music and ${String(Math.round(after))}px after it`,
    ).toBeLessThan(size.width * 0.1);
  });
}

/**
 * And the same rule on a phone, which is where the code was skipping it.
 *
 * `centredInset` used to return early for any window `mayStretch` had
 * permitted, on the reasoning that music allowed to fill the width already sits
 * where it should. Permission is not the same as having filled it: a slot's
 * page is sized so a stretched system would reach both edges, and OSMD may
 * decline the stretch and engrave the bar at its natural width — which is the
 * behaviour the owner asked for. The 6/8 tuplet fixture upright then drew 209 px
 * of music on a 338 px stage with 7 px before it and 122 px after it: not
 * stretched, which is right, and not a margin either.
 *
 * Structural rather than a picture, because this is about *where* the music is
 * and a reference image cannot say that without also pinning the engraving to
 * one machine's fonts. `score.spec`'s screenshot of the same fixture still
 * watches the engraving; this watches the position, in CI as well.
 *
 * The dev harness, because no catalog piece leaves this much of the owner's
 * 342 px unused — every one of them fills 84 % or more — so the case only
 * exists on a fixture.
 */
test('a narrow system on a phone is centred, not pinned left', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const dev = await openDevScore(page);
  await dev.load('tuplets-68');
  await dev.setBars(4);
  await dev.showStep(0);
  await expect(page.locator('.score-buffer.is-front svg').first()).toBeVisible();
  await waitForStableLayout(page, '.score-buffer.is-front svg');
  const box = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.dev-score__stage');
    if (!stage) return null;
    const frame = stage.getBoundingClientRect();
    let left = Infinity;
    let right = -Infinity;
    // The notes and the staves, not the page: the page is as wide as OSMD
    // wanted and the question is where the ink ended up on the glass.
    for (const svg of stage.querySelectorAll('.score-buffer.is-front svg')) {
      for (const node of svg.querySelectorAll('path, rect, text, polyline, line')) {
        const r = node.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
    }
    if (!Number.isFinite(left)) return null;
    return { before: left - frame.left, after: frame.right - right, span: right - left, stage: frame.width };
  });
  expect(box, 'nothing was drawn').not.toBeNull();
  if (!box) return;
  // Only asked for where the code asks for it: `CENTRE_WHEN_SPARE` centres a
  // system once a quarter of the stage is spare, and leaves a narrower margin
  // alone. If this fixture ever engraves wide enough to fill the stage the
  // question stops applying, and saying so beats asserting a stale premise.
  const spare = (box.stage - box.span) / box.stage;
  test.skip(spare <= 0.25, `the fixture filled the stage: ${String(Math.round(spare * 100))} % spare`);
  expect(
    Math.abs(box.before - box.after),
    `${String(Math.round(box.before))}px before the music and ${String(Math.round(box.after))}px after it, on a ${String(Math.round(box.stage))}px stage`,
  ).toBeLessThan(box.stage * 0.1);
});
