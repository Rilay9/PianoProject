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
  it('present: a bar that opens on a rest and then plays, after a bar the melody sounded in', () =>
    expect(present('syncopation', [line(['C4', 'D4', 'E4', 'F4']), [{ at: 0.5, dur: 0.5, pitch: 'C4' }, { at: 1, dur: 3, pitch: 'D4' }]])).toBe(true));
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

describe('rhythm.syncopation and the pickup — the silence must follow a note (the 2026-10-07 ruling)', () => {
  const sync = (bars: HandNote[][], pickup?: number, time?: string) =>
    detect(phrase({ bars, ...(pickup === undefined ? {} : { pickup }), ...(time ? { time } : {}) }), 'syncopation');
  const plain = [line(['C5', 'D5', 'E5', 'F5']), line(['G5', 'F5', 'E5', 'D5'])];
  it('a quarter-note pickup into on-beat bars is not syncopation', () =>
    expect(sync([[{ at: 0, dur: 1, pitch: 'G4' }], ...plain], 1).present).toBe(false));
  it('an eighth-note pickup into on-beat bars is not syncopation', () =>
    expect(sync([[{ at: 0, dur: 0.5, pitch: 'G4' }], ...plain], 0.5).present).toBe(false));
  it('a three-eighth pickup in 3/4 is not syncopation', () =>
    expect(
      sync([[{ at: 0, dur: 0.5, pitch: 'E4' }, { at: 0.5, dur: 0.5, pitch: 'F4' }, { at: 1, dur: 0.5, pitch: 'G4' }], line(['C5', 'D5', 'E5']), line(['F5', 'E5', 'D5'])], 1.5, '3/4').present,
    ).toBe(false));
  it('a first bar that opens on a written rest is a late entry, not syncopation: nothing sounded before it', () =>
    expect(sync([[{ at: 1, dur: 1, pitch: 'C5' }, { at: 2, dur: 1, pitch: 'D5' }, { at: 3, dur: 1, pitch: 'E5' }], line(['F5', 'E5', 'D5', 'C5'])]).present).toBe(false));
  it('a bar opening on a rest after a bar the melody rested through is not syncopation: the silence goes on', () =>
    expect(
      sync([line(['C5', 'D5', 'E5', 'F5']), [{ at: 0, dur: 4, pitch: 'C3', staff: 2 }], [{ at: 1, dur: 1, pitch: 'G5' }, { at: 2, dur: 2, pitch: 'F5' }]]).present,
    ).toBe(false));
  it('a pickup followed by real syncopation is syncopation, located in the bar after the pickup and never at the pickup', () => {
    const found = sync([[{ at: 0, dur: 1, pitch: 'G4' }], [{ at: 0, dur: 0.5, pitch: 'C5' }, { at: 0.5, dur: 1, pitch: 'D5' }, { at: 1.5, dur: 0.5, pitch: 'E5' }, { at: 2, dur: 2, pitch: 'F5' }], line(['G5', 'F5', 'E5', 'D5'])], 1);
    expect(found.present).toBe(true);
    expect(found.at.map((a) => a.measure)).toEqual([1]);
  });
  it('the bar after a pickup opening on a rest is syncopation: the pickup sounded before the silent downbeat', () => {
    const found = sync([[{ at: 0, dur: 1, pitch: 'G4' }], [{ at: 0.5, dur: 0.5, pitch: 'C5' }, { at: 1, dur: 3, pitch: 'D5' }], line(['G5', 'F5', 'E5', 'D5'])], 1);
    expect(found.present).toBe(true);
    expect(found.at.map((a) => a.measure)).toEqual([1]);
  });
  it('syncopation inside the pickup still counts: a quarter on the "and" held across the beat, located at that note alone', () => {
    const model = phrase({
      bars: [[{ at: 0, dur: 0.5, pitch: 'E4' }, { at: 0.5, dur: 1, pitch: 'F4' }, { at: 1.5, dur: 0.5, pitch: 'G4' }], ...plain],
      pickup: 2,
    });
    const found = detect(model, 'syncopation');
    const f4 = model.steps.flatMap((s) => s.notes).find((n) => n.midi === 65 && n.measureIndex === 0);
    expect(found.present).toBe(true);
    expect(found.at.map((a) => a.noteId)).toEqual([f4?.id]);
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
  // Replaced (L120b; the reviewer's ruling on L120a, `responses/0bcd3be0.md`, class: an assertion of the
  // reading being corrected). It said "3/8 counts as one compound beat, the generator's own rule"; 3/8 is
  // one group of three eighths, counted as simple triple, and compound time needs more than one such beat.
  it('M1: a phrase all in 3/8 is simple triple — not compound, located nowhere', () => {
    const found = detect(phrase({ bars: [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 0.5, pitch: 'D4' }, { at: 1, dur: 0.5, pitch: 'E4' }], [{ at: 0, dur: 1.5, pitch: 'F4' }]], time: '3/8' }), 'compoundMetre');
    expect(found.present).toBe(false);
    expect(found.at).toEqual([]);
  });
  it('M2 (guard): 6/8, 9/8 and 12/8 are located at every note, as before', () => {
    for (const time of ['6/8', '9/8', '12/8']) {
      const model = phrase({ bars: [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 0.5, pitch: 'D4' }, { at: 1, dur: 0.5, pitch: 'E4' }, { at: 1.5, dur: 1.5, pitch: 'F4' }]], time });
      const found = detect(model, 'compoundMetre');
      expect(found.present, time).toBe(true);
      expect(found.at.map((a) => a.noteId), time).toEqual(model.steps.flatMap((step) => step.notes.map((note) => note.id)));
    }
  });
  it('M3: 3/8 with one 6/8 bar is compound, located at that bar’s notes alone', () => {
    // Two bars of 3/8, then a bar of 6/8: the third bar starts where two 3/8 bars end, as the model would place it.
    const model = phrase({
      bars: [
        [{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 1, pitch: 'D4' }],
        [{ at: 0, dur: 1.5, pitch: 'E4' }],
        [{ at: 0, dur: 1.5, pitch: 'F4' }, { at: 1.5, dur: 1.5, pitch: 'G4' }],
      ],
      time: '3/8',
    });
    const mixed = { ...model, timeSigMap: [{ atMeasure: 0, beats: 3, beatType: 8 }, { atMeasure: 2, beats: 6, beatType: 8 }] };
    const found = detect(mixed, 'compoundMetre');
    expect(found.present).toBe(true);
    expect(found.at.map((a) => a.measure)).toEqual([2, 2]);
  });
});

// SR2 (the reviewer's ruling on SR1, `docs/review/responses/sr1-sightreading-quality.md` §1): exactly what 1.4
// teaches, `content/lessons/1.4.md:23`. A broad "triple metre" would also take 3/8 and 3/2, which 1.4 does not teach.
describe('metre.three-four — exactly three quarter-note beats to the bar', () => {
  const bar = [{ at: 0, dur: 3, pitch: 'C4' }];
  it('present: 3/4', () => expect(present('threeFour', [bar], '3/4')).toBe(true));
  it('absent: 3/8 and 3/2, triple but not what 1.4 teaches', () => {
    expect(present('threeFour', [[{ at: 0, dur: 1.5, pitch: 'C4' }]], '3/8')).toBe(false);
    expect(present('threeFour', [[{ at: 0, dur: 6, pitch: 'C4' }]], '3/2')).toBe(false);
  });
  it('absent: 6/8, 2/4 and 4/4', () => {
    expect(present('threeFour', [[{ at: 0, dur: 3, pitch: 'C4' }]], '6/8')).toBe(false);
    expect(present('threeFour', [[{ at: 0, dur: 2, pitch: 'C4' }]], '2/4')).toBe(false);
    expect(present('threeFour', [[{ at: 0, dur: 4, pitch: 'C4' }]], '4/4')).toBe(false);
    expect(present('threeFour', [[{ at: 0, dur: 4, pitch: 'C4' }]])).toBe(false);
  });
  it('located at every note of a 3/4 phrase', () => {
    const model = phrase({ bars: [line(['C4', 'D4', 'E4'], 1), [{ at: 0, dur: 3, pitch: 'F4' }]], time: '3/4' });
    const found = detect(model, 'threeFour');
    expect(found.at.map((a) => a.noteId)).toEqual(model.steps.flatMap((step) => step.notes.map((note) => note.id)));
  });
  it('a 4/4 piece with one 3/4 bar is located at that bar’s notes alone', () => {
    const model = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'F4', 'E4'], 1), line(['D4', 'C4', 'D4', 'E4'], 1)], time: '4/4' });
    const mixed = {
      ...model,
      timeSigMap: [
        { atMeasure: 0, beats: 4, beatType: 4 },
        { atMeasure: 1, beats: 3, beatType: 4 },
        { atMeasure: 2, beats: 4, beatType: 4 },
      ],
    };
    const found = detect(mixed, 'threeFour');
    expect(found.present).toBe(true);
    expect([...new Set(found.at.map((a) => a.measure))]).toEqual([1]);
    expect(found.at).toHaveLength(3);
  });
});

describe('3/8 read as three eighth-note beats by every detector that reads a beat (L120b)', () => {
  it('M4: in 3/8 a quarter entering on the second eighth is on a beat — no syncopation there', () => {
    expect(present('syncopation', [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 1, pitch: 'D4' }], [{ at: 0, dur: 1.5, pitch: 'E4' }]], '3/8')).toBe(false);
  });
  it('M4 (guard): in 3/8 a quarter entering a sixteenth after a beat is syncopation', () => {
    expect(
      present('syncopation', [[{ at: 0, dur: 0.25, pitch: 'C4' }, { at: 0.25, dur: 1, pitch: 'D4' }, { at: 1.25, dur: 0.25, pitch: 'E4' }], [{ at: 0, dur: 1.5, pitch: 'F4' }]], '3/8'),
    ).toBe(true);
  });
  it('M5: in 3/8 a written dotted quarter is a dotted quarter', () => {
    const found = detect(phrase({ bars: [[{ at: 0, dur: 0.5, pitch: 'C4' }, { at: 0.5, dur: 0.5, pitch: 'D4' }, { at: 1, dur: 0.5, pitch: 'E4' }], [{ at: 0, dur: 1.5, pitch: 'F4' }]], time: '3/8' }), 'dottedQuarters');
    expect(found.present).toBe(true);
    expect(found.at.map((a) => a.measure)).toEqual([1]);
  });
  it('M5 (guard): in 6/8 a written dotted quarter is the beat, not the demand', () => {
    expect(present('dottedQuarters', [[{ at: 0, dur: 1.5, pitch: 'C4' }, { at: 1.5, dur: 0.5, pitch: 'D4' }, { at: 2, dur: 0.5, pitch: 'E4' }, { at: 2.5, dur: 0.5, pitch: 'F4' }]], '6/8')).toBe(false);
  });
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
  // DC2: the tune is the right hand sounding in the bar, which a note tied over the bar line does.
  it('present: a right-hand note tied over the bar line plays in the bar it is held into', () =>
    expect(
      present('leftHandPattern', [[{ at: 0, pitch: 'C5', tie: [4, 4] }, ...line(['C3', 'G3', 'E3', 'G3'], 1, 2)], line(['B2', 'G3'], 2, 2)]),
    ).toBe(true));
  it('boundary: a right-hand note that ends at the bar line leaves the next bar to the left hand alone', () =>
    expect(present('leftHandPattern', [[...rh, ...line(['C3', 'G3', 'E3', 'G3'], 1, 2)], line(['B2', 'G3'], 2, 2)])).toBe(false));
  it('boundary: a left-hand note tied into the bar is no new note there (one struck note is no pattern)', () =>
    expect(
      present('leftHandPattern', [
        [...rh, ...line(['C3', 'G3', 'E3'], 1, 2), { at: 3, pitch: 'G3', staff: 2, tie: [1, 2] }],
        [...rh, { at: 2, dur: 2, pitch: 'C3', staff: 2 }],
      ]),
    ).toBe(false));
});

describe('texture.walking-bass — a quarter on every beat in the left hand', () => {
  const rh = line(['C5'], 4);
  it('present', () => expect(present('walkingBass', [[...rh, ...line(['C3', 'D3', 'E3', 'G3'], 1, 2)], [...rh, ...line(['F2', 'G2', 'A2', 'C3'], 1, 2)]])).toBe(true));
  it('boundary: a walk that stalls on its top note still walks; it never turns back to a note it left', () =>
    expect(present('walkingBass', [[...rh, ...line(['C3', 'D3', 'E3', 'E3'], 1, 2)], [...rh, ...line(['F3', 'G3', 'A3', 'B3'], 1, 2)]])).toBe(true));
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

describe('texture.walking-bass — a stationary pulse is not a walk (the 2026-10-07 ruling)', () => {
  const rh = line(['C5'], 4);
  const rh3 = [{ at: 0, dur: 3, pitch: 'C5' }];
  const bars = (lines: string[][], top = rh) => lines.map((pitches) => [...top, ...line(pitches, 1, 2)]);
  it('a real walk: scale tones, a chord tone and a chromatic approach, a new note on every beat', () =>
    expect(present('walkingBass', bars([['C3', 'D3', 'E3', 'G3'], ['A3', 'G3', 'F3', 'E3'], ['D3', 'F3', 'A3', 'Ab3'], ['G3', 'F3', 'E3', 'D3']]))).toBe(true));
  it('a walk that stalls once on a repeated note still walks', () =>
    expect(present('walkingBass', bars([['C3', 'D3', 'E3', 'E3'], ['F3', 'G3', 'A3', 'Bb3'], ['A3', 'G3', 'F3', 'E3']]))).toBe(true));
  it('a stationary pulse, one pitch on every beat of every bar, is not a walk (the clave pulse exercises)', () =>
    expect(present('walkingBass', bars([['B4', 'B4', 'B4', 'B4'], ['B4', 'B4', 'B4', 'B4']]))).toBe(false));
  it('a pulse that changes pitch only at the bar line is not a walk (the Outer Wilds theme)', () =>
    expect(present('walkingBass', bars([['C2', 'C2', 'C2', 'C2'], ['D2', 'D2', 'D2', 'D2'], ['E2', 'E2', 'E2', 'E2']]))).toBe(false));
  it('a stride left hand, a root then one chord note three times, is not a walk', () =>
    expect(present('walkingBass', bars([['C2', 'E3', 'E3', 'E3'], ['G2', 'B3', 'B3', 'B3'], ['C2', 'E3', 'E3', 'E3'], ['F2', 'A3', 'A3', 'A3']]))).toBe(false));
  it('an oom-pah-pah in 3/4, a root then the same chord note twice, is not a walk', () =>
    expect(present('walkingBass', bars([['C2', 'E3', 'E3'], ['G1', 'D3', 'D3'], ['C2', 'E3', 'E3']], rh3), '3/4')).toBe(false));
  it('a pulse that moves every two beats is not a walk: the line changes on fewer than half its beats', () =>
    expect(present('walkingBass', bars([['C3', 'C3', 'D3', 'D3'], ['E3', 'E3', 'F3', 'F3'], ['G3', 'G3', 'A3', 'A3']]))).toBe(false));
  it('the same rising triad in every bar of 3/4 is a broken chord, not a walk: it never moves by step (Scarborough Fair)', () =>
    expect(present('walkingBass', bars([['E3', 'G3', 'B3'], ['E3', 'G3', 'B3'], ['D3', 'F#3', 'A3'], ['E3', 'G3', 'B3']], rh3), '3/4')).toBe(false));
});

describe('rhythm.habanera and rhythm.tresillo — the left hand’s onsets are exactly the cell (CD1)', () => {
  // The cells as fractions of the bar: the habanera 0, 3/8, 1/2, 3/4; the tresillo 0, 3/8, 3/4
  // (the upgrade's "dotted eighth, sixteenth, eighth, eighth in 2/4 … the tresillo (3+3+2)").
  const L = (at: number, dur: number, pitch = 'C3'): HandNote => ({ at, dur, pitch, staff: 2 });
  const rh = (length = 4): HandNote[] => [{ at: 0, dur: length, pitch: 'C5' }];
  const both = (bars: HandNote[][], time?: string): { habanera: boolean; tresillo: boolean } => ({
    habanera: present('habaneraCell', bars, time),
    tresillo: present('tresilloCell', bars, time),
  });
  const HABANERA = { habanera: true, tresillo: false };
  const TRESILLO = { habanera: false, tresillo: true };
  const NEITHER = { habanera: false, tresillo: false };

  // The present cases, each read under both detectors below (the cross-failure).
  const upgrade24 = [[...rh(2), L(0, 0.75), L(0.75, 0.25, 'G3'), L(1, 0.5, 'C3'), L(1.5, 0.5, 'G3')]];
  const doubled44 = [[...rh(), L(0, 1.5), L(1.5, 0.5, 'G3'), L(2, 1, 'C3'), L(3, 1, 'G3')]];
  // Por Una Cabeza's written form: a quarter, an eighth rest, an eighth, a quarter, a quarter.
  const porUnaCabeza = [[...rh(), L(0, 1), L(1.5, 0.5, 'G3'), L(2, 1, 'C3'), L(3, 1, 'G3')]];
  // The Crave's tresillo: dotted quarter, dotted quarter, quarter.
  const crave = [[...rh(), L(0, 1.5), L(1.5, 1.5, 'G3'), L(3, 1, 'C3')]];
  const tresillo24 = [[...rh(2), L(0, 0.75), L(0.75, 0.75, 'G3'), L(1.5, 0.5, 'C3')]];

  it('present: the 2/4 habanera as the upgrade writes it, and its doubled form in 4/4 and 2/2', () => {
    expect(both(upgrade24, '2/4')).toEqual(HABANERA);
    expect(both(doubled44)).toEqual(HABANERA);
    expect(both(doubled44, '2/2')).toEqual(HABANERA);
  });
  it('present: Por Una Cabeza’s written form, a quarter and an eighth rest where the cell has a dotted quarter', () =>
    expect(both(porUnaCabeza)).toEqual(HABANERA));
  it('present: The Crave’s tresillo in 4/4, and the tresillo in 2/4', () => {
    expect(both(crave)).toEqual(TRESILLO);
    expect(both(tresillo24, '2/4')).toEqual(TRESILLO);
  });

  it('absent: straight eighths', () => expect(both([[...rh(), ...line(['C3', 'G3', 'E3', 'G3', 'C3', 'G3', 'E3', 'G3'], 0.5, 2)]])).toEqual(NEITHER));
  it('absent: the dotted-pair near-miss, onsets 0, 3/8, 1/2, 7/8', () =>
    expect(both([[...rh(2), L(0, 0.75), L(0.75, 0.25, 'G3'), L(1, 0.75, 'C3'), L(1.75, 0.25, 'G3')]], '2/4')).toEqual(NEITHER));
  it('absent: the same cell in the right hand only', () =>
    expect(
      both([[{ at: 0, dur: 1.5, pitch: 'C5' }, { at: 1.5, dur: 0.5, pitch: 'G4' }, { at: 2, dur: 1, pitch: 'C5' }, { at: 3, dur: 1, pitch: 'G4' }, L(0, 4)]]),
    ).toEqual(NEITHER));
  it('absent: a 3/4 bar and a 6/8 bar holding the same fractions', () => {
    const fractions = [[...rh(3), L(0, 1.125), L(1.125, 0.375, 'G3'), L(1.5, 0.75, 'C3'), L(2.25, 0.75, 'G3')]];
    expect(both(fractions, '3/4')).toEqual(NEITHER);
    expect(both(fractions, '6/8')).toEqual(NEITHER);
    const threeThreeTwo = [[...rh(3), L(0, 1.125), L(1.125, 1.125, 'G3'), L(2.25, 0.75, 'C3')]];
    expect(both(threeThreeTwo, '3/4')).toEqual(NEITHER);
    expect(both(threeThreeTwo, '6/8')).toEqual(NEITHER);
  });
  it('absent: a pickup bar is never read, though its notes sit where the cell’s would', () => {
    const model = { ...phrase({ bars: [doubled44[0] as HandNote[], [...rh(), L(0, 4)]] }), pickup: true };
    expect(detect(model, 'habaneraCell').present).toBe(false);
    const counted = phrase({ bars: [doubled44[0] as HandNote[], [...rh(), L(0, 4)]] });
    expect(detect(counted, 'habaneraCell').present).toBe(true);
  });
  it('absent: a bar entered by a tie from the bar before has no onset at its start', () => {
    const tied = [[...rh(), { at: 0, pitch: 'C3', staff: 2 as const, tie: [4, 1.5] }], [...rh(), L(1.5, 0.5, 'G3'), L(2, 1, 'C3'), L(3, 1, 'G3')]];
    expect(both(tied)).toEqual(NEITHER);
  });
  it('absent: the secondary rag’s eight sixteenths, grouped 3+3+2 by accent, sound every sixteenth', () =>
    expect(both([[...rh(2), ...line(['C3', 'E3', 'G3', 'C3', 'E3', 'G3', 'C3', 'E3'], 0.25, 2)]], '2/4')).toEqual(NEITHER));

  it('boundary: the cross-failure — no habanera bar is a tresillo bar, and no tresillo bar a habanera bar', () => {
    for (const [bars, time] of [[upgrade24, '2/4'], [doubled44, undefined], [porUnaCabeza, undefined]] as const) {
      expect(present('tresilloCell', bars, time)).toBe(false);
    }
    for (const [bars, time] of [[crave, undefined], [tresillo24, '2/4']] as const) {
      expect(present('habaneraCell', bars, time)).toBe(false);
    }
  });
  it('boundary: a habanera whose sixteenth is tied over the half bar reads as a tresillo', () =>
    expect(both([[...rh(2), L(0, 0.75), { at: 0.75, pitch: 'G3', staff: 2, tie: [0.25, 0.5] }, L(1.5, 0.5, 'G3')]], '2/4')).toEqual(TRESILLO));
  it('boundary: a left-hand chord is one onset, located at its lowest note', () => {
    const model = phrase({ bars: [[...rh(), L(0, 1.5, 'G3'), L(0, 1.5, 'C3'), L(0, 1.5, 'E3'), L(1.5, 0.5, 'G3'), L(2, 1, 'C3'), L(3, 1, 'G3')]] });
    const found = detect(model, 'habaneraCell');
    expect(found.present).toBe(true);
    expect(found.at).toHaveLength(4);
    const first = model.steps[0]?.notes.find((n) => n.midi === 48);
    expect(found.at[0]?.noteId).toBe(first?.id);
  });
  it('boundary: a left-hand note drawn on the upper staff (cross-staff) still counts; a right-hand note on the lower staff does not', () => {
    const base = phrase({ bars: doubled44 });
    const moved = (hand: 'R' | 'L', staff: 1 | 2): typeof base => ({
      ...base,
      steps: base.steps.map((step) => ({
        ...step,
        notes: step.notes.map((n) => (n.staff === 2 && n.onset === 1.5 ? { ...n, staff, hand, crossStaff: true } : n)),
      })),
    });
    expect(detect(moved('L', 1), 'habaneraCell').present).toBe(true);
    expect(detect(moved('R', 2), 'habaneraCell').present).toBe(false);
  });
  it('boundary: grace notes are ignored', () =>
    expect(both([[...rh(), L(0, 1.5), { at: 1.25, dur: 0.25, pitch: 'F3', staff: 2, grace: true }, L(1.5, 0.5, 'G3'), L(2, 1, 'C3'), L(3, 1, 'G3')]])).toEqual(HABANERA));
  it('boundary: a habanera bar locates exactly four places and a tresillo bar three', () => {
    expect(detect(phrase({ bars: [...doubled44, ...porUnaCabeza] }), 'habaneraCell').at).toHaveLength(8);
    expect(detect(phrase({ bars: [...crave, ...crave] }), 'tresilloCell').at).toHaveLength(6);
    const at = detect(phrase({ bars: [...crave, [...rh(), L(0, 4)]] }), 'tresilloCell').at;
    expect(at.map((a) => [a.measure, a.staff])).toEqual([[0, 2], [0, 2], [0, 2]]);
  });
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
