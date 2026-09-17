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
 * - **Simon.** One note, then two, then three, until it breaks — and, on the
 *   rung that lights the keys, the chain filling up on a staff as it sounds
 *   and gone again before the learner's turn.
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
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import { noteLabel } from '../../src/engine/drills/types';

/** Where the Simon pictures go, for looking at rather than for asserting on. */
const SIMON_PICTURES = resolve('../build/simon');

/** What the ear card shows when it is not naming a note (`DrillScreen`). */
const EAR_GLYPH = '🎧';

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

/** One reading of the Simon card and the keys under it, taken by the sampler. */
interface CardSample {
  /** What `#drill-ear-card` was showing — the glyph, or a note name. */
  name: string;
  /** The notes lit as *expected* on the strip at that moment. */
  expectedLit: number[];
  /**
   * How many notes were engraved on the play-along staff, or −1 for no staff.
   *
   * The screen publishes the count on the host rather than the test counting
   * noteheads in OSMD's SVG: what is being claimed is "the chain so far", and
   * the chain is data the test already knows.
   */
  staff: number;
}

declare global {
  interface Window {
    __drillTransitions?: Transition[];
    __drillTapOnMiss?: boolean;
    __drillObserver?: MutationObserver;
    __simonSamples?: CardSample[];
    __simonSampler?: number;
  }
}

/**
 * Starts sampling the Simon card and the lit keys.
 *
 * The chain lights one key at a time and names it, and every one of those is a
 * transient: by the time a `toHaveClass` reached the second note the first had
 * gone. So the page records what it was showing, continuously, from before the
 * chain is asked to play — and the assertions read the record. Nothing here
 * asserts how long anything lasted; the claims are about *what* was seen and
 * in what order.
 */
async function watchSimonCard(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.clearInterval(window.__simonSampler);
    window.__simonSamples = [];
    window.__simonSampler = window.setInterval(() => {
      const card = document.querySelector('#drill-ear-card');
      const staff = document.querySelector('#drill-simon-staff');
      window.__simonSamples?.push({
        name: card?.textContent ?? '',
        expectedLit: Array.from(
          document.querySelectorAll('.keyboard-strip .is-expected[data-midi]'),
        ).map((key) => Number((key as HTMLElement).dataset.midi)),
        staff: staff instanceof HTMLElement ? Number(staff.dataset.notes ?? 0) : -1,
      });
    }, 25);
  });
}

/** Everything sampled so far, with the sampler left running. */
async function simonSoFar(page: Page): Promise<CardSample[]> {
  return page.evaluate(() => window.__simonSamples ?? []);
}

/** Stops the sampler and hands back everything it saw. */
async function simonSeen(page: Page): Promise<CardSample[]> {
  return page.evaluate(() => {
    window.clearInterval(window.__simonSampler);
    return window.__simonSamples ?? [];
  });
}

/** Which rung of the help ladder the card is on, as the chips report it. */
async function pressedRung(page: Page): Promise<string> {
  return (
    (await page
      .locator('#drill-simon-help .chip[aria-pressed="true"]')
      .first()
      .getAttribute('data-help')) ?? ''
  );
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
    // The bottom rung of the help ladder, because that is the rung this test's
    // claims are about: no lights, no replay, and a wrong note ends the game.
    // The white-key item opens on the top rung, where the card names each note
    // as it sounds on purpose (`04` §5c-2) — asserting "the card must not name
    // the notes" there would be asserting against the help.
    await page.locator('#drill-simon-help-ear-only').click();
    await expect(page.locator('#drill-simon-help-ear-only')).toHaveAttribute('aria-pressed', 'true');

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

  /** Plays back whatever the card is waiting for, correctly. */
  /**
   * Waits for the card to be ready for an answer, then plays the chain back.
   *
   * Ready means two things the first version of this helper skipped: the new
   * card's chain is the one the drill will judge (`length` notes — it grows
   * by one a card, and the counter says "2 of" a beat before `current` has
   * moved), and the chain has finished playing on the keys, because on the
   * lit rung the keys and the name are still being shown while it sounds.
   */
  async function echoChain(page: Page, midi: MidiMock, length?: number): Promise<number[]> {
    if (length !== undefined) {
      await expect.poll(async () => (await expectedNow(page)).length, { timeout: 15_000 }).toBe(length);
    }
    await expect(page.locator('#drill-ear-card')).toHaveAttribute('data-showing', 'glyph', { timeout: 20_000 });
    await expect(page.locator('#drill-strip .is-expected')).toHaveCount(0, { timeout: 20_000 });
    // The staff goes with the lights, so it is part of "the chain has finished
    // playing" and not a fourth thing to wait for.
    await expect(page.locator('#drill-simon-staff')).toHaveCount(0, { timeout: 20_000 });
    const chain = await expectedNow(page);
    for (const note of chain) {
      await midi.noteOn(note, 90);
      await midi.noteOff(note);
    }
    return chain;
  }

  /**
   * Was each note lit at the moment its own name was on the card?
   *
   * The claim the top rung of the ladder makes is not "a key lit at some
   * point" and not "a name appeared at some point" — it is that the two say
   * the same thing at the same time, which is the whole of what makes the
   * lights teach anything.
   */
  function litWithItsName(seen: CardSample[], note: number): boolean {
    return seen.some(
      (sample) => sample.name === noteLabel(note) && sample.expectedLit.includes(note),
    );
  }

  /**
   * The staff followed the chain and never ran ahead of it, in one walk.
   *
   * What the top rung claims about the staff is that it is the chain *so
   * far* — so at the moment the card is naming the third note, the staff may
   * hold three notes and may hold two (a phone too slow to keep up skips a
   * prefix rather than queueing them, which is the screen's own rule), but it
   * must never hold four. A note it has not played yet is the question
   * written down, and that is the thing this staff must not be.
   *
   * Asserting the stronger "exactly `at + 1` in the same reading as the name"
   * is asserting the machine kept up, which under four workers it sometimes
   * does not. Returns the highest count seen, for the caller to judge.
   */
  function staffFollowedTheChain(seen: CardSample[]): number {
    let named = 0;
    let previous = '';
    let highest = 0;
    for (const sample of seen) {
      const naming = sample.name !== '' && sample.name !== EAR_GLYPH;
      if (naming && sample.name !== previous) named += 1;
      previous = sample.name;
      if (sample.staff < 0) continue;
      highest = Math.max(highest, sample.staff);
      expect(
        sample.staff,
        `the staff held ${String(sample.staff)} notes with ${String(named)} played`,
      ).toBeLessThanOrEqual(named);
    }
    return highest;
  }

  /** Was a staff ever on screen while this was sampled? */
  function everStaffed(seen: CardSample[]): boolean {
    return seen.some((sample) => sample.staff >= 0);
  }

  test('shows the chain on the keys, one at a time, with its name on the card', async ({
    page,
  }) => {
    const midi = await openDrill(page, 'drill.ear.simon-c-major');
    // The rung the catalog chose for the white-key game, on the card without
    // anybody asking for it: this is the item a beginner meets first.
    expect(await pressedRung(page)).toBe('show-keys');

    // Two rounds in, so "one at a time, in order" is a claim about something.
    await echoChain(page, midi, 1);
    await expect(page.locator('#drill-counter')).toContainText('2 of');
    await echoChain(page, midi, 2);
    await expect(page.locator('#drill-counter')).toContainText('3 of');
    await expect.poll(async () => (await expectedNow(page)).length, { timeout: 15_000 }).toBe(3);
    const chain = await expectedNow(page);

    await watchSimonCard(page);
    await page.locator('#drill-replay').click();
    // The recording is complete when every note of the chain has been named.
    await expect
      .poll(
        async () =>
          new Set(
            (await simonSoFar(page)).map((sample) => sample.name).filter((name) => name !== EAR_GLYPH),
          ).size,
        { timeout: 20_000 },
      )
      .toBe(chain.length);
    const seen = await simonSeen(page);

    // Each key lit while its own name was on the card, and landed on the
    // staff in the same moment: sound, key, name and staff position are one
    // fact seen four ways, which is the whole of why the staff is drawn.
    for (const note of chain) {
      expect(litWithItsName(seen, note), `${noteLabel(note)} was never lit under its own name`).toBe(
        true,
      );
    }
    // And the staff followed the chain note for note, never running ahead of
    // it: a note it has not played yet is the question written down.
    const highest = staffFollowedTheChain(seen);
    expect(highest, 'nothing was ever engraved on the staff').toBeGreaterThan(0);
    // It ended full, or it ended gone — the teardown and the last prefix race,
    // and the teardown winning is the staff doing its job, not a failure.
    const staffAtTheEnd = seen[seen.length - 1]?.staff ?? -1;
    expect(
      highest === chain.length || staffAtTheEnd < 0,
      'the staff stopped short of the chain and stayed up',
    ).toBe(true);
    // A sequence, not a chord: never two of them lit at once.
    for (const sample of seen) {
      expect(sample.expectedLit.length, 'the chain lit as a chord').toBeLessThan(2);
    }
    // And in the order they were played, which is the thing being remembered.
    // `toContain` rather than an equality, because the sampler is running from
    // before the click and the card may still have been finishing the play it
    // started on its own: what is claimed is that the whole chain went by in
    // order, not that nothing preceded it.
    const order: number[] = [];
    for (const sample of seen) {
      const note = sample.expectedLit[0];
      if (note !== undefined && order[order.length - 1] !== note) order.push(note);
    }
    expect(order.join(','), 'the chain did not light in order').toContain(chain.join(','));

    // And when the lights go, the staff goes with them. This is the line that
    // keeps it a teaching display rather than a crib: by the time it is the
    // learner's turn the chain is gone from the screen exactly as it always
    // was, so the memory task is untouched (`04` §5c-2).
    await expect(page.locator('#drill-ear-card')).toHaveAttribute('data-showing', 'glyph', {
      timeout: 20_000,
    });
    await expect(page.locator('#drill-simon-staff')).toHaveCount(0);
    await expect(page.locator('#drill-strip .is-expected')).toHaveCount(0);
  });

  /**
   * Watches the same chain under another rung, for as long as it took to be
   * drawn under the rung that draws it.
   *
   * "No staff appeared" is a claim about a stretch of time, and on a rung with
   * no lights the screen publishes nothing to mark the end of a chain — so the
   * stretch is borrowed from the lit rung's own chain, counted in the
   * sampler's readings rather than in milliseconds. Pressing a chip replays
   * the chain by itself, so the sampler goes in before the press.
   */
  async function watchRung(page: Page, rung: string, readings: number): Promise<CardSample[]> {
    await watchSimonCard(page);
    await page.locator(`#drill-simon-help-${rung}`).click();
    await expect(page.locator(`#drill-simon-help-${rung}`)).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(async () => (await simonSoFar(page)).length, { timeout: 30_000 })
      .toBeGreaterThanOrEqual(readings);
    return simonSeen(page);
  }

  test('draws no staff on the rungs that do not light the keys', async ({ page }) => {
    const midi = await openDrill(page, 'drill.ear.simon-c-major');
    // Two notes, so all three rungs are being watched over the same chain of
    // the same game — the only thing that differs is the rung.
    await echoChain(page, midi, 1);
    await expect(page.locator('#drill-counter')).toContainText('2 of');
    await expect.poll(async () => (await expectedNow(page)).length, { timeout: 15_000 }).toBe(2);
    await expect(page.locator('#drill-ear-card')).toHaveAttribute('data-showing', 'glyph', {
      timeout: 20_000,
    });

    // First the rung that does draw one, to find out how long that takes.
    await watchSimonCard(page);
    await page.locator('#drill-replay').click();
    await expect(page.locator('#drill-simon-staff')).toHaveCount(1, { timeout: 20_000 });
    await expect(page.locator('#drill-simon-staff')).toHaveCount(0, { timeout: 20_000 });
    const lit = await simonSeen(page);
    expect(everStaffed(lit), 'the top rung drew no staff to compare against').toBe(true);

    // Sound alone is what the bottom rung says it is: no lights, no names, and
    // now no staff either, for at least as long as the top rung needed one.
    const earOnly = await watchRung(page, 'ear-only', lit.length);
    expect(everStaffed(earOnly), 'the ear-only rung drew a staff').toBe(false);
    expect(earOnly.every((sample) => sample.expectedLit.length === 0)).toBe(true);

    // And the middle rung is ear-first too: nothing while the chain plays.
    // What it does *after a miss* is the next test, and is on purpose.
    const earFirst = await watchRung(page, 'keys-after-miss', lit.length);
    expect(everStaffed(earFirst), 'the ear-first rung drew a staff as it played').toBe(false);
    expect(earFirst.every((sample) => sample.expectedLit.length === 0)).toBe(true);
  });

  test('plays a missed chain back lit, then asks for the same chain again', async ({ page }) => {
    const midi = await openDrill(page, 'drill.ear.simon-chromatic');
    const drill = page.locator('[data-screen="drill"]');
    // The chromatic game is met years later, so it starts ear-first.
    expect(await pressedRung(page)).toBe('keys-after-miss');

    await echoChain(page, midi, 1);
    await expect(page.locator('#drill-counter')).toContainText('2 of');
    await expect.poll(async () => (await expectedNow(page)).length, { timeout: 15_000 }).toBe(2);
    await expect(page.locator('#drill-ear-card')).toHaveAttribute('data-showing', 'glyph', { timeout: 20_000 });
    const chain = await expectedNow(page);

    await watchTransitions(page);
    await watchSimonCard(page);
    const wrong = (chain[0] ?? 60) + 1;
    await midi.noteOn(wrong, 90);
    await midi.noteOff(wrong);

    // The same chain, over the keys, named as it goes.
    await expect
      .poll(
        async () =>
          new Set(
            (await simonSoFar(page)).map((sample) => sample.name).filter((name) => name !== EAR_GLYPH),
          ).size,
        { timeout: 20_000 },
      )
      .toBe(chain.length);
    const seen = await simonSeen(page);
    for (const note of chain) {
      expect(litWithItsName(seen, note), `${noteLabel(note)} was never lit under its own name`).toBe(
        true,
      );
    }
    // The staff goes wherever the lit, named keys go — including here, and on
    // the same terms: it follows the chain and never runs ahead of it. The
    // replay is the same chain in the same three mediums, and it is gone
    // before that chain is asked for again, so it is no more a crib than the
    // lights are (`04` §5c-2).
    expect(
      staffFollowedTheChain(seen),
      'the replay engraved nothing',
    ).toBeGreaterThan(0);

    // The card was held while that happened, and said how to leave it early.
    const record = await transitions(page);
    expect(record.some((t) => t.name === 'data-feedback' && t.value === 'wrong')).toBe(true);
    expect(missMoment(record).statusText).toContain('Tap');

    // And then the *same* chain is asked for again — not one note longer, and
    // not a result sheet: a miss on this rung does not end the game.
    await expect(drill).toHaveAttribute('data-paused', '', { timeout: 20_000 });
    await expect(page.locator('#drill-summary')).toBeHidden();
    await expect(page.locator('#drill-simon-staff')).toHaveCount(0);
    expect(await expectedNow(page)).toEqual(chain);

    // Played right, it grows again.
    await echoChain(page, midi);
    await expect
      .poll(async () => (await expectedNow(page)).length, { timeout: 20_000 })
      .toBe(chain.length + 1);
  });

  test('keeps the card whole on a screen with no room for a staff', async ({ page }) => {
    // A phone held sideways: the drill grid caps the stage and clips what does
    // not fit, and what would be clipped is the row of chips — the controls.
    await page.setViewportSize({ width: 740, height: 342 });
    const midi = await openDrill(page, 'drill.ear.simon-c-major');
    expect(await pressedRung(page)).toBe('show-keys');
    await echoChain(page, midi, 1);
    await expect.poll(async () => (await expectedNow(page)).length, { timeout: 15_000 }).toBe(2);

    await watchSimonCard(page);
    await page.locator('#drill-replay').click();
    // The chain still lights and still names itself — that is the rung, and it
    // is untouched here. It is only the staff that has nowhere to go.
    await expect
      .poll(async () => (await simonSoFar(page)).some((sample) => sample.expectedLit.length > 0), {
        timeout: 20_000,
      })
      .toBe(true);
    await expect(page.locator('#drill-ear-card')).toHaveAttribute('data-showing', 'glyph', {
      timeout: 20_000,
    });
    const seen = await simonSeen(page);
    expect(everStaffed(seen), 'a staff was drawn where there is no room for one').toBe(false);
    expect(seen.some((sample) => sample.name !== EAR_GLYPH)).toBe(true);

    // And the three chips are inside the card, not clipped by the cap. A
    // relationship between two elements, not a number of pixels (`00` §2).
    const stage = await page.locator('#drill-stage').boundingBox();
    const chips = await page.locator('#drill-simon-help').boundingBox();
    expect(stage && chips).toBeTruthy();
    if (!stage || !chips) throw new Error('no card to measure');
    expect(chips.y, 'the chips start above the card').toBeGreaterThanOrEqual(stage.y);
    expect(chips.y + chips.height, 'the chips run past the bottom of the card').toBeLessThanOrEqual(
      stage.y + stage.height,
    );
  });

  /**
   * The card with a chain half drawn on it, to be looked at (`00` §3).
   *
   * Both themes, both shapes, and a long chain as well as a short one — the
   * two places this card can go wrong are the short screen, where the stage is
   * capped and clips what does not fit, and the ninth note, where the run
   * changes note value and a wrapped system would make the card grow. Nothing
   * here asserts anything about the picture; it is taken so a person can open
   * it.
   */
  test.describe('pictures', () => {
    test.describe.configure({ timeout: 300_000 });

    const SHAPES = [
      { name: 'phone-portrait', width: 342, height: 740, scheme: 'light' as const, staff: true, rounds: 4 },
      { name: 'phone-portrait', width: 342, height: 740, scheme: 'dark' as const, staff: true, rounds: 4 },
      // Past the eighth note, where a growing run changes note value.
      { name: 'phone-portrait-long', width: 342, height: 740, scheme: 'light' as const, staff: true, rounds: 9 },
      { name: 'phone-landscape', width: 740, height: 342, scheme: 'dark' as const, staff: false, rounds: 4 },
    ];

    /** How many notes the staff has engraved, or −1 when there is no staff. */
    async function staffNotes(page: Page): Promise<number> {
      return page.evaluate(() => {
        const staff = document.querySelector('#drill-simon-staff');
        return staff instanceof HTMLElement ? Number(staff.dataset.notes ?? 0) : -1;
      });
    }

    for (const shape of SHAPES) {
      test(`the Simon card mid-chain, ${shape.name} ${shape.scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: shape.scheme });
        await page.setViewportSize({ width: shape.width, height: shape.height });
        const midi = await openDrill(page, 'drill.ear.simon-c-major');
        expect(await pressedRung(page)).toBe('show-keys');
        // Rounds echoed until the chain being drawn is long enough to be
        // caught half way through and long enough to be worth looking at.
        for (let round = 1; round <= shape.rounds; round += 1) await echoChain(page, midi, round);
        const chain = shape.rounds + 1;
        await expect
          .poll(async () => (await expectedNow(page)).length, { timeout: 40_000 })
          .toBe(chain);
        await page.locator('#drill-replay').click();
        if (shape.staff) {
          await expect
            .poll(async () => staffNotes(page), { timeout: 40_000 })
            .toBeGreaterThanOrEqual(Math.ceil(chain / 2));
        } else {
          // No staff on a short screen (`04` §5c-2), so mid-chain here is the
          // card naming the note that is sounding — which is what there is to
          // look at, and the picture is taken to show that nothing else moved.
          await expect(page.locator('#drill-ear-card')).toHaveAttribute('data-showing', 'name', {
            timeout: 20_000,
          });
        }
        const file = join(SIMON_PICTURES, `${shape.name}-${shape.scheme}.png`);
        mkdirSync(dirname(file), { recursive: true });
        await page.screenshot({ path: file, animations: 'disabled' });
      });
    }
  });

  test('remembers the rung for that item, and only for that item', async ({ page }) => {
    const drill = page.locator('[data-screen="drill"]');
    await openDrill(page, 'drill.ear.simon-c-major');
    expect(await pressedRung(page)).toBe('show-keys');

    // The chip is not a label: the card's own sentence about how to answer
    // changes with it, because what happens after a wrong note is different.
    const how = page.locator('#drill-how');
    const before = (await how.textContent()) ?? '';
    expect(before.length).toBeGreaterThan(0);
    await page.locator('#drill-simon-help-ear-only').click();
    await expect(page.locator('#drill-simon-help-ear-only')).toHaveAttribute('aria-pressed', 'true');
    await expect(how).not.toHaveText(before);

    await page.reload();
    await expect(drill).toHaveAttribute('data-drill', 'running', { timeout: 30_000 });
    expect(await pressedRung(page)).toBe('ear-only');

    // Per item, not for Simon everywhere: the white-key game is where a
    // beginner needs the lights and the chromatic one is not, so a choice made
    // on one must not follow the learner onto the other.
    await page.goto('/#/drill/drill.ear.simon-chromatic');
    await expect(drill).toHaveAttribute('data-drill', 'running', { timeout: 30_000 });
    expect(await pressedRung(page)).toBe('keys-after-miss');
  });
});
