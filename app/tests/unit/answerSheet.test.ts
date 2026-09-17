/**
 * The staff behind *Show me* (docs/04 §5c): the answer as notation, with a key
 * signature that fits it.
 */
import { describe, expect, it } from 'vitest';
import {
  answerSheet,
  fifthsFor,
  progressionSheet,
  promptProgression,
  sheetForPrompt,
  splitProgressionLabel,
} from '../../src/engine/drills/answerSheet';

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

/**
 * A chord progression on a staff (docs/04 §5c, 2026-09-16).
 *
 * The owner's ask, on a harmonic-dictation card reading `C:I – C:V7/V – G:V –
 * G:I`: *"Any time you're showing note progressions or chord progressions in
 * these drills, it's useful to show it on the staff … know what chords look
 * like. It's very hard to read chords."* So the claims here are the ones that
 * make that a picture rather than a pile of notes: one bar a chord, in the
 * order they sound; the numeral over the bar it belongs to; two staves only
 * when the chords actually cross middle C; and a key signature chosen from the
 * whole progression rather than from whichever chord happened to be first.
 */
describe('a progression on a staff', () => {
  // I – V7/V – V – I across a modulation, written from C3 up the way the
  // dictation drill builds its chords.
  const MODULATION = [
    [48, 52, 55],
    [50, 54, 57, 60],
    [55, 59, 62],
    [55, 59, 62],
  ];

  it('writes one bar a chord, in the order they are played', () => {
    const xml = progressionSheet({ title: 'x', chords: MODULATION })!;
    expect((xml.match(/<measure /g) ?? []).length).toBe(MODULATION.length);
    // Every note of every chord, and nothing invented.
    expect((xml.match(/<pitch>/g) ?? []).length).toBe(MODULATION.flat().length);
    // A chord is one sounding, not a run: all but the first note *on each
    // staff* carry <chord/>, which is the whole difference between a chord and
    // a bar that is four times too long. On a grand staff the hand that takes
    // the low notes and the hand that takes the high ones each start one.
    const chordMembers = MODULATION.reduce(
      (sum, chord) =>
        sum +
        [chord.filter((m) => m < 60), chord.filter((m) => m >= 60)].reduce(
          (perStaff, notes) => perStaff + Math.max(0, notes.length - 1),
          0,
        ),
      0,
    );
    expect((xml.match(/<chord\/>/g) ?? []).length).toBe(chordMembers);
    expect(xml).toContain('<type>whole</type>');
  });

  it('prints each chord label over its own bar', () => {
    const labels = ['C:I', 'C:V7/V', 'G:V', 'G:I'];
    const xml = progressionSheet({ title: 'x', chords: MODULATION, labels })!;
    for (const label of labels) expect(xml).toContain(`<words>${label}</words>`);
    // In the bars' own order: the numeral has to be over the chord it names or
    // it is worse than no numeral at all.
    const printed = [...xml.matchAll(/<words>(.*?)<\/words>/g)].map((match) => match[1]);
    expect(printed).toEqual(labels);
  });

  it('says nothing rather than something off by one when the labels do not fit', () => {
    const xml = progressionSheet({ title: 'x', chords: MODULATION, labels: ['I', 'V'] })!;
    expect(xml).not.toContain('<words>');
  });

  it('opens a second staff when the chords cross middle C, and splits there', () => {
    const xml = progressionSheet({ title: 'x', chords: MODULATION })!;
    expect(xml).toContain('<staves>2</staves>');
    // The split is middle C: nothing below it is on the treble staff and
    // nothing at or above it is on the bass staff. Read out of the file rather
    // than assumed — each <note> block carries its own <staff>.
    for (const note of xml.split('<note>').slice(1)) {
      const staff = /<staff>(\d)<\/staff>/.exec(note)?.[1];
      const octave = /<octave>(\d+)<\/octave>/.exec(note)?.[1];
      if (octave === undefined) continue; // a rest holding an empty staff's bar
      const step = /<step>([A-G])<\/step>/.exec(note)?.[1] ?? 'C';
      const atOrAboveMiddleC = Number(octave) >= 5 || (Number(octave) === 4 && step >= 'C');
      expect(staff, `${step}${octave}`).toBe(atOrAboveMiddleC ? '1' : '2');
    }
  });

  it('stays on one staff when the whole progression is under middle C', () => {
    // A grand staff here is a treble stave holding four whole rests, and the
    // empty half is then the loudest thing on the card.
    const low = [
      [48, 52, 55],
      [53, 57, 48],
      [43, 47, 50],
    ];
    const xml = progressionSheet({ title: 'x', chords: low })!;
    expect(xml).not.toContain('<staves>');
    expect(xml).toContain('<sign>F</sign>');
  });

  it('keeps every staff bar full, so the two do not drift apart', () => {
    // Two of these bars have nothing under middle C. Without a rest holding
    // that staff's bar the <backup> lands in the wrong place and the second
    // chord of the bass staff is written over the first.
    const xml = progressionSheet({
      title: 'x',
      chords: [
        [55, 59, 62, 65],
        [57, 60, 64],
        [67, 71, 74],
      ],
    })!;
    expect(xml).toContain('<staves>2</staves>');
    expect((xml.match(/<rest\/>/g) ?? []).length).toBeGreaterThan(0);
    // One backup a bar: the writer goes back exactly once, from staff 1 to
    // staff 2, and every bar it writes has both.
    expect((xml.match(/<backup>/g) ?? []).length).toBe(3);
  });

  it('takes its key signature from the whole progression, not from bar one', () => {
    // ii–V–I in B♭ major; the first bar alone would print no flats at all.
    const inBFlat = [
      [48, 51, 55, 58],
      [53, 57, 60, 63],
      [58, 62, 65],
    ];
    expect(fifthsFor(inBFlat.flat())).toBe(-2);
    expect(progressionSheet({ title: 'x', chords: inBFlat })!).toContain('<fifths>-2</fifths>');
  });

  it('has nothing to draw for no chords at all', () => {
    expect(progressionSheet({ title: 'x', chords: [] })).toBeNull();
    expect(progressionSheet({ title: 'x', chords: [[]] })).toBeNull();
  });
});

describe('which sheet a prompt wants', () => {
  const progression = {
    label: 'I-vi-IV-V',
    expected: [48, 52, 55, 45, 48, 52, 53, 57, 60, 55, 59, 62],
    ordered: true,
    playback: [
      { midi: [48, 52, 55], atMs: 0 },
      { midi: [45, 48, 52], atMs: 800 },
      { midi: [53, 57, 60], atMs: 1600 },
      { midi: [55, 59, 62], atMs: 2400 },
    ],
  };

  it('reads a progression out of a prompt whose playback is chords', () => {
    const read = promptProgression(progression);
    expect(read).not.toBeNull();
    expect(read?.chords).toEqual(progression.playback.map((step) => step.midi));
    expect(read?.labels).toEqual(['I', 'vi', 'IV', 'V']);
  });

  it('does not read one out of a tune or out of a single chord', () => {
    // Several sounds, but never more than one note at a time: a melody the ear
    // drills play back, which draws correctly as a run and wrongly as bars.
    const tune = {
      label: 'Phrase 1 of 2',
      expected: [60, 62, 64, 65],
      ordered: true,
      playback: [60, 62, 64, 65].map((midi, i) => ({ midi: [midi], atMs: i * 300 })),
    };
    expect(promptProgression(tune)).toBeNull();
    expect(
      promptProgression({
        label: 'C',
        expected: [60, 64, 67],
        playback: [{ midi: [60, 64, 67], atMs: 0 }],
      }),
    ).toBeNull();
  });

  it('splits the two label shapes the drills write, and nothing else', () => {
    expect(splitProgressionLabel('C:I – C:V7/V – G:V – G:I', 4)).toEqual([
      'C:I',
      'C:V7/V',
      'G:V',
      'G:I',
    ]);
    expect(splitProgressionLabel('ii-V-I', 3)).toEqual(['ii', 'V', 'I']);
    // A cadence is named, not spelled out, so there is nothing to put over the
    // bars and it says so.
    expect(splitProgressionLabel('authentic', 2)).toEqual([]);
  });

  it('draws a progression as bars and leaves everything else exactly as it was', () => {
    const bars = sheetForPrompt(progression)!;
    expect((bars.match(/<measure /g) ?? []).length).toBe(4);
    expect(bars).toContain('<words>vi</words>');

    expect(sheetForPrompt({ label: 'C', expected: [60, 64, 67] })).toBe(
      answerSheet({ title: 'C', notes: [60, 64, 67], ordered: false }),
    );
    expect(sheetForPrompt({ label: 'D dorian', expected: D_DORIAN, ordered: true })).toBe(
      answerSheet({ title: 'D dorian', notes: D_DORIAN, ordered: true }),
    );
  });
});
