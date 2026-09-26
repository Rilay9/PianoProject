/**
 * The demand detectors (C2): one definition of each musical fact vocabulary v0
 * names, read off the score model the engine plays, never off the MusicXML.
 *
 * Each detector is held to three kinds of hand-made phrase: one where the
 * demand is there, one where it is not, and the edge a careless definition
 * gets wrong — a triplet is not an eighth, a quarter tied to an eighth is not a
 * dotted quarter, middle C's ledger line is not the ledger-line skill, a skip
 * is counted on the staff and not in semitones. The generated phrases in
 * `sightReadingPromises.test.ts` exercise the same functions through the real
 * extractor; these fix what the functions mean.
 */
import { describe, expect, it } from 'vitest';
import { DETECTORS, detect, detectAll, keyFifths, melodyLine, range, type DetectorId } from '../../src/demands/detect';
import { line, phrase, type HandNote } from './helpers/phrase';

const present = (id: DetectorId, bars: HandNote[][], time?: string, key?: string): boolean =>
  detect(phrase({ bars, ...(time ? { time } : {}), ...(key ? { key } : {}) }), id).present;

describe('the module', () => {
  it('runs every detector and names each one', () => {
    const model = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'])] });
    const all = detectAll(model);
    expect(Object.keys(all).sort()).toEqual(Object.keys(DETECTORS).sort());
    for (const [id, found] of Object.entries(all)) expect(found.detector).toBe(id);
  });

  it('locates what it finds: the step and the note', () => {
    const model = phrase({ bars: [[{ at: 0, dur: 1, pitch: 'C4' }, { at: 1, dur: 0.5, pitch: 'D4' }, { at: 1.5, dur: 0.5, pitch: 'E4' }, { at: 2, dur: 2, pitch: 'F4' }]] });
    const found = detect(model, 'eighths');
    expect(found.present).toBe(true);
    expect(found.at.map((a) => a.step)).toEqual([1, 2]);
    expect(found.at.map((a) => a.noteId)).toEqual([model.steps[1]?.notes[0]?.id, model.steps[2]?.notes[0]?.id]);
    expect(found.at.every((a) => a.measure === 0 && a.staff === 1)).toBe(true);
  });

  it('never counts a grace note', () => {
    const bars = [[{ at: 0, dur: 0.25, pitch: 'B3', grace: true, staff: 2 as const }, ...line(['C4', 'D4', 'E4', 'F4'])]];
    expect(present('shorterThanQuarter', bars)).toBe(false);
    expect(present('sixteenths', bars)).toBe(false);
    expect(present('bassClef', bars)).toBe(false);
  });
});

describe('clef.bass — notes on the bass staff', () => {
  it('present: a note on the lower staff', () => expect(present('bassClef', [line(['C3', 'D3'], 2, 2)])).toBe(true));
  it('absent: the treble staff only', () => expect(present('bassClef', [line(['C4', 'D4'], 2)])).toBe(false));
  it('boundary: middle C written on the bass staff is on it', () =>
    expect(present('bassClef', [[{ at: 0, dur: 4, pitch: 'C4', staff: 2 }]])).toBe(true));
});

describe('pitch.ledger — a ledger line other than middle C’s', () => {
  it('present: A5 above the treble staff', () => expect(present('ledgerLines', [line(['G5', 'A5'], 2)])).toBe(true));
  it('absent: D4 and G5 hang just outside the treble staff without one', () =>
    expect(present('ledgerLines', [line(['D4', 'G5'], 2)])).toBe(false));
  it('boundary: middle C is the landmark taught first, not the ledger-line skill', () => {
    expect(present('ledgerLines', [line(['C4'], 4)])).toBe(false);
    expect(present('ledgerLines', [[{ at: 0, dur: 4, pitch: 'C4', staff: 2 }]])).toBe(false);
    expect(present('ledgerLines', [line(['B3'], 4)])).toBe(true);
    expect(present('ledgerLines', [[{ at: 0, dur: 4, pitch: 'D4', staff: 2 }]])).toBe(true);
  });
  it('boundary: the bass staff reaches F2 in its space and E2 on a ledger line', () => {
    expect(present('ledgerLines', [line(['F2'], 4, 2)])).toBe(false);
    expect(present('ledgerLines', [line(['E2'], 4, 2)])).toBe(true);
  });
  it('boundary: the written letter decides, not the key: B♯3 sits under middle C, C♭4 on its line', () => {
    expect(present('ledgerLines', [line(['B#3'], 4)])).toBe(true);
    expect(present('ledgerLines', [line(['Cb4'], 4)])).toBe(false);
  });
});

describe('interval.step, interval.skip, interval.leap — counted on the staff', () => {
  it('present: C to D is a step, C to E a skip, C to F a leap', () => {
    expect(present('steps', [line(['C4', 'D4'], 2)])).toBe(true);
    expect(present('skips', [line(['C4', 'E4'], 2)])).toBe(true);
    expect(present('leaps', [line(['C4', 'F4'], 2)])).toBe(true);
  });
  it('absent: a repeated note is none of them', () => {
    const bars = [line(['E4', 'E4', 'E4', 'E4'])];
    expect(present('steps', bars)).toBe(false);
    expect(present('skips', bars)).toBe(false);
    expect(present('leaps', bars)).toBe(false);
  });
  it('absent: steps only have no skip, skips only have no leap', () => {
    expect(present('skips', [line(['C4', 'D4', 'E4', 'D4'])])).toBe(false);
    expect(present('leaps', [line(['C4', 'E4', 'G4', 'E4'])])).toBe(false);
  });
  it('boundary: D♯ to F is a skip on the staff though two semitones; C♯ to D a step though one', () => {
    expect(present('skips', [line(['D#4', 'F4'], 2)])).toBe(true);
    expect(present('steps', [line(['D#4', 'F4'], 2)])).toBe(false);
    expect(present('steps', [line(['C#4', 'D4'], 2)])).toBe(true);
  });
  it('boundary: B to F is a leap (a diminished fifth), and the octave is one', () => {
    expect(present('leaps', [line(['B3', 'F4'], 2)])).toBe(true);
    expect(present('leaps', [line(['C4', 'C5'], 2)])).toBe(true);
  });
  it('boundary: each staff is its own line — a note in each hand is no interval', () => {
    const bars = [[{ at: 0, dur: 4, pitch: 'C4' }, { at: 0, dur: 4, pitch: 'E3', staff: 2 as const }]];
    expect(present('skips', bars)).toBe(false);
    expect(present('leaps', bars)).toBe(false);
  });
  it('boundary: a tied note is one note held, so the interval is to the next note after the tie', () => {
    const bars = [[{ at: 0, pitch: 'C4', tie: [2, 1] }, { at: 3, dur: 1, pitch: 'E4' }]];
    expect(present('skips', bars)).toBe(true);
  });
});

describe('rhythm.eighths — a written eighth, not in a tuplet', () => {
  it('present: two eighths', () =>
    expect(present('eighths', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 0.5, pitch: 'D4' }, { at: 1, dur: 3, pitch: 'E4' }]])).toBe(true));
  it('absent: quarters', () => expect(present('eighths', [line(['C4', 'D4', 'E4', 'F4'])])).toBe(false));
  it('boundary: triplet eighths are triplets, not eighths', () =>
    expect(
      present('eighths', [[...[0, 1 / 3, 2 / 3].map((at, i) => ({ at, dur: 1 / 3, pitch: ['C4', 'D4', 'E4'][i] as string, tuplet: 3 })), { at: 1, dur: 3, pitch: 'F4' }]]),
    ).toBe(false));
  it('boundary: a quarter tied to an eighth prints an eighth', () =>
    expect(present('eighths', [[{ at: 0, pitch: 'C4', tie: [1, 0.5] }, { at: 1.5, dur: 0.5, pitch: 'D4' }, { at: 2, dur: 2, pitch: 'E4' }]])).toBe(true));
});

describe('rhythm.shorter-than-quarter — any note shorter than a quarter', () => {
  it('present: an eighth', () =>
    expect(present('shorterThanQuarter', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 3.5, pitch: 'D4' }]])).toBe(true));
  it('absent: quarters and halves', () => expect(present('shorterThanQuarter', [[...line(['C4', 'D4']), { at: 2, dur: 2, pitch: 'E4' }]])).toBe(false));
  it('boundary: a triplet eighth and the eighth end of a tie both count', () => {
    expect(present('shorterThanQuarter', [[{ at: 0, dur: 1 / 3, pitch: 'C4', tuplet: 3 }, { at: 1 / 3, dur: 1 / 3, pitch: 'D4', tuplet: 3 }, { at: 2 / 3, dur: 1 / 3, pitch: 'E4', tuplet: 3 }, { at: 1, dur: 3, pitch: 'F4' }]])).toBe(true);
    expect(present('shorterThanQuarter', [[{ at: 0, pitch: 'C4', tie: [3, 0.5] }, { at: 3.5, dur: 0.5, pitch: 'D4' }]])).toBe(true);
  });
});

describe('rhythm.sixteenths — a written sixteenth, not in a tuplet', () => {
  it('present', () =>
    expect(present('sixteenths', [[...[0, 0.25, 0.5, 0.75].map((at): HandNote => ({ at, dur: 0.25, pitch: 'C4' })), { at: 1, dur: 3, pitch: 'D4' }]])).toBe(true));
  it('absent: eighths', () =>
    expect(present('sixteenths', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 3.5, pitch: 'D4' }]])).toBe(false));
  it('boundary: a sixteenth-note triplet is not a sixteenth', () =>
    expect(present('sixteenths', [[...[0, 1 / 6, 2 / 6].map((at): HandNote => ({ at, dur: 1 / 6, pitch: 'C4', tuplet: 3 })), { at: 0.5, dur: 3.5, pitch: 'D4' }]])).toBe(false));
});

describe('rhythm.dotted-quarter — a written dotted quarter in simple time', () => {
  it('present', () =>
    expect(present('dottedQuarters', [[{ at: 0, dur: 1.5, pitch: 'C4' }, { at: 1.5, dur: 0.5, pitch: 'D4' }, { at: 2, dur: 2, pitch: 'E4' }]])).toBe(true));
  it('absent: quarters and halves', () => expect(present('dottedQuarters', [[...line(['C4', 'D4']), { at: 2, dur: 2, pitch: 'E4' }]])).toBe(false));
  it('boundary: in 6/8 the dotted quarter is the beat itself', () =>
    expect(present('dottedQuarters', [[{ at: 0, dur: 1.5, pitch: 'C4' }, { at: 1.5, dur: 1.5, pitch: 'D4' }]], '6/8')).toBe(false));
  it('boundary: a quarter tied to an eighth lasts as long and is written as a tie', () =>
    expect(present('dottedQuarters', [[{ at: 0, pitch: 'C4', tie: [1, 0.5] }, { at: 1.5, dur: 0.5, pitch: 'D4' }, { at: 2, dur: 2, pitch: 'E4' }]])).toBe(false));
});

describe('rhythm.ties — a tied note', () => {
  it('present', () => expect(present('ties', [[{ at: 0, pitch: 'C4', tie: [2, 2] }]])).toBe(true));
  it('absent', () => expect(present('ties', [line(['C4', 'D4'], 2)])).toBe(false));
  it('boundary: the same note played twice is not a tie', () => expect(present('ties', [line(['C4', 'C4'], 2)])).toBe(false));
});

describe('rhythm.syncopation — a note of a beat or more off the beat, a rest on the downbeat, a tie off the beat', () => {
  it('present: eighth, quarter, eighth — the quarter on the "and"', () =>
    expect(present('syncopation', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 1, pitch: 'D4' }, { at: 1.5, dur: 0.5, pitch: 'E4' }, { at: 2, dur: 2, pitch: 'F4' }]])).toBe(true));
  it('present: a bar that opens on a rest and then plays', () =>
    expect(present('syncopation', [[{ at: 0.5, dur: 0.5, pitch: 'C4' }, { at: 1, dur: 3, pitch: 'D4' }]])).toBe(true));
  it('present: a tie that starts off the beat', () =>
    expect(present('syncopation', [[{ at: 0, dur: 1.5, pitch: 'C4' }, { at: 1.5, pitch: 'D4', tie: [0.5, 2] }]])).toBe(true));
  it('absent: every note where its length belongs', () =>
    expect(present('syncopation', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 0.5, pitch: 'D4' }, { at: 1, dur: 1, pitch: 'E4' }, { at: 2, dur: 2, pitch: 'F4' }]])).toBe(false));
  it('boundary: a short note off the beat is not syncopation, nor is a dotted quarter from the beat', () => {
    expect(present('syncopation', [[{ at: 0, dur: 1.5, pitch: 'C4' }, { at: 1.5, dur: 0.5, pitch: 'D4' }, { at: 2, dur: 2, pitch: 'E4' }]])).toBe(false);
  });
  it('boundary: a bar the melody rests through is a rest, not syncopation', () =>
    expect(present('syncopation', [line(['C4', 'D4', 'E4', 'F4']), [{ at: 0, dur: 4, pitch: 'C3', staff: 2 }], line(['G4', 'F4', 'E4', 'D4'])])).toBe(false));
  it('boundary: in 6/8 the beat is a dotted quarter — a quarter from the second eighth is off it', () => {
    expect(present('syncopation', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 1, pitch: 'D4' }, { at: 1.5, dur: 1.5, pitch: 'E4' }]], '6/8')).toBe(true);
    expect(present('syncopation', [[{ at: 0, dur: 1, pitch: 'C4' }, { at: 1, dur: 0.5, pitch: 'D4' }, { at: 1.5, dur: 1.5, pitch: 'E4' }]], '6/8')).toBe(false);
  });
});

describe('rhythm.triplets — a written triplet', () => {
  const triplet = (): HandNote[] => [0, 1 / 3, 2 / 3].map((at) => ({ at, dur: 1 / 3, pitch: 'C4', tuplet: 3 }));
  it('present', () => expect(present('triplets', [[...triplet(), { at: 1, dur: 3, pitch: 'D4' }]])).toBe(true));
  it('absent: straight eighths', () =>
    expect(present('triplets', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 3.5, pitch: 'D4' }]])).toBe(false));
  it('boundary: a quintuplet is a tuplet but not a triplet; 6/8 eighths are not triplets', () => {
    expect(present('triplets', [[...[0, 0.2, 0.4, 0.6, 0.8].map((at): HandNote => ({ at, dur: 0.2, pitch: 'C4', tuplet: 5 })), { at: 1, dur: 3, pitch: 'D4' }]])).toBe(false);
    expect(present('triplets', [[...[0, 0.5, 1].map((at): HandNote => ({ at, dur: 0.5, pitch: 'C4' })), { at: 1.5, dur: 1.5, pitch: 'D4' }]], '6/8')).toBe(false);
  });
});

describe('metre.compound — beats of three eighths', () => {
  const bar = [{ at: 0, dur: 1.5, pitch: 'C4' }];
  it('present: 6/8, 9/8, 12/8', () => {
    expect(present('compoundMetre', [bar], '6/8')).toBe(true);
    expect(present('compoundMetre', [bar], '9/8')).toBe(true);
    expect(present('compoundMetre', [bar], '12/8')).toBe(true);
  });
  it('absent: 4/4, 3/4, 2/4', () => {
    expect(present('compoundMetre', [bar], '4/4')).toBe(false);
    expect(present('compoundMetre', [bar], '3/4')).toBe(false);
    expect(present('compoundMetre', [bar], '2/4')).toBe(false);
  });
  it('boundary: 3/8 counts as one compound beat, the generator’s own rule', () =>
    expect(present('compoundMetre', [bar], '3/8')).toBe(true));
});

describe('key.signature — sharps or flats at the start of the line', () => {
  const bars = [line(['G4', 'A4', 'B4', 'C5'])];
  it('present: one sharp, one flat', () => {
    expect(present('keySignature', bars, undefined, 'G major')).toBe(true);
    expect(present('keySignature', bars, undefined, 'F major')).toBe(true);
    expect(keyFifths(phrase({ bars, key: 'Bb major' }))).toBe(-2);
  });
  it('absent: C major, and no key at all', () => {
    expect(present('keySignature', bars, undefined, 'C major')).toBe(false);
    expect(present('keySignature', bars)).toBe(false);
  });
  it('boundary: A minor has none, E minor has one sharp, D minor one flat', () => {
    expect(present('keySignature', bars, undefined, 'A minor')).toBe(false);
    expect(keyFifths(phrase({ bars, key: 'E minor' }))).toBe(1);
    expect(keyFifths(phrase({ bars, key: 'D minor' }))).toBe(-1);
  });
  it('locates the notes the signature alters', () => {
    const found = detect(phrase({ bars: [line(['E4', 'F#4', 'G4', 'A4'])], key: 'G major' }), 'keySignature');
    expect(found.at.map((a) => a.step)).toEqual([1]);
  });
});

describe('pitch.chromatic — a note outside the key signature', () => {
  it('present: F♯ in C major', () => expect(present('chromatic', [line(['E4', 'F#4', 'G4', 'C4'])], undefined, 'C major')).toBe(true));
  it('absent: F♯ in G major is in the key', () => expect(present('chromatic', [line(['E4', 'F#4', 'G4', 'C4'])], undefined, 'G major')).toBe(false));
  it('boundary: B♮ in F major is chromatic; B♭ is not', () => {
    expect(present('chromatic', [line(['A4', 'Bn4', 'C5', 'F4'])], undefined, 'F major')).toBe(true);
    expect(present('chromatic', [line(['A4', 'Bb4', 'C5', 'F4'])], undefined, 'F major')).toBe(false);
  });
  it('boundary: E♯ in C major is chromatic though it is the key of F', () =>
    expect(present('chromatic', [line(['E#4', 'F#4', 'G4', 'C4'])], undefined, 'C major')).toBe(true));
});

describe('range.beyond-position — one hand wider than a five-finger position', () => {
  it('present: C to A in the right hand', () => expect(present('beyondPosition', [line(['C4', 'E4', 'G4', 'A4'])])).toBe(true));
  it('absent: C to G', () => expect(present('beyondPosition', [line(['C4', 'E4', 'G4', 'D4'])])).toBe(false));
  it('boundary: exactly a fifth, with a chromatic note inside it, stays in position', () =>
    expect(present('beyondPosition', [line(['G3', 'C#4', 'D4', 'A3'])])).toBe(false));
  it('boundary: the hands are separate positions — two octaves apart is no shift', () =>
    expect(present('beyondPosition', [[...line(['C4', 'E4', 'G4', 'E4']), ...line(['C3', 'G3', 'E3', 'G3'], 1, 2)]])).toBe(false));
});

describe('texture.hands-together — both hands at once, located where they must be coordinated (C4d, L72)', () => {
  /** The steps the detector locates the opportunity at, and at each the staves of the notes it names. */
  const where = (bars: HandNote[][]): { steps: number[]; staves: number[][] } => {
    const found = detect(phrase({ bars }), 'handsTogether');
    const steps = [...new Set(found.at.map((a) => a.step))].sort((a, b) => a - b);
    return { steps, staves: steps.map((step) => found.at.filter((a) => a.step === step).map((a) => a.staff).sort()) };
  };

  it('present: a note in each hand together', () =>
    expect(present('handsTogether', [[{ at: 0, dur: 4, pitch: 'E4' }, { at: 0, dur: 4, pitch: 'C3', staff: 2 }]])).toBe(true));
  it('present, with nowhere to coordinate: the left hand holds while the right hand, entering after it, moves', () => {
    // Revised (C4d): C2 asserted only `present`, which still holds — both hands
    // sound at once. Under L72 no step asks the hands to be coordinated: the
    // left hand struck alone, and every right-hand note sounds over it held.
    const bars = [[...line(['E4', 'F4', 'G4']).map((n) => ({ ...n, at: n.at + 1 })), { at: 0, dur: 4, pitch: 'C3', staff: 2 as const }]];
    expect(present('handsTogether', bars)).toBe(true);
    expect(where(bars).steps).toEqual([]);
  });
  it('absent: the right hand alone', () => expect(present('handsTogether', [line(['C4', 'D4', 'E4', 'F4'])])).toBe(false));
  it('boundary: hands alternating, never together', () =>
    expect(present('handsTogether', [[{ at: 0, dur: 2, pitch: 'E4' }, { at: 2, dur: 2, pitch: 'C3', staff: 2 }]])).toBe(false));

  it('sustained accompaniment — whole-note roots under a melody: the opportunities are where the root changes with the melody, not every melody note', () => {
    // Bar 1: C4 D4 E4 F4 over C3; bar 2: G4 F4 E4 D4 over G2. Steps 0–3 and 4–7.
    const bars = [
      [...line(['C4', 'D4', 'E4', 'F4']), { at: 0, dur: 4, pitch: 'C3', staff: 2 as const }],
      [...line(['G4', 'F4', 'E4', 'D4']), { at: 0, dur: 4, pitch: 'G2', staff: 2 as const }],
    ];
    expect(where(bars)).toEqual({ steps: [0, 4], staves: [[1, 2], [1, 2]] });
  });

  it('changing coordination — an Alberti left hand under a melody: every left-hand note the melody sounds over, and the melody note struck with one', () => {
    // Bar 1: C5 half, E5 half over C3 G3 E3 G3 C3 G3 E3 G3 in eighths: eight steps.
    const alberti = (at: number, pitch: string): HandNote => ({ at, dur: 0.5, pitch, staff: 2 });
    const bars = [
      [
        { at: 0, dur: 2, pitch: 'C5' },
        { at: 2, dur: 2, pitch: 'E5' },
        ...['C3', 'G3', 'E3', 'G3', 'C3', 'G3', 'E3', 'G3'].map((pitch, i) => alberti(i * 0.5, pitch)),
      ],
    ];
    expect(where(bars)).toEqual({ steps: [0, 1, 2, 3, 4, 5, 6, 7], staves: [[1, 2], [2], [2], [2], [1, 2], [2], [2], [2]] });
  });

  it('the left hand changing under a held right-hand note is an opportunity; the right hand moving over a held left-hand note is not', () => {
    // Bar 1: E4 whole over C3 half then G3 half. Bar 2: C3 whole under E4 F4 G4 E4.
    const bars = [
      [{ at: 0, dur: 4, pitch: 'E4' }, { at: 0, dur: 2, pitch: 'C3', staff: 2 as const }, { at: 2, dur: 2, pitch: 'G3', staff: 2 as const }],
      [...line(['E4', 'F4', 'G4', 'E4']), { at: 0, dur: 4, pitch: 'C3', staff: 2 as const }],
    ];
    // Steps: 0 (E4 + C3), 1 (G3 under E4), 2 (E4 + C3), 3–5 (F4, G4, E4 over C3 held).
    expect(where(bars)).toEqual({ steps: [0, 1, 2], staves: [[1, 2], [2], [1, 2]] });
  });
});

describe('texture.left-hand-pattern — the left hand moves in every bar', () => {
  const rh = line(['C5'], 4);
  it('present', () => expect(present('leftHandPattern', [[...rh, ...line(['C3', 'G3', 'E3', 'G3'], 1, 2)], [...rh, ...line(['B2', 'G3'], 2, 2)]])).toBe(true));
  it('absent: a held note a bar', () => expect(present('leftHandPattern', [[...rh, ...line(['C3'], 4, 2)], [...rh, ...line(['G2'], 4, 2)]])).toBe(false));
  it('boundary: every bar but one is not every bar; no left hand is no pattern', () => {
    expect(present('leftHandPattern', [[...rh, ...line(['C3', 'G3'], 2, 2)], [...rh, ...line(['C3'], 4, 2)]])).toBe(false);
    expect(present('leftHandPattern', [rh, rh])).toBe(false);
  });
  it('boundary: a melody in the left hand alone is reading the bass clef, not a pattern under a tune', () =>
    expect(present('leftHandPattern', [line(['C3', 'D3', 'E3', 'D3'], 1, 2), line(['E3', 'F3', 'G3', 'E3'], 1, 2)])).toBe(false));
});

describe('texture.walking-bass — a quarter on every beat in the left hand', () => {
  const rh = line(['C5'], 4);
  it('present', () => expect(present('walkingBass', [[...rh, ...line(['C3', 'D3', 'E3', 'G3'], 1, 2)], [...rh, ...line(['F2', 'G2', 'A2', 'C3'], 1, 2)]])).toBe(true));
  it('boundary: a walk that stalls on its top note still walks; it never turns back to a note it left', () =>
    expect(present('walkingBass', [[...rh, ...line(['C3', 'E3', 'G3', 'G3'], 1, 2)]])).toBe(true));
  it('absent: halves', () => expect(present('walkingBass', [[...rh, ...line(['C3', 'G3'], 2, 2)]])).toBe(false));
  it('boundary: in 3/4 it is three quarters; one bar short of it is not a walking bass', () => {
    expect(present('walkingBass', [[{ at: 0, dur: 3, pitch: 'C5' }, ...line(['C3', 'D3', 'E3'], 1, 2)]], '3/4')).toBe(true);
    expect(present('walkingBass', [[...rh, ...line(['C3', 'D3', 'E3', 'G3'], 1, 2)], [...rh, ...line(['F2', 'A2'], 2, 2)]])).toBe(false);
  });
  it('boundary: a broken chord in quarters circles back to its fifth and is a pattern, not a walking bass', () => {
    const broken = [[...rh, ...line(['C3', 'G3', 'E3', 'G3'], 1, 2)], [...rh, ...line(['F2', 'C3', 'A2', 'C3'], 1, 2)]];
    expect(present('walkingBass', broken)).toBe(false);
    expect(present('leftHandPattern', broken)).toBe(true);
  });
  it('boundary: quarters in the left hand with nothing over them are a bass line read alone, not the texture', () =>
    expect(present('walkingBass', [line(['C3', 'D3', 'E3', 'G3'], 1, 2), line(['F2', 'G2', 'A2', 'C3'], 1, 2)])).toBe(false));
});

describe('the measurements the promises read', () => {
  it('the melody line is the upper staff when it plays, one note per onset, the top of a chord', () => {
    const model = phrase({ bars: [[{ at: 0, dur: 2, pitch: 'C4' }, { at: 0, dur: 2, pitch: 'E4' }, { at: 2, dur: 2, pitch: 'D4' }, { at: 0, dur: 4, pitch: 'C3', staff: 2 }]] });
    expect(melodyLine(model).map((n) => n.midi)).toEqual([64, 62]);
    expect(range(model)).toEqual([62, 64]);
  });
  it('the melody line is the lower staff when the upper one is silent', () => {
    const model = phrase({ bars: [line(['C3', 'E3', 'G3'], 1, 2)] });
    expect(melodyLine(model).map((n) => n.midi)).toEqual([48, 52, 55]);
    expect(range(model)).toEqual([48, 55]);
  });
});
