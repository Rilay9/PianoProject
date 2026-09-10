/**
 * Every drill kind, driven with scripted input (docs/05 §7, P8).
 *
 * The input goes through the MIDI mock rather than the on-screen keys where
 * the answer is a chord: three keys have to be down at once, and tapping them
 * one at a time on a touch strip is a different gesture from playing a chord.
 * The keyboard strip gets its own test, because for a learner with no cable it
 * is the only way in.
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
  // `permission: 'granted'` is the second launch onwards, where the app
  // reconnects the piano on its own (app/services.autoConnectMidi) — which is
  // what makes a drill answerable from the keyboard without visiting Settings.
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

test.describe('the drill screen', () => {
  test('runs a chord drill: right answers score, wrong ones do not', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-kind', 'chord');
    await expect(page.locator('#drill-symbol')).toHaveText('C');
    await expect(page.locator('#drill-counter')).toContainText('1 of 10');

    // C major, correct.
    await playChord(midi, [60, 64, 67]);
    await expect(page.locator('#drill-counter')).toContainText('1 right');
    await expect(page.locator('#drill-symbol')).toHaveText('F');

    // Three wrong notes settle the answer as wrong; the counter names the card
    // you are on, so after two answers that is the third.
    await playChord(midi, [61, 63, 66]);
    await expect(page.locator('#drill-counter')).toContainText('3 of 10 · 1 right');
  });

  test('a note-flash card draws the note on a staff and takes the key', async ({ page }) => {
    const midi = await openDrill(page, 'drill.reading.note-flash-treble-c4-g4');
    const head = page.locator('.staff-card .staff-note');
    await expect(head).toBeVisible();
    await expect(page.locator('.staff-clef')).toHaveText('\u{1D11E}');

    const first = Number(await head.getAttribute('data-midi'));
    expect(first).toBeGreaterThanOrEqual(60);
    expect(first).toBeLessThanOrEqual(67);
    await midi.noteOn(first, 90);
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('a find-key card names a key and takes it in any octave', async ({ page }) => {
    const midi = await openDrill(page, 'drill.reading.find-all-cs');
    const label = await page.locator('#drill-symbol').textContent();
    expect(['C', 'F', 'G']).toContain(label);
    const pitchClass = { C: 0, F: 5, G: 7 }[label as 'C' | 'F' | 'G'];
    // Two octaves below the prompt: the octave is the learner's choice.
    await midi.noteOn(36 + (pitchClass ?? 0), 90);
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('an ear drill plays without naming the answer, and replays on request', async ({ page }) => {
    await openDrill(page, 'drill.ear.interval-2nd-3rd');
    // The card must not print the interval — that would be the answer.
    await expect(page.locator('#drill-ear-card')).toBeVisible();
    await expect(page.locator('#drill-stage')).not.toContainText('3rd');
    await expect(page.locator('#drill-prompt')).toHaveText('Play back the two notes');
    await expect(page.locator('#drill-replay')).toBeVisible();
    await page.locator('#drill-replay').click();
    await expect(page.locator('#drill-replay')).toBeVisible();
  });

  test('the rhythm drill shows a one-line staff and marks the taps it catches', async ({ page }) => {
    await openDrill(page, 'drill.rhythm.quarters-rests');
    const taps = page.locator('.rhythm-row .rhythm-tap');
    await expect(taps.first()).toBeVisible();
    expect(await taps.count()).toBeGreaterThan(2);
    // Pitch is ignored entirely: any key is a tap.
    await expect(page.locator('#drill-prompt')).toHaveText('Tap the rhythm on any key');
    await expect(page.locator('#drill-next')).toHaveText('Done');
  });

  test('the pedal drill shows a lamp that follows CC64 and reports the timing', async ({ page }) => {
    const midi = await openDrill(page, 'drill.pedal.changes');
    const lamp = page.locator('#drill-pedal-lamp');
    await expect(lamp).toHaveAttribute('data-down', 'false');

    await midi.send([0xb0, 64, 127]);
    await expect(lamp).toHaveAttribute('data-down', 'true');
    await expect(lamp).toHaveText('Pedal down');
    await midi.send([0xb0, 64, 0]);
    await expect(lamp).toHaveAttribute('data-down', 'false');

    // The first chord is pedalled into and has no change to score, so the
    // readout says so rather than reporting a miss.
    await expect(page.locator('#drill-pedal-readout')).toContainText('scored from the second');
    await midi.send([0xb0, 64, 127]);
    await playChord(midi, [60, 64, 67]);
    await page.locator('#drill-next').click();

    // Second chord: play it, lift, and drop again — a clean change.
    await playChord(midi, [65, 69, 72]);
    await midi.send([0xb0, 64, 0]);
    await midi.send([0xb0, 64, 127]);
    await page.locator('#drill-next').click();
    await expect(page.locator('#drill-pedal-readout')).toContainText('after the chord');
  });

  test('the dynamics drill meters the two phrases and compares them', async ({ page }) => {
    const midi = await openDrill(page, 'drill.dynamics.p-f');
    await expect(page.locator('#drill-prompt')).toHaveText('Play the phrase piano (soft)');
    for (const pitch of [60, 62, 64, 65]) await midi.noteOn(pitch, 40);
    await page.locator('#drill-next').click();

    await expect(page.locator('#drill-prompt')).toHaveText('Play the phrase forte (loud)');
    for (const pitch of [60, 62, 64, 65]) await midi.noteOn(pitch, 100);
    await expect(page.locator('#meter-soft')).toHaveAttribute('data-velocity', '40');
    await expect(page.locator('#meter-loud')).toHaveAttribute('data-velocity', '100');
    await expect(page.locator('#drill-ratio')).toContainText('2.50×');
    await expect(page.locator('#drill-ratio')).toContainText('enough');
  });

  test('the backing-track drill loops and judges nothing', async ({ page }) => {
    const midi = await openDrill(page, 'drill.improv.loop-i-iv-v');
    await expect(page.locator('#drill-loop-card')).toHaveText('8 bars');
    await midi.noteOn(64, 90);
    await page.locator('#drill-end').click();
    await expect(page.locator('#drill-outcome')).toHaveText('Not passed yet');
    // Nothing to be right about: it records, it does not score (docs/05 §7).
    await expect(page.locator('[data-stat="accuracy"]')).toHaveText('0%');
  });

  test('a call-and-response drill plays a phrase and takes it back in order', async ({ page }) => {
    await openDrill(page, 'drill.technique.five-finger-rh');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-kind', 'call-response');
    // A five-finger walk is built as a call-and-response drill, but
    // `call-response`'s own sentence — "Play it back" — is true of a phrase and
    // useless for a hand position, so the builder says what it means instead
    // (P21 A8, `Drill.promptText`).
    await expect(page.locator('#drill-prompt')).toHaveText(
      'Listen, then play the pattern back with the right hand',
    );
    await expect(page.locator('#drill-replay')).toBeVisible();
  });

  test('the on-screen keys answer a drill, for a learner with no cable', async ({ page }) => {
    await page.goto('/#/drill/drill.reading.note-flash-treble-c4-g4');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running', {
      timeout: 30_000,
    });
    const midi = Number(await page.locator('.staff-note').getAttribute('data-midi'));
    const key = page.locator(`.keyboard-strip [data-midi="${String(midi)}"]`);
    await key.scrollIntoViewIfNeeded();
    await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
    await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('finishing records the run and Progress shows it', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    const drill = page.locator('[data-screen="drill"]');
    for (let card = 1; card <= 10; card += 1) {
      // Wait for the card to actually be this one. The counter advances the
      // instant an answer lands, but the *next* card only appears after the
      // beat of right/wrong feedback — read the symbol during it and you read
      // the previous card, and the drill swallows the notes as a duplicate.
      await expect(drill).toHaveAttribute('data-feedback', '');
      await expect(page.locator('#drill-counter')).toContainText(`${String(card)} of 10`);
      const label = await page.locator('#drill-symbol').textContent();
      const pitches = { C: [60, 64, 67], F: [65, 69, 72], G: [67, 71, 74] }[
        (label ?? 'C') as 'C' | 'F' | 'G'
      ];
      await playChord(midi, pitches ?? [60, 64, 67]);
    }
    await expect(page.locator('#drill-outcome')).toHaveText('Passed', { timeout: 20_000 });
    await expect(page.locator('[data-stat="accuracy"]')).toHaveText('100%');

    await page.goto('/#/progress');
    await expect(page.locator('#progress-history')).toContainText('Chord drill');
    await expect(page.locator('#progress-totals')).toContainText('1 passed');
  });

  test('"Again" starts a fresh set rather than repeating the same cards', async ({ page }) => {
    const midi = await openDrill(page, 'drill.chord.c-f-g');
    await playChord(midi, [61, 63, 66]);
    await page.locator('#drill-end').click();
    await expect(page.locator('#drill-outcome')).toBeVisible();
    await page.locator('#drill-again').click();
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-drill', 'running');
    await expect(page.locator('#drill-counter')).toContainText('1 of 10');
  });

  test('says so plainly when an item has no drill to run', async ({ page }) => {
    await page.goto('/#/drill/song.folk.hot-cross-buns');
    await expect(page.locator('#drill-status')).toContainText('notation');
  });
});

test.describe('sight-reading (docs/05 §8)', () => {
  test('generates notation and opens it on the Score screen in Tempo mode', async ({ page }) => {
    await page.goto('/#/drill/drill.reading.sight-reading-1');
    // A drill screen would be wrong: this one is notation.
    await expect(page).toHaveURL(/#\/score\/drill\.reading\.sight-reading-1/, { timeout: 20_000 });
    await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-screen="score"]')).toHaveAttribute('data-mode', 'tempo');
  });

  test('is different material each time it is opened', async ({ page }) => {
    const svgText = async (): Promise<string> => {
      await expect(page.locator('#score-stage .is-front svg').first()).toBeVisible({ timeout: 60_000 });
      // The whole engraving, not its first four kilobytes.
      //
      // OSMD opens every sheet with the same few thousand characters — the
      // `<defs>`, the stave lines, the clef and the key — so a slice that short
      // is mostly a fingerprint of the *format*, and two different exercises at
      // this level can share it. The claim being made is about the material, so
      // the material is what gets compared.
      return page.locator('#score-stage .is-front svg').first().innerHTML();
    };
    await page.goto('/#/score/drill.reading.sight-reading-2');
    const first = await svgText();
    await page.goto('/#/today');
    // Wait for Today to actually be on screen before going back.
    //
    // `hashchange` fires on a later task, and the Router's listener reads
    // `location.hash` when it runs rather than from the event. Two `goto`s
    // back to back can both land before the first event is dispatched, so the
    // listener sees the *score* hash twice, `setRoute` finds nothing changed,
    // and the screen is never remounted — leaving the first exercise on the
    // stage for the second read. That happened on a two-core CI runner and
    // never on a developer machine, which is the giveaway. A person taps
    // seconds apart; this makes the test navigate the way a person does.
    await expect(page.locator('#today-goal')).toBeVisible();

    // Three more openings, and *not all four the same*, rather than "the
    // second differs from the first".
    //
    // The seed is `Math.random()`, so the material is redrawn every time —
    // but at level 2 the space of four-bar exercises is small enough that two
    // consecutive draws land on the same one occasionally, and this test then
    // failed for the app doing exactly what it should. The claim worth making
    // is that it is not a fixed piece; that is what this asserts, and a
    // regression to a fixed piece fails it every run rather than sometimes.
    const seen = new Set([first]);
    for (let i = 0; i < 3; i += 1) {
      await page.goto('/#/today');
      await expect(page.locator('#today-goal')).toBeVisible();
      await page.goto('/#/score/drill.reading.sight-reading-2');
      seen.add(await svgText());
    }
    expect(seen.size, 'four openings produced the same exercise every time').toBeGreaterThan(1);
  });
});

/**
 * The drill screen on a phone held sideways.
 *
 * 360 px of height leaves the card 328, and the header and the keyboard take
 * 184 — so a stage, a prompt, a hint and four buttons stacked in one column
 * did not fit. The body overflowed silently and the keyboard, painted after
 * it, covered "Play again", "Listen", "Skip" and "End drill": on the tour they
 * were not merely below the fold, they were behind the keys.
 */
test.describe('a drill sideways', () => {
  test.use({ viewport: { width: 780, height: 360 } });

  for (const id of [
    'drill.technique.five-finger-lh',
    'drill.reading.grand-staff-flash',
    'drill.chord.c-f-g',
    'drill.ear.major-minor',
    'drill.theory.roman-numerals',
  ]) {
    test(`${id}: its buttons are on the screen`, async ({ page }) => {
      await page.goto(`/#/drill/${id}`);
      await expect(page.locator('[data-screen="drill"]')).not.toHaveAttribute(
        'data-drill',
        'loading',
        { timeout: 60_000 },
      );
      await page.waitForTimeout(900);

      const where = await page.evaluate(() => {
        const body = document.querySelector('.screen-body')!.getBoundingClientRect();
        const controls = document.getElementById('drill-controls')!.getBoundingClientRect();
        const strip = document.getElementById('drill-strip')!.getBoundingClientRect();
        return {
          below: Math.round(controls.bottom - body.bottom),
          underTheKeys: Math.round(controls.bottom - strip.top),
        };
      });

      expect(where.below, 'the buttons need a scroll to reach').toBeLessThanOrEqual(1);
      expect(where.underTheKeys, 'the keyboard is drawn over the buttons').toBeLessThanOrEqual(0);
    });
  }
});
