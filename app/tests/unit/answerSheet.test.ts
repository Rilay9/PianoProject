/**
 * The staff behind *Show me* (docs/04 §5c): the answer as notation, with a key
 * signature that fits it.
 */
import { describe, expect, it } from 'vitest';
import { answerSheet, fifthsFor } from '../../src/engine/drills/answerSheet';

const B_FLAT_AEOLIAN = [70, 72, 73, 75, 77, 78, 80, 82];
const D_DORIAN = [62, 64, 65, 67, 69, 71, 72, 74];

describe('the key signature that fits the answer', () => {
  it('gives a mode its parent major key, so no accidentals are printed', () => {
    expect(fifthsFor(B_FLAT_AEOLIAN)).toBe(-5);
    expect(fifthsFor(D_DORIAN)).toBe(0);
    expect(fifthsFor([67, 69, 71, 72, 74, 76, 78, 79])).toBe(1);
  });

  it('leaves a plain triad in C', () => {
    expect(fifthsFor([60, 64, 67])).toBe(0);
  });
});

describe('the sheet', () => {
  it('writes an octave scale as eighths in one bar, in its key', () => {
    const xml = answerSheet({ title: 'B♭ aeolian', notes: B_FLAT_AEOLIAN, ordered: true })!;
    expect(xml).toContain('<fifths>-5</fifths>');
    expect((xml.match(/<pitch>/g) ?? []).length).toBe(8);
    expect((xml.match(/<measure /g) ?? []).length).toBe(1);
    expect(xml).toContain('<type>eighth</type>');
    expect(xml).not.toContain('<chord/>');
    expect(xml).not.toContain('<accidental>');
  });

  it('writes a chord as one whole note with chord members', () => {
    const xml = answerSheet({ title: 'C major', notes: [60, 64, 67], ordered: false })!;
    expect((xml.match(/<pitch>/g) ?? []).length).toBe(3);
    expect((xml.match(/<chord\/>/g) ?? []).length).toBe(2);
    expect((xml.match(/<measure /g) ?? []).length).toBe(1);
  });

  it('writes an answer below middle C in the bass clef, on one staff', () => {
    const xml = answerSheet({ title: 'low', notes: [48, 52, 55], ordered: false })!;
    expect(xml).toContain('<sign>F</sign>');
    expect(xml).not.toContain('<staves>');
  });

  it('spreads a two-octave run over bars of quarters', () => {
    const run = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
    const xml = answerSheet({ title: 'C major, two octaves', notes: run, ordered: true })!;
    expect((xml.match(/<pitch>/g) ?? []).length).toBe(run.length);
    expect((xml.match(/<measure /g) ?? []).length).toBe(4);
  });

  it('has nothing to draw for an empty answer', () => {
    expect(answerSheet({ title: 'none', notes: [], ordered: true })).toBeNull();
  });
});
