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
    // "No accidentals" is a claim about spelling, and the writer spells with
    // `<alter>`, never `<accidental>` — so the old `not.toContain('<accidental>')`
    // could not fail. What five flats mean: nothing is sharpened, and every
    // black key in the scale is written as a flat — one `<alter>-1</alter>`
    // per black key, counted from the notes rather than typed.
    expect(xml).not.toContain('<alter>1</alter>');
    const blackKeys = B_FLAT_AEOLIAN.filter((midi) => [1, 3, 6, 8, 10].includes(midi % 12)).length;
    expect(blackKeys).toBeGreaterThan(0);
    expect((xml.match(/<alter>-1<\/alter>/g) ?? []).length).toBe(blackKeys);
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

/**
 * A staff drawn again and again as a run grows (Simon's play-along staff,
 * docs/04 §5c-2).
 *
 * The claim is not about any one of these sheets: it is that the *sequence* of
 * them is one staff filling up, which it only is if everything but the notes
 * stays put. So each prefix is checked against the finished run's signature,
 * clef and note value rather than against its own.
 */
describe('a run drawn as it grows', () => {
  // The sixth note is the one below middle C and the third is the black key:
  // drawn on their own, the first two notes would be in C and in the treble.
  const CHAIN = [64, 67, 70, 72, 65, 55];

  it('keeps the key signature the finished run needs from the first note', () => {
    const alone = answerSheet({ title: 'first', notes: CHAIN.slice(0, 1), ordered: true })!;
    expect(alone).toContain('<fifths>0</fifths>');
    const whole = answerSheet({ title: 'whole', notes: CHAIN, ordered: true })!;
    const growing = answerSheet({
      title: 'first',
      notes: CHAIN.slice(0, 1),
      ordered: true,
      wholeRun: CHAIN,
    })!;
    const fifths = /<fifths>(-?\d+)<\/fifths>/.exec(whole)?.[1];
    expect(fifths).toBeDefined();
    expect(growing).toContain(`<fifths>${String(fifths)}</fifths>`);
    expect(fifths).not.toBe('0');
  });

  it('keeps the clef the finished run needs, before the run goes low', () => {
    const growing = answerSheet({
      title: 'first',
      notes: CHAIN.slice(0, 2),
      ordered: true,
      wholeRun: CHAIN,
    })!;
    // Every note so far is above middle C, and the run still ends below it.
    expect(Math.min(...CHAIN.slice(0, 2))).toBeGreaterThan(60);
    expect(Math.min(...CHAIN)).toBeLessThan(60);
    expect(growing).toContain('<sign>F</sign>');
  });

  it('keeps the note value the finished run needs, past the eighth note', () => {
    const long = Array.from({ length: 11 }, (_, at) => 60 + at);
    const growing = answerSheet({
      title: 'so far',
      notes: long.slice(0, 3),
      ordered: true,
      wholeRun: long,
    })!;
    // On its own a three-note run is eighths; as the start of an eleven-note
    // one it is the value that run is in, so nothing already drawn moves when
    // the run passes eight.
    expect(answerSheet({ title: 'so far', notes: long.slice(0, 3), ordered: true })!).toContain(
      '<type>eighth</type>',
    );
    expect(growing).not.toContain('<type>eighth</type>');
    expect(growing).toContain('<type>16th</type>');
  });

  it('stays on one bar however long the growing run gets', () => {
    // The host it is drawn into is the width of a phone card, and bars past
    // the first wrap onto a second line there — which would make the card
    // taller half way through a chain. So a growing run past eight notes is
    // written in sixteenths, sixteen of which are one bar, rather than spread
    // over bars of quarters the way a run drawn once is.
    for (let length = 1; length <= 16; length += 1) {
      const run = Array.from({ length }, (_, at) => 60 + at);
      for (let count = 1; count <= length; count += 1) {
        const xml = answerSheet({
          title: 'so far',
          notes: run.slice(0, count),
          ordered: true,
          wholeRun: run,
        })!;
        expect((xml.match(/<measure /g) ?? []).length, `${String(count)} of ${String(length)}`).toBe(
          1,
        );
      }
    }
    // And the run drawn once is unchanged: a two-octave scale still spreads.
    const twoOctaves = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
    expect(
      (answerSheet({ title: 'C major', notes: twoOctaves, ordered: true })!.match(/<measure /g) ?? [])
        .length,
    ).toBeGreaterThan(1);
  });

  it('draws only the notes so far, one more each time', () => {
    for (let count = 1; count <= CHAIN.length; count += 1) {
      const xml = answerSheet({
        title: 'so far',
        notes: CHAIN.slice(0, count),
        ordered: true,
        wholeRun: CHAIN,
      })!;
      expect((xml.match(/<pitch>/g) ?? []).length, `${String(count)} notes`).toBe(count);
    }
  });

  it('is the plain sheet again when the run given is the whole of it', () => {
    const plain = answerSheet({ title: 'x', notes: CHAIN, ordered: true });
    const explicit = answerSheet({ title: 'x', notes: CHAIN, ordered: true, wholeRun: CHAIN });
    expect(explicit).toBe(plain);
  });
});
