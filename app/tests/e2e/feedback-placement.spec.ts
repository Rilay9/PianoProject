/**
 * A message appears where the thing that caused it is (`04` §0 R6).
 *
 * Three faults from handoff §5j, two of them measured here in a real browser
 * because they are about pixels and about OSMD:
 *
 * - **Drill's status line was below the fold sideways.** It was the last
 *   element in the body before the result sheet, and it is the only cue there
 *   is for the rhythm count-in ("Count-in — 1, 2, 3") and for "playback is
 *   muted while the microphone is listening". A count-in nobody can see is a
 *   count-in that has not happened.
 * - **Settings' status line was below about forty controls**, so *Saved.* for
 *   a toggle near the top landed thousands of pixels below the thumb.
 * - **The transposition drill re-engraved on every redraw.** The unit test
 *   (`tests/unit/drillNotation.test.ts`) counts the renderers against a stubbed
 *   OSMD; this asserts the same thing against the real one, which is the thing
 *   that takes the time.
 *
 * The owner's phone: 342 x 740 upright, 740 x 342 sideways.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';

const SIDEWAYS = { width: 740, height: 342 };
const UPRIGHT = { width: 342, height: 740 };

/** Opens a drill and waits for its first card. */
async function openDrill(page: Page, id: string): Promise<MidiMock> {
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.goto(`/#/drill/${id}`);
  await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
    timeout: 30_000,
  });
  return midi;
}

/** Whether a locator's box is wholly inside the viewport. */
async function withinViewport(page: Page, selector: string): Promise<boolean> {
  const box = await page.locator(selector).boundingBox();
  const size = page.viewportSize();
  if (!box || !size) return false;
  return box.y >= 0 && box.y + box.height <= size.height && box.x + box.width <= size.width;
}

test.describe('the drill screen’s status line', () => {
  test('shows the count-in sideways, on the screen rather than below it', async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    await openDrill(page, 'drill.rhythm.quarters-rests');

    // The count-in is the message this line exists for: one bar of clicks
    // before the drill's clock starts, and the numbers are the only thing that
    // says which beat it is on.
    await expect(page.locator('#drill-status')).toContainText('Count-in', { timeout: 20_000 });
    expect(await withinViewport(page, '#drill-status')).toBe(true);
    // And above the buttons, not after them: it is about the card.
    const status = await page.locator('#drill-status').boundingBox();
    const controls = await page.locator('#drill-controls').boundingBox();
    expect(status).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(status?.y ?? Number.MAX_SAFE_INTEGER).toBeLessThan(controls?.y ?? 0);
  });

  test('is on the screen upright too', async ({ page }) => {
    await page.setViewportSize(UPRIGHT);
    await openDrill(page, 'drill.rhythm.quarters-rests');
    await expect(page.locator('#drill-status')).toContainText('Count-in', { timeout: 20_000 });
    expect(await withinViewport(page, '#drill-status')).toBe(true);
  });
});

test.describe('the transposition drill’s four bars', () => {
  test('are engraved once per card and survive the answer', async ({ page }) => {
    await page.setViewportSize(UPRIGHT);
    const midi = await openDrill(page, 'drill.reading.transposition');
    await expect(page.locator('#drill-notation svg').first()).toBeVisible({ timeout: 60_000 });

    // Marked on the node itself: if the host is rebuilt, the mark goes with
    // the node that was thrown away.
    await page.locator('#drill-notation').evaluate((node) => {
      node.setAttribute('data-probe', 'first-card');
    });

    // One wrong note per expected note settles the card as wrong, which is a
    // redraw — the redraw that used to blank and re-engrave the bars 450 ms
    // after the answer, while the learner was reading them.
    const expected = (await page.locator('[data-screen="drill"]').getAttribute('data-expects')) ?? '';
    const notes = expected.split(',').filter(Boolean);
    expect(notes.length).toBeGreaterThan(0);
    for (let i = 0; i < notes.length; i += 1) {
      await midi.noteOn(61, 90);
      await midi.noteOff(61);
    }

    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-feedback', /correct|wrong/);
    // Same node, same engraving, nothing re-parsed.
    await expect(page.locator('#drill-notation[data-probe="first-card"]')).toHaveCount(1);
    await expect(page.locator('#drill-notation svg')).toHaveCount(1);

    // The next card is a different card, so it gets its own engraving — and
    // the probe goes with the host that was dropped.
    await expect(page.locator('#drill-notation[data-probe="first-card"]')).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(page.locator('#drill-notation svg').first()).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('Settings says what it saved where the control is', () => {
  test('puts Saved. on the row that was changed, in view', async ({ page }) => {
    await page.setViewportSize(UPRIGHT);
    await page.goto('/#/settings');
    // Second row of the first group: as far from the bottom of the body as a
    // control on this screen gets.
    const bars = page.locator('#set-bars');
    await bars.fill('4');
    await bars.blur();

    const note = page.locator('.setting-row:has(#set-bars) .setting-note');
    await expect(note).toHaveText('Saved.');
    await expect(note).toBeVisible();
    expect(await withinViewport(page, '.setting-row:has(#set-bars) .setting-note')).toBe(true);

    // One note at a time, on the row that caused the last one.
    await page.locator('#set-offline-only').check();
    await expect(page.locator('.setting-note')).toHaveCount(1);
    await expect(page.locator('.setting-row:has(#set-offline-only) .setting-note')).toContainText(
      'will not check for updates',
    );
  });

  test('sideways, the note stays inside its own row’s column', async ({ page }) => {
    await page.setViewportSize(SIDEWAYS);
    await page.goto('/#/settings');
    const bars = page.locator('#set-bars');
    await bars.fill('3');
    await bars.blur();

    const row = await page.locator('.setting-row:has(#set-bars)').boundingBox();
    const note = await page.locator('.setting-row:has(#set-bars) .setting-note').boundingBox();
    expect(note).not.toBeNull();
    expect(row).not.toBeNull();
    // Inside the row it belongs to — sideways the rows run in two columns and
    // a note across both belongs to neither.
    expect(note?.x ?? -1).toBeGreaterThanOrEqual(row?.x ?? 0);
    expect((note?.x ?? 0) + (note?.width ?? 0)).toBeLessThanOrEqual(
      (row?.x ?? 0) + (row?.width ?? 0) + 1,
    );
  });
});

test.describe('"Download everything now"', () => {
  test('counts as it goes and can be stopped', async ({ page }) => {
    await page.setViewportSize(UPRIGHT);
    await page.goto('/#/settings');
    await page.locator('#settings-download').scrollIntoViewIfNeeded();
    await page.locator('#settings-download').click();

    // A count, from the first moment: this button used to say nothing at all
    // for as long as 1,256 fetches take.
    await expect(page.locator('#settings-status')).toContainText('Downloading…');
    await expect(page.locator('#settings-download-stop')).toBeVisible();
    await page.locator('#settings-download-stop').click();
    await expect(page.locator('#settings-status')).toContainText('Stopped.', { timeout: 60_000 });
    await expect(page.locator('#settings-download-stop')).toBeHidden();
    await expect(page.locator('#settings-download')).toBeEnabled();
  });

  test('says there is no network rather than counting 1,256 failures', async ({ page, context }) => {
    await page.setViewportSize(UPRIGHT);
    await page.goto('/#/settings');
    await context.setOffline(true);
    try {
      await page.locator('#settings-download').click();
      await expect(page.locator('#settings-status')).toContainText('No network');
    } finally {
      await context.setOffline(false);
    }
  });
});
