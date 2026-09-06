/**
 * The seven drill kinds P12b adds, driven with scripted input (`05` §7).
 *
 * One test per kind, and each one plays the right answer rather than checking
 * that a screen appeared: a drill kind that renders and cannot be answered is
 * the failure mode these are for. Input goes through the MIDI mock because
 * most of these answers are chords, and tapping a chord one key at a time on
 * the touch strip is a different gesture from playing one.
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

async function playSequence(midi: MidiMock, pitches: number[]): Promise<void> {
  for (const pitch of pitches) {
    await midi.noteOn(pitch, 90);
    await midi.noteOff(pitch);
  }
}

/** The pitches the card is waiting for, read off the screen. */
async function expected(page: Page): Promise<number[]> {
  const text = await page.locator('[data-screen="drill"]').getAttribute('data-expects');
  return (text ?? '').split(',').filter(Boolean).map(Number);
}

test.describe('the harmony and ear drills', () => {
  test('mode: names a mode and takes the scale, in order', async ({ page }) => {
    const midi = await openDrill(page, 'drill.theory.modes');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-kind', 'mode');
    // The label is a root and a mode name, which is the whole prompt.
    await expect(page.locator('#drill-symbol')).toHaveText(/^[A-G][♭♯]? [a-z]+$/);
    await playSequence(midi, await expected(page));
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('chord-scale: shows a chord and takes the scale that fits it', async ({ page }) => {
    const midi = await openDrill(page, 'drill.jazz.chord-scale');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-kind', 'chord-scale');
    await playSequence(midi, await expected(page));
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('extended-chord: takes every note of a ninth', async ({ page }) => {
    const midi = await openDrill(page, 'drill.jazz.extended-chords');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute(
      'data-kind',
      'extended-chord',
    );
    const pitches = await expected(page);
    expect(pitches.length).toBeGreaterThanOrEqual(5);
    await playChord(midi, pitches);
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('roman-numeral: names the key it is asking in', async ({ page }) => {
    const midi = await openDrill(page, 'drill.theory.roman-numerals');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute(
      'data-kind',
      'roman-numeral',
    );
    await expect(page.locator('#drill-hint')).toContainText('in ');
    await playChord(midi, await expected(page));
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('transposition: prints four bars and wants them somewhere else', async ({ page }) => {
    const midi = await openDrill(page, 'drill.reading.transposition');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute(
      'data-kind',
      'transposition',
    );
    // The prompt is a score, not a label.
    await expect(page.locator('#drill-notation svg')).toBeVisible({ timeout: 30_000 });
    await playSequence(midi, await expected(page));
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('ear-tune: plays the tune, then takes it back a phrase at a time', async ({ page }) => {
    const midi = await openDrill(page, 'drill.ear.tune');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute('data-kind', 'ear-tune');
    await expect(page.locator('#drill-counter')).toContainText('1 of 2');
    await playSequence(midi, await expected(page));
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });

  test('harmonic-dictation: hears a progression back as chords', async ({ page }) => {
    const midi = await openDrill(page, 'drill.theory.harmonic-dictation');
    await expect(page.locator('[data-screen="drill"]')).toHaveAttribute(
      'data-kind',
      'harmonic-dictation',
    );
    // The card's expectation is every note of every chord; the drill decides
    // where one chord ends by the gaps between them, which `playChord` makes
    // by releasing each chord before the next.
    const pitches = await expected(page);
    expect(pitches.length).toBeGreaterThanOrEqual(9);
    for (let at = 0; at < pitches.length; at += 3) {
      await playChord(midi, pitches.slice(at, at + 3));
      // Longer than CHORD_BOUNDARY_MS, so each chord closes before the next.
      await page.waitForTimeout(250);
    }
    // Dictation is one long answer, so the learner says when it is finished —
    // the same as a rhythm row or a pedal change.
    await page.locator('#drill-next').click();
    await expect(page.locator('#drill-counter')).toContainText('1 right');
  });
});
