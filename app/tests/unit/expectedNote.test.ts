// @vitest-environment jsdom
/**
 * Naming the note Wait mode is waiting for (the S25's first run).
 *
 * The app marked the expected key and coloured the notehead and said nothing
 * else, and on the owner's first real run that was not enough: forty seconds
 * of hunting for an F#4 that was on the screen the whole time. The strip is
 * fixed too, but a name is the thing that cannot be misread.
 *
 * **Revised by T41 (class: revise).** Every case below used to hand the line
 * MIDI numbers, and the line named each from a table of sharps — the old
 * assumption was that a note's name is its MIDI number's name. It is not: the
 * key under an E♭ is also the key under a D♯, and a learner in a flat key was
 * told to wait for D♯ where the score says E♭. The line is now handed the
 * notes as the score writes them (`ScoreNote.accidental`), and the cases that
 * were numbers are the same notes with their spelling.
 */
import { describe, expect, it } from 'vitest';
import { waitingForLine } from '../../src/ui/expectedNote';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { allFixtures, edgeFixtures, loadFixture } from './helpers/fixtures';
import type { ScoreModel } from '../../src/score/types';

async function edgeModel(name: string): Promise<ScoreModel> {
  const fixture = edgeFixtures().find((f) => f.name === name);
  if (!fixture) throw new Error(`no edge fixture named "${name}"`);
  return extractScoreModel(await loadFixture(fixture.path), { id: fixture.name });
}

describe('waitingForLine', () => {
  it('names the note that started all this', () => {
    // F#4 is MIDI 66 — the third note of Suo Gân.
    expect(waitingForLine([{ midi: 66, accidental: 'sharp' }])).toBe('Waiting for F♯4');
  });

  it('writes a sharp as a sharp, not as a hash, and a flat as a flat', () => {
    // It is prose on a status line, not an identifier.
    expect(waitingForLine([{ midi: 61, accidental: 'sharp' }])).not.toContain('#');
    expect(waitingForLine([{ midi: 61, accidental: 'sharp' }])).toContain('♯');
    // T41: the key under an E♭ is the key under a D♯, and the score in a flat
    // key writes E♭. The learner is never told a note the page does not show.
    expect(waitingForLine([{ midi: 63, accidental: 'flat' }])).toBe('Waiting for E♭4');
  });

  it('names a chord low to high, which is how a hand reads it', () => {
    expect(waitingForLine([{ midi: 64 }, { midi: 60 }, { midi: 67 }])).toBe(
      'Waiting for C4 + E4 + G4',
    );
  });

  it('says each note once', () => {
    // Both hands landing on the same pitch is one key to press.
    expect(waitingForLine([{ midi: 60 }, { midi: 60 }, { midi: 72 }])).toBe('Waiting for C4 + C5');
  });

  it('says nothing when there is nothing to wait for', () => {
    expect(waitingForLine([])).toBe('');
  });

  it('says natural where the key would have altered the letter', () => {
    // The B♮ in F major, which a teacher names "B natural".
    expect(waitingForLine([{ midi: 71, accidental: 'natural' }])).toBe('Waiting for B♮4');
  });

  it('writes double accidentals as the score has them', () => {
    // The raised seventh of G♯ minor is F double-sharp, on the key of G.
    expect(waitingForLine([{ midi: 67, accidental: 'double-sharp' }])).toBe('Waiting for F𝄪4');
    expect(waitingForLine([{ midi: 45, accidental: 'double-flat' }])).toBe('Waiting for B𝄫2');
  });

  it('keeps the written octave across the break between B and C', () => {
    // B♯3 is the key of middle C, and C♭4 the B below it: the octave belongs
    // to the letter, as the staff position does.
    expect(waitingForLine([{ midi: 60, accidental: 'sharp' }])).toBe('Waiting for B♯3');
    expect(waitingForLine([{ midi: 59, accidental: 'flat' }])).toBe('Waiting for C♭4');
  });

  it('names one key written two ways in one chord both ways, lower letter first', () => {
    expect(
      waitingForLine([
        { midi: 66, accidental: 'flat' },
        { midi: 66, accidental: 'sharp' },
      ]),
    ).toBe('Waiting for F♯4 + G♭4');
  });
});

describe('the spelling comes from the notation (T41)', () => {
  it('the first note of an E♭ major piece is named E♭, not D♯', async () => {
    const model = await edgeModel('fingering-rests');
    const first = model.steps[0]?.notes ?? [];
    expect(first.map((n) => n.accidental)).toEqual(['flat']);
    expect(waitingForLine(first)).toBe('Waiting for E♭4');
  });

  it('every step of the spelling fixture is named as it is written', async () => {
    // F major for a bar, then A major: a flat, a printed natural, a natural the
    // bar carries without reprinting it, an accidental outside the key, then a
    // sharp, a natural against the key's C♯, a double sharp, a double flat,
    // and one key written G♭ in the right hand and F♯ in the left.
    const model = await edgeModel('spelling');
    expect(model.steps.map((step) => waitingForLine(step.notes))).toEqual([
      'Waiting for F3 + B♭4',
      'Waiting for B♮4',
      'Waiting for B♮4',
      'Waiting for E♭5',
      'Waiting for B𝄫2 + C♯5',
      'Waiting for C♮5',
      'Waiting for F𝄪4',
      'Waiting for F♯4 + G♭4',
    ]);
  });

  it('every black key in every fixture carries its written spelling', async () => {
    // So no score the app can open falls back to naming a black key from its
    // MIDI number, which is the sharps table this replaced.
    const unspelled: string[] = [];
    for (const fixture of allFixtures()) {
      const model = extractScoreModel(await loadFixture(fixture.path), { id: fixture.name });
      for (const step of model.steps) {
        for (const note of step.notes) {
          const black = [1, 3, 6, 8, 10].includes(((note.midi % 12) + 12) % 12);
          if (black && note.accidental === undefined) unspelled.push(`${fixture.name} ${note.id}`);
        }
      }
    }
    expect(unspelled).toEqual([]);
  });
});
