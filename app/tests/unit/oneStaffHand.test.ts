// @vitest-environment jsdom
/**
 * Which hand a one-staff score is played by: U68's probe, and the adversary that keeps hand identity off
 * the clef (CL15, What to build item 6; the reviewer's ruling, `docs/review/responses/questions-e71ef3ad.md`
 * §CL15: "hand identity is never inferred from clef or silence").
 *
 * U68 asked whether a left-hand-only generated item (the tumbao, the left-hand drills) could be written on
 * one bass-clef staff instead of a grand staff whose treble staff is silenced. The extractor gives a note
 * its hand from its voice's home staff and nothing else (`extractScoreModel.ts`, `staffOf` and
 * `voiceHomeStaves`): staff 2 is the left hand, anything else the right. OSMD numbers a lone staff 1. So
 * the probe below — a hand-written single bass-clef staff, four bars, read through OSMD and the extractor
 * exactly as the app reads a score — answers `R`: a generator-only one-staff left-hand item would be
 * judged, filtered and practised as the right hand's. CL15 therefore kept the two-staff representation
 * (the ruling's second explicit-truth path) and wrote no clef rule; the third case is that representation,
 * read as the left hand by its staff number.
 *
 * The adversary: a one-staff bass-clef score whose staff is explicitly the right hand's (the app's own
 * convention for a one-staff piano part, `sightReading.ts`'s `leftHand: 'none'`) stays right-handed. A
 * clef-based fallback (bass ⇒ `L`) flips it and the probe's fixture, and both cases go red.
 */
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { ScoreModel } from '../../src/score/types';

const ATTRIBUTES = (staves: number, clefs: string): string =>
  `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>${staves > 1 ? `<staves>${staves}</staves>` : ''}${clefs}</attributes>`;
const BASS = (number?: number): string => `<clef${number === undefined ? '' : ` number="${number}"`}><sign>F</sign><line>4</line></clef>`;
const TREBLE = (number: number): string => `<clef number="${number}"><sign>G</sign><line>2</line></clef>`;

/** A whole note; `staff` writes the note's `<staff>` element, absent where undefined. */
const whole = (step: string, octave: number, staff?: number): string =>
  `<note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>4</duration><type>whole</type>${staff === undefined ? '' : `<staff>${staff}</staff>`}</note>`;
const wholeRest = (staff: number): string => `<note><rest measure="yes"/><duration>4</duration><type>whole</type><staff>${staff}</staff></note>`;
const BACKUP = '<backup><duration>4</duration></backup>';

const LINE: [string, number][] = [
  ['C', 3],
  ['F', 2],
  ['G', 2],
  ['C', 3],
];

function score(partName: string, measures: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>${partName}</part-name></score-part></part-list>
<part id="P1">${measures.map((body, index) => `<measure number="${String(index + 1)}">${body}</measure>`).join('')}</part></score-partwise>`;
}

/** U68's probe: one staff, the bass clef, no staff number anywhere — the shape a generator-only fix would write. */
const LONE_BASS_STAFF = score(
  'Piano',
  LINE.map(([step, octave], index) => `${index === 0 ? ATTRIBUTES(1, BASS()) : ''}${whole(step, octave)}`),
);

/** The adversary: one bass-clef staff explicitly numbered 1 on every note, the app's right-hand staff. */
const RIGHT_HAND_IN_THE_BASS_CLEF = score(
  'Right hand',
  LINE.map(([step, octave], index) => `${index === 0 ? ATTRIBUTES(1, BASS(1)) : ''}${whole(step, octave, 1)}`),
);

/** The representation CL15 kept: a grand staff, the treble silent, the line on staff 2. */
const GRAND_STAFF_LEFT_HAND = score(
  'Piano',
  LINE.map(([step, octave], index) => `${index === 0 ? ATTRIBUTES(2, TREBLE(1) + BASS(2)) : ''}${wholeRest(1)}${BACKUP}${whole(step, octave, 2)}`),
);

async function modelOf(musicXml: string): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(musicXml);
    return extractScoreModel(osmd, { musicXml });
  } finally {
    container.remove();
  }
}

const sounded = (model: ScoreModel) => model.steps.flatMap((step) => step.notes);

describe('the hand of a one-staff score is its staff number’s, never its clef’s (U68)', () => {
  it('the probe: a lone bass-clef staff with no staff number reads as the right hand', async () => {
    const model = await modelOf(LONE_BASS_STAFF);
    const notes = sounded(model);
    expect(notes.map((note) => note.midi)).toEqual([48, 41, 43, 48]);
    expect(notes.map((note) => [note.staff, note.hand])).toEqual([
      [1, 'R'],
      [1, 'R'],
      [1, 'R'],
      [1, 'R'],
    ]);
    expect(model.handsPresent).toEqual({ R: true, L: false });
  });

  it('the adversary: a bass-clef staff explicitly the right hand’s stays right-handed — the clef never flips it', async () => {
    const model = await modelOf(RIGHT_HAND_IN_THE_BASS_CLEF);
    expect(sounded(model).every((note) => note.staff === 1 && note.hand === 'R')).toBe(true);
    expect(model.handsPresent).toEqual({ R: true, L: false });
  });

  it('the kept representation: the same line on the grand staff’s lower staff, the treble silent, is the left hand’s', async () => {
    const model = await modelOf(GRAND_STAFF_LEFT_HAND);
    const notes = sounded(model);
    expect(notes.map((note) => note.midi)).toEqual([48, 41, 43, 48]);
    expect(notes.every((note) => note.staff === 2 && note.hand === 'L')).toBe(true);
    expect(model.handsPresent).toEqual({ R: false, L: true });
  });
});
