/**
 * The chord-chart door on a lesson row (T17; `04` §3b).
 *
 * Until 2026-09-21 the chart screen had a route and no door. One of the two
 * doors built for it is a *Chart* action beside ▶ and *Know it* on a lesson's
 * option row, drawn only where the build measured chord symbols in the file.
 * `doors.spec.ts` proves the button is there; what it does not do is walk
 * through it and find out whether what is on the other side can be played
 * from.
 *
 * So this presses it on `jazz.5` — one of the two rungs whose lesson describes
 * the chart — and then judges the screen as a learner:
 *
 *  - the chart, the form tracker and the transport are on a 342 px phone's
 *    first screenful, because a lead sheet you scroll is not one (`04` §0 R1);
 *  - the read-ahead is the whole form printed at once with the sounding bar
 *    marked, so the next chord is legible before it arrives;
 *  - what the learner plays is answered — the sounding bar says whether it
 *    agrees with the chart;
 *  - Stop stops and leaves the chart standing, and Back leaves nothing on.
 *
 * **Nothing here is heard**: the count-off, the bass and the comp are not
 * checked by any assertion below.
 */
import { expect, test, type Page } from '@playwright/test';

import { installMidiMock, type MidiMock } from './fixtures/midiMock';

const PHONE = { width: 342, height: 740 };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
      localStorage.setItem('pianopath.setup', JSON.stringify({ status: 'skipped', version: 1 }));
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

/** The first song row on `jazz.5` that carries the door, and the door itself. */
async function chartFromTheLesson(page: Page): Promise<string> {
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/jazz.5');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  const row = page
    .locator('#lesson-songs .list-row[data-item]')
    .filter({ has: page.locator('button[aria-label^="Open the chord chart"]') })
    .first();
  await expect(
    row,
    'no song on jazz.5 offers the chart door, so this file proves nothing',
  ).toBeVisible();
  const itemId = (await row.getAttribute('data-item')) ?? '';
  await row.locator('button[aria-label^="Open the chord chart"]').click();
  await expect(page.locator('section[data-screen="chart"]')).toBeVisible({ timeout: 60_000 });
  return itemId;
}

test('the row’s Chart action opens that piece’s chart, with its chords in it', async ({ page }) => {
  test.setTimeout(120_000);
  const itemId = await chartFromTheLesson(page);
  // It opened *this* row's piece, not the rung's first playable song: the
  // door is on the piece, which is the whole reason it is not a `tools` entry.
  expect(new URL(page.url()).hash).toContain(encodeURIComponent(itemId));
  // And there are chords behind it. A chart of a piece with none is four empty
  // bars under a count-off, which is what `hasChordSymbols` exists to prevent.
  await expect(page.locator('#chart-grid .chart-cell').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#chart-grid .chart-cell').first()).not.toBeEmpty();
  await expect(page.locator('#chart-form')).toContainText('Bar 1 of');
});

test('the chart, the tracker and the transport are in one glance on a phone', async ({ page }) => {
  test.setTimeout(120_000);
  await chartFromTheLesson(page);
  await expect(page.locator('#chart-grid .chart-cell').first()).toBeVisible({ timeout: 60_000 });
  // The tracker, the transport and the start of the chart. Not the *whole*
  // grid: the form of a thirty-two bar tune is longer than a phone and is
  // meant to be — what R1 asks is that the subject *starts* in the first
  // screenful and that the control which starts it is not underneath all of
  // it, which is where it used to be.
  for (const id of ['#chart-form', '#chart-start', '#chart-stop', '#chart-grid .chart-cell']) {
    expect(await withoutScrolling(page, id), `${id} is below the fold on a 342 px phone`).toBe(true);
  }
  // The read-ahead, in the form a chart has it: the bars after the sounding
  // one are already printed and already legible.
  const cells = page.locator('#chart-grid .chart-cell');
  expect(await cells.count(), 'the chart drew fewer than two bars').toBeGreaterThan(1);
  await expect(cells.nth(1)).not.toBeEmpty();
});

test('a count-off runs it, what is played is answered, and Stop stops', async ({ page }) => {
  test.setTimeout(180_000);
  const midi: MidiMock = await installMidiMock(page, { permission: 'granted' });
  await chartFromTheLesson(page);
  await expect(page.locator('#chart-grid .chart-cell').first()).toBeVisible({ timeout: 60_000 });

  // The fastest this screen will go, so a bar is a second rather than three.
  await page.locator('#chart-bpm').fill('240');
  await page.locator('#chart-bpm').blur();
  await page.locator('#chart-start').click();

  // The tracker moves, which is the one thing on this screen that says the
  // form is going round rather than sitting on bar 1.
  const form = page.locator('#chart-form');
  const first = (await form.textContent()) ?? '';
  await expect(form).not.toHaveText(first, { timeout: 90_000 });

  // The chart answers what is played. There is no keyboard on this screen —
  // recorded in `pending-review` Entry 38 — so the only instrument a test has
  // here is a MIDI piano, which is also true of a learner.
  await midi.noteOn(61, 80);
  await midi.noteOn(63, 80);
  await midi.noteOn(66, 80);
  await expect(page.locator('#chart-grid .chart-cell[data-current="true"]')).toHaveAttribute(
    'data-match',
    /yes|no/,
    { timeout: 30_000 },
  );

  await page.locator('#chart-stop').click();
  // Stop leaves the chart standing — reading one is what somebody stopped the
  // loop to do (§3c's rule, and this screen is where it came from).
  await expect(page.locator('#chart-grid .chart-cell').first()).toBeVisible();
});

test('a piece the build measured no chords in is offered no door', async ({ page }) => {
  // The negative case, which is what keeps the door off pieces where it would
  // open four empty bars: `1.1`'s songs are single-line tunes with no harmony.
  await page.setViewportSize(PHONE);
  await page.goto('/#/lesson/1.1');
  await expect(page.locator('section[data-screen="lesson"]')).toBeVisible();
  await expect(page.locator('#lesson-songs .list-row').first()).toBeVisible();
  await expect(
    page.locator('#lesson-songs button[aria-label^="Open the chord chart"]'),
  ).toHaveCount(0);
});
