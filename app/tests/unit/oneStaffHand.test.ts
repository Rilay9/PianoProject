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
 *
 * **HD1 (2026-10-06): the declared hand.** The reviewer's ruling (`docs/review/responses/3a9684d5.md`
 * §2-§5) amends CL15 without reversing it: a one-staff item whose catalogue row explicitly declares one
 * hand (`hands: left`, authored) is that hand's, because the content object says so — never because of
 * its clef. The extractor takes the declaration as `declaredHand` and applies it to a one-staff model
 * only, keeping OSMD's physical `staff`; with no declaration CL15's reading stands; a `both` declaration
 * on one staff is reported as a mismatch, never made into two hands; a two-staff score keeps its
 * voice-home-staff and cross-staff hands whatever the row says. The seven adversaries of the brief
 * (`docs/prompts/runs/curriculum-review-2026-10-05/briefs/declared-hand-into-the-model.md`) are the
 * cases below, numbered as there.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { declaredHandOf, type DeclaringItem } from '../../src/curriculum/declaredHand';
import type { Hands } from '../../src/curriculum/types';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { ScoreModel, ScoreModelData } from '../../src/score/types';
import { allFixtures, EDGE_DIR, fixtureModel, GOLDEN_DIR, loadFixture } from './helpers/fixtures';
import { catalog, installTextMeasurer, itemsWithScores, modelForItem } from './helpers/scoreCatalog';

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

async function modelOf(musicXml: string, declaredHand?: Hands): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(musicXml);
    return extractScoreModel(osmd, { musicXml, ...(declaredHand === undefined ? {} : { declaredHand }) });
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
    // HD1 case 3: no declaration is CL15's reading, and the model says nothing about a declaration.
    expect(model.handDeclaration).toBeUndefined();
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

/** Each sounded note's id, physical staff, semantic hand and cross-staff mark: what a declaration may touch. */
const handsOf = (model: Pick<ScoreModelData, 'steps'>) =>
  model.steps.flatMap((step) => step.notes.map((note) => [note.id, note.staff, note.hand, note.crossStaff === true] as const));

describe('a one-staff item’s declared hand reaches the model (HD1)', () => {
  it('1. the lone bass-clef staff declared left: every note the left hand’s on staff 1, only the left hand present', async () => {
    const model = await modelOf(LONE_BASS_STAFF, 'left');
    const notes = sounded(model);
    expect(notes.map((note) => note.midi)).toEqual([48, 41, 43, 48]);
    // The physical staff is OSMD's and stays 1; the semantic hand is the declaration's.
    expect(notes.map((note) => [note.staff, note.hand])).toEqual([
      [1, 'L'],
      [1, 'L'],
      [1, 'L'],
      [1, 'L'],
    ]);
    expect(notes.some((note) => note.crossStaff === true)).toBe(false);
    expect(model.handsPresent).toEqual({ R: false, L: true });
    expect(model.handDeclaration).toEqual({ declared: 'left', outcome: 'applied' });
  });

  it('2. the same bytes declared right: the right hand’s', async () => {
    const model = await modelOf(LONE_BASS_STAFF, 'right');
    expect(sounded(model).map((note) => [note.staff, note.hand])).toEqual([
      [1, 'R'],
      [1, 'R'],
      [1, 'R'],
      [1, 'R'],
    ]);
    expect(model.handsPresent).toEqual({ R: true, L: false });
    expect(model.handDeclaration).toEqual({ declared: 'right', outcome: 'applied' });
  });

  it('3. the same bytes with no declaration: CL15’s reading, the right hand, and no declaration reported', async () => {
    const model = await modelOf(LONE_BASS_STAFF);
    expect(sounded(model).every((note) => note.staff === 1 && note.hand === 'R')).toBe(true);
    expect(model.handsPresent).toEqual({ R: true, L: false });
    expect(model.handDeclaration).toBeUndefined();
  });

  it('4. a right-hand bass-clef staff declared right is never flipped by its clef', async () => {
    for (const declared of ['right', undefined] as const) {
      const model = await modelOf(RIGHT_HAND_IN_THE_BASS_CLEF, declared);
      expect(sounded(model).every((note) => note.staff === 1 && note.hand === 'R'), String(declared)).toBe(true);
      expect(model.handsPresent, String(declared)).toEqual({ R: true, L: false });
    }
  });

  it('5. a two-staff score keeps every note’s hand whatever the row declares: each two-staff fixture against its golden (the model before HD1)', async () => {
    installTextMeasurer();
    const names: string[] = [];
    for (const fixture of allFixtures()) {
      const staves = (await loadFixture(fixture.path)).Sheet.Staves.length;
      if (staves !== 2) continue;
      const golden = JSON.parse(readFileSync(join(GOLDEN_DIR, `${fixture.name}.json`), 'utf8')) as ScoreModelData;
      for (const declared of ['left', 'right', 'both'] as const) {
        const model = await fixtureModel(fixture.path, { id: fixture.name, declaredHand: declared });
        expect(handsOf(model), `${fixture.name} declared ${declared}`).toEqual(handsOf(golden));
        expect(model.handsPresent, `${fixture.name} declared ${declared}`).toEqual(golden.handsPresent);
        expect(model.handDeclaration, `${fixture.name} declared ${declared}`).toEqual({ declared, outcome: 'not-one-staff' });
      }
      names.push(fixture.name);
    }
    // The sweep reached the cases that matter: the cross-staff note (the left hand reaching onto the
    // treble staff: staff 1, hand L) among several two-staff scores.
    expect(names).toContain('cross-staff');
    expect(names.length).toBeGreaterThan(5);
    const crossed = await fixtureModel(join(EDGE_DIR, 'cross-staff.musicxml'), { declaredHand: 'right' });
    expect(sounded(crossed).some((note) => note.crossStaff === true && note.staff === 1 && note.hand === 'L')).toBe(true);
    // CL15's kept representation, a grand staff with the treble silent, declared right: still the left hand's.
    const grand = await modelOf(GRAND_STAFF_LEFT_HAND, 'right');
    expect(sounded(grand).every((note) => note.staff === 2 && note.hand === 'L')).toBe(true);
    expect(grand.handsPresent).toEqual({ R: false, L: true });
    expect(grand.handDeclaration).toEqual({ declared: 'right', outcome: 'not-one-staff' });
  }, 120_000);

  it('6. one staff declared both is a mismatch, reported on the model — never two hands, never quietly one', async () => {
    const model = await modelOf(LONE_BASS_STAFF, 'both');
    // No second hand is made: the notes keep CL15's reading by their staff number…
    expect(sounded(model).every((note) => note.staff === 1 && note.hand === 'R')).toBe(true);
    expect(model.handsPresent).toEqual({ R: true, L: false });
    // …and the model says that the declaration and the score disagree.
    expect(model.handDeclaration).toEqual({ declared: 'both', outcome: 'mismatch' });
  });
});

describe('where the declaration comes from (HD1, `curriculum/declaredHand.ts`)', () => {
  const authored = { kind: 'authored' as const, via: 'the approved selection (content/sources/excerpts.json)' };
  const row = (over: Partial<DeclaringItem>): DeclaringItem => ({
    hands: 'left',
    file: 'scores/excerpts/cut.mxl',
    provenance: { source: 'excerpt', facts: { hands: authored }, review: { score: null, teaching: null } },
    ...over,
  });

  it('an authored or reviewed `hands` on a bundled file is the declaration', () => {
    expect(declaredHandOf(row({}))).toBe('left');
    expect(declaredHandOf(row({ hands: 'right' }))).toBe('right');
    expect(declaredHandOf(row({ hands: 'both' }))).toBe('both');
    expect(
      declaredHandOf(row({ provenance: { source: 'pdmx', facts: { hands: { kind: 'reviewed' } }, review: { score: true, teaching: null } } })),
    ).toBe('left');
  });

  it('nothing that is not authoritative becomes an override: an inferred fact, no fact, no provenance, an import, no bundled file', () => {
    expect(
      declaredHandOf(row({ provenance: { source: 'imported-midi', facts: { hands: { kind: 'inferred' } }, review: { score: null, teaching: null } } })),
    ).toBeUndefined();
    expect(declaredHandOf(row({ provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null } } }))).toBeUndefined();
    const { provenance: _dropped, ...withoutProvenance } = row({});
    expect(declaredHandOf(withoutProvenance)).toBeUndefined();
    // A provenance with no facts at all (an older or hand-built row) declares nothing, and never throws.
    expect(declaredHandOf(row({ provenance: { source: 'excerpt' } as unknown as DeclaringItem['provenance'] }))).toBeUndefined();
    // An import's `hands` is `importToCatalogItem`'s placeholder, whatever its provenance says of the file's staves.
    expect(declaredHandOf(row({ imported: true, hands: 'both' }))).toBeUndefined();
    expect(declaredHandOf(row({ imported: true }))).toBeUndefined();
    // A runtime drill writes its phrase when it opens: its staves, not the row, say whose it is.
    expect(declaredHandOf(row({ file: null }))).toBeUndefined();
  });
});

/**
 * Case 7: the Bizet left-hand cut itself, through the real catalogue entry and the built file — the
 * declaration the Score screen passes (`helpers/scoreCatalog.modelForItem` asks `declaredHandOf`, as
 * `ScoreScreen` does).
 */
describe('the Bizet left-hand cut, through its catalogue row and its built file (HD1 case 7)', () => {
  const ID = 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh';

  it('7. catalogue left, authored by the approved selection; the model left on OSMD’s staff 1', async () => {
    installTextMeasurer();
    const entry = itemsWithScores(catalog()).find((item) => item.id === ID);
    expect(entry, `${ID} in the built catalogue — run the content build first`).toBeDefined();
    if (!entry) return;
    expect(entry.hands).toBe('left');
    expect(entry.provenance?.facts.hands?.kind).toBe('authored');
    expect(declaredHandOf(entry)).toBe('left');
    const model = await modelForItem(entry);
    const notes = sounded(model);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((note) => note.staff === 1 && note.hand === 'L')).toBe(true);
    expect(model.handsPresent).toEqual({ R: false, L: true });
    expect(model.handDeclaration).toEqual({ declared: 'left', outcome: 'applied' });
  }, 60_000);
});
