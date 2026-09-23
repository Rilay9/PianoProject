/**
 * The one-line rhythm staff puts its noteheads on the line (T17;
 * `pending-review` Entry 33, third engraving fault).
 *
 * Entry 33 read the picture and found every notehead of `exercise.rhythm.*`
 * hanging three ledger lines *below* the single staff line, and proved it was
 * not the generator's doing: the same four bars written as eight different
 * pitches all rendered byte-for-byte the same page. It is an engraving rule —
 * under a percussion clef OSMD places the head from the written pitch, and a
 * rhythm staff has no pitch that means anything.
 *
 * This is the test for that rule, asked of the app's own Score screen rather
 * than of a preview crop, and asked as a **relationship**: the staff line runs
 * through the notehead. No pixel measured on this machine appears below.
 *
 * The second test is the other half of the change — that it touched nothing
 * else. A rule that fixed one picture and collapsed every piano staff onto one
 * line would be the fix `00-invariants` §1 refuses.
 *
 * **Nothing here is heard**, and the other two of Entry 33's three engraving
 * faults are *not* fixed here: they are recorded in Entry 38 with the pictures
 * of what was tried.
 */
import { expect, test, type Page } from '@playwright/test';

/** Four bars of quarters on a single line — the family Entry 33 read. */
const RHYTHM = 'exercise.rhythm.quarters.4bar';
/** The same fault, in the other family that carries a one-line staff. */
const CLAVE = 'exercise.clave.son-3-2';
/** An ordinary grand staff, as the control. */
const PIANO = 'song.folk.mary-had-a-little-lamb.ht';

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

interface Ink {
  /** The y of every drawn staff line in the window, deduplicated. */
  lines: number[];
  /** Every notehead, as its vertical centre and its own height. */
  heads: { mid: number; height: number }[];
}

/**
 * The drawn staff lines and noteheads of the window on screen.
 *
 * A staff line is what it looks like — a wide, flat stroke. Asking by shape
 * rather than by a VexFlow class keeps this true of whatever the engraver
 * calls things next.
 */
async function ink(page: Page): Promise<Ink> {
  return page.evaluate(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    if (!svg) return { lines: [], heads: [] };
    const ys = new Set<number>();
    for (const el of svg.querySelectorAll('rect, path, line')) {
      const box = el.getBoundingClientRect();
      // Flat and long: a staff line. A barline is tall and narrow, a beam is
      // short, a slur is neither.
      if (box.height <= 4 && box.width > 150) ys.add(Math.round(box.top + box.height / 2));
    }
    const heads = [...svg.querySelectorAll('.vf-notehead')].map((el) => {
      const box = el.getBoundingClientRect();
      return { mid: box.top + box.height / 2, height: box.height };
    });
    return { lines: [...ys].sort((a, b) => a - b), heads };
  });
}

async function openScore(page: Page, itemId: string): Promise<void> {
  await page.setViewportSize({ width: 740, height: 342 });
  await page.goto(`/#/score/${itemId}`);
  await expect(page.locator('section[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#score-stage svg').first()).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(async () => (await ink(page)).heads.length, { timeout: 60_000 })
    .toBeGreaterThan(0);
}

for (const itemId of [RHYTHM, CLAVE]) {
  test(`${itemId}: the single line runs through every notehead`, async ({ page }) => {
    test.setTimeout(180_000);
    await openScore(page, itemId);
    const { lines, heads } = await ink(page);
    // One staff, one line. Anything else and the question below is about the
    // wrong stroke.
    expect(lines, `this window drew ${String(lines.length)} staff lines, not one`).toHaveLength(1);
    const line = lines[0] ?? 0;
    for (const head of heads) {
      expect(head.height, 'a notehead with no height').toBeGreaterThan(0);
      // On the line means the line crosses the head — the head's own height is
      // the ruler, so nothing here is a number measured on this machine.
      expect(
        Math.abs(head.mid - line),
        `a notehead sits ${String(Math.round(Math.abs(head.mid - line)))} px off the single line, ` +
          `which is more than its own ${String(Math.round(head.height))} px of head`,
      ).toBeLessThanOrEqual(head.height / 2);
    }
  });
}

test('an ordinary grand staff still has two staves of five lines', async ({ page }) => {
  test.setTimeout(180_000);
  // The control. The rule that fixes the rhythm staff applies only to a
  // percussion clef; a piano piece has to be untouched by it, or it is not a
  // fix (`00-invariants` §1).
  await openScore(page, PIANO);
  const { lines, heads } = await ink(page);
  expect(lines.length, 'the grand staff did not draw ten lines').toBeGreaterThanOrEqual(10);
  // And the notes are spread over the staves rather than collapsed onto one
  // line, which is what a percussion rule applied too widely would look like.
  const mids = new Set(heads.map((head) => Math.round(head.mid)));
  expect(mids.size, 'every notehead landed at the same height').toBeGreaterThan(1);
});

/**
 * A printed direction is above the top staff, not between the staves (T22).
 *
 * `pending-review` Entry 33 opened one page per generated family and found the
 * same fault on nineteen of them: the direction — *4 notes to the beat, count
 * them, do not hurry*; *Count out loud; the pulse does not move* — drawn in the
 * gap between the staves at the measure's left edge, with the system's barline
 * straight through the words, and on four families with the first letter on top
 * of the brace. Entry 38 then proved it is not an engraving setting: OSMD's one
 * rule about unplaced expressions (`UnknownExpressionTextAlignment`) was
 * rendered both ways and gave the base picture both times, because a barline is
 * drawn through the *whole system* and anything between the staves has one
 * through it. The only cure is to move the text out, and that is the writer's:
 * `generate_exercises.direction_text` now sets `placement="above"` on every one.
 *
 * So this is the app's half of the claim — that the file the generator writes
 * really does engrave clear of the staves — asked as a relationship: the words'
 * box is entirely above the highest staff line the window drew. Nothing below
 * is a number measured on this machine.
 *
 * **It needs the content rebuilt.** The assertion reads the shipped `.mxl`, so
 * it fails against a tree whose generated scores predate the change.
 */
const WITH_A_DIRECTION = 'exercise.trill.c.4pb.right';

test('a generated exercise prints its direction above the top staff', async ({ page }) => {
  test.setTimeout(180_000);
  await openScore(page, WITH_A_DIRECTION);
  const { lines } = await ink(page);
  expect(lines.length, 'this window drew no staff lines').toBeGreaterThan(0);
  const topLine = Math.min(...lines);

  const words = await page.evaluate(() => {
    const svg = document.querySelector('#score-stage .is-front svg');
    if (!svg) return null;
    // The direction is the one run of words over the music: chord symbols are
    // one token, fingerings are digits, and a tempo mark is off on this screen.
    const texts = [...svg.querySelectorAll('text')]
      .map((el) => ({ text: el.textContent ?? '', box: el.getBoundingClientRect() }))
      .filter((entry) => /\s/.test(entry.text.trim()) && entry.text.trim().length > 8);
    if (texts.length === 0) return null;
    const first = texts[0];
    if (!first) return null;
    return { text: first.text, top: first.box.top, bottom: first.box.bottom };
  });

  expect(words, 'no printed direction was drawn on this exercise at all').not.toBeNull();
  expect(
    words!.bottom,
    `the direction “${words!.text}” is drawn at or below the top staff line, which is where ` +
      'the barline runs through it',
  ).toBeLessThanOrEqual(topLine);
});
