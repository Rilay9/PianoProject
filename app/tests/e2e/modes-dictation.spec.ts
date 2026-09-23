/**
 * Melodic dictation, played (T17; `04` §5c, `pending-review` Entry 24 item 4).
 *
 * The card used to print the note names of the phrase before a key was
 * pressed — an ear drill that could not be got wrong by anyone looking at the
 * screen. `dictationCard.test.ts` drives the real screen in jsdom and proves
 * the names are off the card; what it cannot do is answer, because jsdom has
 * no keys to press and no sound to hear.
 *
 * So this opens the drill from `theory.4`'s own row, checks the card gives
 * nothing away, plays the phrase back on the on-screen keys — the instrument a
 * learner with no cable has — and checks the screen answers.
 *
 * Judged as a learner: is the prompt the next thing to do and on the screen
 * without scrolling; is *hearing it again* free (it is the question being
 * repeated, so it costs no mark); does the card stay honest until the attempt
 * is judged.
 *
 * **Nothing here is heard.** Whether the phrase that plays is the phrase the
 * card is about is not something this file can say — it reads the expected
 * pitches off the screen, which is the same source the sound is made from.
 */
import { expect, test, type Page } from '@playwright/test';

const PHONE = { width: 342, height: 740 };
const DICTATION = 'drill.ear.melodic-dictation';
const EAR_GLYPH = '🎧';

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

async function withoutScrolling(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight;
  }, selector);
}

async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

/** `theory.4`'s own row for the dictation drill. */
async function dictationFromTheRung(page: Page): Promise<void> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/theory.4');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const row = page.locator(`#lesson-exercises .list-row[data-item="${DICTATION}"]`);
  await expect(row, `theory.4 no longer offers ${DICTATION}`).toBeVisible();
  await row.click();
  await expect(page.locator('section[data-screen="drill"]')).toHaveAttribute('data-kind', 'call-response', {
    timeout: 60_000,
  });
}

test('the card gives nothing away, and the prompt is the next thing to do', async ({ page }) => {
  await dictationFromTheRung(page);
  // The headphone, not the note names: the drill's own label *is* the answer.
  await expect(page.locator('#drill-ear-card')).toHaveText(EAR_GLYPH);
  // The card that would carry them is not drawn at all on this kind, which is
  // a stronger answer than an empty one.
  await expect(page.locator('#drill-symbol')).toHaveCount(0);
  // Nothing anywhere else on the card names them either, which is the claim
  // that matters — a name in the counter would give the game away just as
  // well as one on the card.
  const section = page.locator('section[data-screen="drill"]');
  const expects = ((await section.getAttribute('data-expects')) ?? '').split(',').filter(Boolean);
  expect(expects.length, 'the drill expects nothing, so this proves nothing').toBeGreaterThan(0);
  const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const shown = (await section.textContent()) ?? '';
  for (const midi of expects) {
    const name = `${NAMES[Number(midi) % 12] ?? ''}${String(Math.floor(Number(midi) / 12) - 1)}`;
    expect(shown, `${name} is printed on the card before it has been played`).not.toContain(name);
  }

  // R1 on a 342 px phone: the instruction and the keys that answer it are the
  // screen, and both are on it.
  for (const id of ['#drill-prompt', '#drill-replay']) {
    expect(await withoutScrolling(page, id), `${id} is below the fold`).toBe(true);
  }
  // Hearing it again is free — it is the question being repeated — and the two
  // controls that would forfeit the mark are not offered on this kind.
  await expect(page.locator('#drill-hear')).toHaveCount(0);
  await expect(page.locator('#drill-show')).toHaveCount(0);
});

test('the keys answer it, and the screen says so', async ({ page }) => {
  test.setTimeout(120_000);
  await dictationFromTheRung(page);
  const section = page.locator('section[data-screen="drill"]');
  const expects = ((await section.getAttribute('data-expects')) ?? '').split(',').filter(Boolean);
  expect(expects.length, 'the drill expects nothing, so this proves nothing').toBeGreaterThan(0);

  // Played back in order on the only instrument a phone has.
  for (const midi of expects) await press(page, Number(midi));
  await expect(page.locator('#drill-counter')).toContainText('1 right', { timeout: 30_000 });
});

test('replaying the phrase costs nothing and leaves the card closed', async ({ page }) => {
  await dictationFromTheRung(page);
  await expect(page.locator('#drill-replay')).toBeVisible();
  await page.locator('#drill-replay').click();
  // Still the headphone: hearing it again is not an answer and must not be
  // treated as one.
  await expect(page.locator('#drill-ear-card')).toHaveText(EAR_GLYPH);
  await expect(page.locator('#drill-counter')).toContainText('0 right');
});
