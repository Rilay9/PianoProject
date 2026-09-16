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
 *
 * And nothing here waits on a transient (`00` §2). A right answer's
 * `data-feedback='correct'` lasts a few hundred milliseconds and a miss's
 * `data-paused='miss'` a couple of seconds; polling for either *after* the
 * notes were sent finds nothing under load. So a `MutationObserver` is
 * installed on the drill element *before* the notes go, records every value
 * the two attributes take (with the page's own clock and a snapshot of what
 * the card was showing at that moment), and the assertions read the record.
 * Where the test has to act *during* the pause — the tap that moves the card
 * on — the observer does the tapping, from inside the page, on seeing it.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { noteLabel } from '../../src/engine/drills/types';

/** One recorded change of `data-feedback` or `data-paused`. */
interface Transition {
  name: 'data-feedback' | 'data-paused';
  value: string;
  /** `performance.now()` in the page when the value was seen. */
  atMs: number;
  /** What the card was showing at that moment. */
  answerShown: boolean;
  statusText: string;
  expectedLit: number[];
  wrongLit: number[];
}

declare global {
  interface Window {
    __drillTransitions?: Transition[];
    __drillTapOnMiss?: boolean;
    __drillObserver?: MutationObserver;
  }
}

/**
 * Starts recording the drill element's feedback and pause states.
 *
 * Installed before the action that causes them, never after. With
 * `tapOnMiss`, the observer taps the card the moment the pause begins — the
 * only way to be sure the tap lands inside a pause, rather than polling from
 * outside for a state that may already have gone.
 */
async function watchTransitions(page: Page, options: { tapOnMiss?: boolean } = {}): Promise<void> {
  await page.evaluate((tapOnMiss) => {
    const drill = document.querySelector('[data-screen="drill"]');
    if (!drill) throw new Error('no drill element to watch');
    // One watcher at a time: a second install replaces the first.
    window.__drillObserver?.disconnect();
    window.__drillTransitions = [];
    window.__drillTapOnMiss = tapOnMiss;
    const lit = (cls: string): number[] =>
      Array.from(document.querySelectorAll(`.keyboard-strip .${cls}[data-midi]`)).map((key) =>
        Number((key as HTMLElement).dataset.midi),
      );
    window.__drillObserver = new MutationObserver((records) => {
      for (const record of records) {
        const name = record.attributeName as 'data-feedback' | 'data-paused' | null;
        if (name !== 'data-feedback' && name !== 'data-paused') continue;
        const value = (record.target as Element).getAttribute(name) ?? '';
        // The screen writes the same value more than once on the way through
        // a card; only a change is a transition. Both attributes are empty on
        // a settled card, which is when the watcher is installed.
        const previous = [...(window.__drillTransitions ?? [])].reverse().find((t) => t.name === name);
        if ((previous?.value ?? '') === value) continue;
        window.__drillTransitions?.push({
          name,
          value,
          atMs: performance.now(),
          answerShown: document.querySelector('#drill-answer') !== null,
          statusText: document.querySelector('#drill-status')?.textContent ?? '',
          expectedLit: lit('is-expected'),
          wrongLit: lit('is-wrong'),
        });
        if (name === 'data-paused' && value === 'miss' && window.__drillTapOnMiss) {
          document
            .querySelector('#drill-stage')
            ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        }
      }
    });
    window.__drillObserver.observe(drill, {
      attributes: true,
      attributeFilter: ['data-feedback', 'data-paused'],
    });
  }, options.tapOnMiss === true);
}

/** Everything recorded since `watchTransitions`. */
async function transitions(page: Page): Promise<Transition[]> {
  return page.evaluate(() => window.__drillTransitions ?? []);
}

/** How long the value `value` of `name` stood, by the page's own clock. */
function heldFor(record: Transition[], name: Transition['name'], value: string): number {
  const from = record.findIndex((t) => t.name === name && t.value === value);
  expect(from, `${name}=${value} was never seen`).toBeGreaterThanOrEqual(0);
  const to = record.slice(from + 1).find((t) => t.name === name && t.value !== value);
  expect(to, `${name}=${value} never ended`).toBeDefined();
  const started = record[from];
  if (!to || !started) throw new Error(`${name}=${value} was not a complete transition`);
  return to.atMs - started.atMs;
}

/** The moment a card was marked wrong and held, as the observer saw it. */
function missMoment(record: Transition[]): Transition {
  const moment = record.find((t) => t.name === 'data-paused' && t.value === 'miss');
  expect(moment, 'the miss never paused the card').toBeDefined();
  return moment as Transition;
}

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

    await watchTransitions(page);
    await playChord(midi, WRONG_CHORD);

    // The pause is over when the screen has moved on by itself: that is the
    // settled state, and the only one it is safe to wait for.
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    await expect(page.locator('#drill-answer')).toHaveCount(0);
    await expect(page.locator('#drill-status')).not.toContainText('Tap');

    // What the observer saw while the card was held: marked wrong, the answer
    // on the staff and on the keys, the played keys in red, and the sentence
    // saying a tap would move it on.
    const record = await transitions(page);
    expect(record.some((t) => t.name === 'data-feedback' && t.value === 'wrong')).toBe(true);
    const held = missMoment(record);
    expect(held.answerShown, 'the answer was not drawn while the card was held').toBe(true);
    expect(held.statusText).toContain('Tap');
    for (const note of wanted) expect(held.expectedLit, `expected ${String(note)}`).toContain(note);
    for (const note of WRONG_CHORD) expect(held.wrongLit, `wrong ${String(note)}`).toContain(note);
  });

  test('a tap moves on sooner than waiting, and a right answer never waits', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    const drill = page.locator('[data-screen="drill"]');

    // A miss left alone: how long the card is held, by the page's own clock,
    // from the moment the observer saw the pause begin to the moment it saw
    // it end.
    await watchTransitions(page);
    await playChord(midi, WRONG_CHORD);
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    const held = heldFor(await transitions(page), 'data-paused', 'miss');

    // The same miss, tapped: the card goes when the learner says it can. The
    // observer taps, on seeing the pause begin — from outside, a tap aimed at
    // a pause that may already be over is a wait on a transient.
    await watchTransitions(page, { tapOnMiss: true });
    await playChord(midi, WRONG_CHORD);
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    const tapped = heldFor(await transitions(page), 'data-paused', 'miss');

    expect(tapped, 'a tap did not move the card on any sooner than waiting').toBeLessThan(held);

    // And a right answer is quicker than either: the drill is about recall
    // speed, and only the miss has anything to read.
    await watchTransitions(page);
    const wanted = await expectedNow(page);
    await playChord(midi, wanted);
    await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    const record = await transitions(page);
    const right = heldFor(record, 'data-feedback', 'correct');
    expect(right, 'a right answer was held as long as a miss').toBeLessThan(held);
    // Nothing to read on a right answer, so nothing was paused and nothing
    // was drawn.
    expect(record.some((t) => t.name === 'data-paused' && t.value === 'miss')).toBe(false);
    expect(record.some((t) => t.answerShown)).toBe(false);
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
    await watchTransitions(page);
    await playChord(midi, first);
    await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
    expect((await transitions(page)).some((t) => t.value === 'correct')).toBe(true);
    await page.locator('#drill-end').click();
    await expect(page.locator('#drill-outcome')).toBeVisible();
    await expect(page.locator('#drill-review')).toHaveCount(0);

    // Now miss one, and keep the set: the offer appears, and the run is in the
    // history exactly once.
    await page.locator('#drill-again').click();
    await expect(drill).toHaveAttribute('data-drill', 'running');
    // The observer taps the held card the moment it is held (see above).
    await watchTransitions(page, { tapOnMiss: true });
    await playChord(midi, WRONG_CHORD);
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 15_000 });
    missMoment(await transitions(page));
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

    const chains: number[][] = [];
    for (let round = 1; round <= 3; round += 1) {
      await expect(page.locator('#drill-counter')).toContainText(`${String(round)} of`);
      const chain = await expectedNow(page);
      expect(chain.length, `round ${String(round)}`).toBe(round);
      if (round > 1) {
        // The chain, not a new draw each round.
        expect(chain.slice(0, round - 1)).toEqual(chains[round - 2]);
      }
      // The card must not name the notes — that would be the answer. The
      // claim is about the name a learner would read (`C4`), not the MIDI
      // number, which is never printed anywhere; and what is there instead
      // is the ear glyph.
      await expect(page.locator('#drill-ear-card')).toBeVisible();
      for (const note of chain) {
        await expect(page.locator('#drill-stage')).not.toContainText(noteLabel(note));
      }
      chains.push(chain);
      await watchTransitions(page);
      for (const note of chain) {
        await midi.noteOn(note, 90);
        await midi.noteOff(note);
      }
      await expect(drill).toHaveAttribute('data-feedback', '', { timeout: 15_000 });
      expect(
        (await transitions(page)).some((t) => t.name === 'data-feedback' && t.value === 'correct'),
        `round ${String(round)} was not marked correct`,
      ).toBe(true);
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
