/**
 * What a drill does with an answer that was not right (docs/04 §5c).
 *
 * Three things that did not exist, driven through the real screen:
 *
 * - **A miss pauses.** The card stays, with the keys that were played in red,
 *   the keys that were wanted lit and the answer on a staff — and a tap moves
 *   on sooner, so nobody who has already seen it is made to wait.
 * - **Going over the ones you missed.** A second round built from exactly those
 *   prompts, shown from the start, counting nothing.
 * - **Simon.** One note, then two, then three, until it breaks.
 *
 * No duration is asserted anywhere here, and no pixel. Where the claim is
 * about time it is made as a *comparison* between two waits this test itself
 * measured — a tapped pause is shorter than one left alone, a right answer is
 * quicker than a miss — which is the claim, and which survives a slow runner.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.clear();
    }
  });
});

/** Opens a drill and waits for its first card. */
async function openDrill(page: Page, id: string): Promise<MidiMock> {
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.goto(`/#/drill/${id}`);
  await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
    timeout: 30_000,
  });
  return midi;
}

async function playChord(midi: MidiMock, pitches: number[]): Promise<void> {
  for (const pitch of pitches) await midi.noteOn(pitch, 90);
  for (const pitch of pitches) await midi.noteOff(pitch);
}

/** What the card on screen is waiting for, as the screen publishes it. */
async function expectedNow(page: Page): Promise<number[]> {
  const raw = (await page.locator('[data-screen="drill"]').getAttribute('data-expects')) ?? '';
  return raw
    .split(',')
    .filter(Boolean)
    .map((value) => Number(value));
}

/** The chord this card wants, and one that is certainly not it. */
const WRONG_CHORD = [61, 63, 66];

test.describe('a miss keeps the card up', () => {
  test('shows the answer on the keys and on a staff, and holds it there', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    const drill = page.locator('[data-screen="drill"]');
    const wanted = await expectedNow(page);
    expect(wanted.length).toBeGreaterThan(0);

    await playChord(midi, WRONG_CHORD);

    // The card is still here, and it is saying what the answer was.
    await expect(drill).toHaveAttribute('data-paused', 'miss');
    await expect(drill).toHaveAttribute('data-feedback', 'wrong');
    await expect(page.locator('#drill-answer')).toBeVisible();
    await expect(page.locator('#drill-status')).toContainText('Tap');
    for (const note of wanted) {
      await expect(page.locator(`.keyboard-strip [data-midi="${String(note)}"]`)).toHaveClass(
        /is-expected/,
      );
    }
    for (const note of WRONG_CHORD) {
      await expect(page.locator(`.keyboard-strip [data-midi="${String(note)}"]`)).toHaveClass(
        /is-wrong/,
      );
    }

    // And then it moves on by itself, with nothing left behind.
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    await expect(page.locator('#drill-answer')).toHaveCount(0);
    await expect(page.locator('#drill-status')).not.toContainText('Tap');
  });

  test('a tap moves on sooner than waiting, and a right answer never waits', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    const drill = page.locator('[data-screen="drill"]');

    // A miss left alone: how long the card is held.
    const heldFrom = Date.now();
    await playChord(midi, WRONG_CHORD);
    await expect(drill).toHaveAttribute('data-paused', 'miss');
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    const held = Date.now() - heldFrom;

    // The same miss, tapped: the card goes when the learner says it can.
    await expect(drill).toHaveAttribute('data-feedback', '');
    const tappedFrom = Date.now();
    await playChord(midi, WRONG_CHORD);
    await expect(drill).toHaveAttribute('data-paused', 'miss');
    await page.locator('#drill-stage').click();
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    const tapped = Date.now() - tappedFrom;

    expect(tapped, 'a tap did not move the card on any sooner than waiting').toBeLessThan(held);

    // And a right answer is quicker than either: the drill is about recall
    // speed, and only the miss has anything to read.
    await expect(drill).toHaveAttribute('data-feedback', '');
    const wanted = await expectedNow(page);
    const rightFrom = Date.now();
    await playChord(midi, wanted);
    await expect(drill).toHaveAttribute('data-feedback', 'correct');
    await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    const right = Date.now() - rightFrom;
    expect(right, 'a right answer was held as long as a miss').toBeLessThan(held);
    // Nothing to read on a right answer, so nothing was drawn.
    await expect(page.locator('#drill-answer')).toHaveCount(0);
  });
});

test.describe('going over the ones you missed', () => {
  test('is offered only when something was missed, and counts nothing', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    const drill = page.locator('[data-screen="drill"]');

    // One right answer, then stop: nothing was missed, so there is nothing to
    // go over and no button offering to.
    const first = await expectedNow(page);
    await playChord(midi, first);
    await expect(drill).toHaveAttribute('data-feedback', '');
    await page.locator('#drill-end').click();
    await expect(page.locator('#drill-outcome')).toBeVisible();
    await expect(page.locator('#drill-review')).toHaveCount(0);

    // Now miss one, and keep the set: the offer appears, and the run is in the
    // history exactly once.
    await page.locator('#drill-again').click();
    await expect(drill).toHaveAttribute('data-drill', 'running');
    await playChord(midi, WRONG_CHORD);
    await expect(drill).toHaveAttribute('data-paused', 'miss');
    await page.locator('#drill-stage').click();
    await expect(drill).toHaveAttribute('data-paused', '');
    await page.locator('#drill-end').click();
    await page.locator('#drill-keep').click();
    const review = page.locator('#drill-review');
    await expect(review).toBeVisible();
    await expect(review).toContainText('Go over');

    // The second round: the answer is on the staff and on the keys before a
    // note is played, and the counter says what this round is.
    await review.click();
    await expect(drill).toHaveAttribute('data-review', 'going-over');
    await expect(page.locator('#drill-counter')).toContainText('to go over');
    await expect(page.locator('#drill-counter')).not.toContainText('right');
    await expect(page.locator('#drill-answer')).toBeVisible();
    const wanted = await expectedNow(page);
    expect(wanted.length).toBeGreaterThan(0);
    for (const note of wanted) {
      await expect(page.locator(`.keyboard-strip [data-midi="${String(note)}"]`)).toHaveClass(
        /is-expected/,
      );
    }

    // Play it right: the round ends with its own small line, and it does not
    // claim to have scored anything.
    await playChord(midi, wanted);
    const went = page.locator('#drill-review-result');
    await expect(went).toBeVisible({ timeout: 15_000 });
    await expect(went).toContainText('Went over');
    await expect(went).toContainText('unchanged');
    await expect(page.locator('#drill-outcome')).toHaveCount(0);

    // And the history still holds the one run that was kept, not two.
    await page.goto('/#/progress');
    await expect(page.locator('#progress-history')).toContainText('Chord drill');
    expect(
      await page.locator('#progress-history [data-item="drill.chord.c-f-g"]').count(),
      'the going-over recorded a run of its own',
    ).toBe(1);
  });
});

test.describe('Simon', () => {
  test('grows by one note a round, and ends on the note that breaks it', async ({ page }) => {
    const midi = await openDrill(page, 'drill.ear.simon-c-major');
    const drill = page.locator('[data-screen="drill"]');
    await expect(drill).toHaveAttribute('data-kind', 'simon');
    // The card must not name the notes — that would be the answer.
    await expect(page.locator('#drill-ear-card')).toBeVisible();

    const chains: number[][] = [];
    for (let round = 1; round <= 3; round += 1) {
      await expect(page.locator('#drill-counter')).toContainText(`${String(round)} of`);
      const chain = await expectedNow(page);
      expect(chain.length, `round ${String(round)}`).toBe(round);
      if (round > 1) {
        // The chain, not a new draw each round.
        expect(chain.slice(0, round - 1)).toEqual(chains[round - 2]);
      }
      await expect(page.locator('#drill-stage')).not.toContainText(String(chain[0] ?? 0));
      chains.push(chain);
      for (const note of chain) {
        await midi.noteOn(note, 90);
        await midi.noteOff(note);
      }
      await expect(drill).toHaveAttribute('data-feedback', 'correct');
      await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    }

    // A wrong note, and the game is over there and then.
    const fourth = await expectedNow(page);
    await midi.noteOn((fourth[0] ?? 60) + 1, 90);
    const chainLine = page.locator('#drill-chain');
    await expect(chainLine).toBeVisible({ timeout: 15_000 });
    // Three rounds went back correctly, so the longest chain is three, and a
    // first game is also the best game.
    await expect(chainLine).toHaveAttribute('data-chain', String(chains.length));
    await expect(chainLine).toHaveAttribute('data-best', String(chains.length));
    await expect(chainLine).toContainText('Longest chain');
    await expect(page.locator('[data-stat="answered"]')).toContainText(String(chains.length));
  });
});
