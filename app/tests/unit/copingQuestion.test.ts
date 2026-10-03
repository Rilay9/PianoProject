/**
 * What the one gate's coping question asks of a measured row, and what copes with it, read as the
 * reviewer ruled on L120a (L120b; `docs/review/responses/0bcd3be0.md`): the material reading and the
 * gate's support model, before any lesson or placement is changed around them.
 *
 * **Class 1: a key signature that alters no sounding note is not asked** (Question 2 A). The detector
 * finds the signature present and locates it at the notes whose letter it alters (`detect.ts`'s
 * `keySignature`); where none of those letters sounds, the learner plays every written note right
 * without applying it. The notation fact stays — the row's `demands`, the key, question 2's reading of
 * a practice want for it — and only the coping question (`eligibilityCore.demandsAsked`, `uncoped`)
 * leaves it out. The key signature alone: any other demand located nowhere is asked as before.
 *
 * **Class 2: before 1.5, a skip inside a taught fixed position is coped with by the note reading that
 * position taught** (Question 1). The skip stays in the notation (the detector is not changed), and
 * `taughtAt` stays at 1.5: 1.1 teaches C position by note name ("right thumb on middle C, D E F G
 * above it"), 1.3 the left hand's C3–G3, and 1.5 says "Up to now you have read notes by name ... From
 * here you read by interval". So `uncoped` holds a narrow predicate beside `supported` and `taught`:
 * `interval.skip` is coped with where the row's every sounding hand lies inside its own fixed position
 * (`demands.json`'s `fixedPositions` on the skip) and that position's note reading is taught on the
 * rung's path or a rung the learner has reached (`Learner.positionTaught`, from the lessons' own
 * `concepts`). The reviewer's four adversaries, each a case below: (1) a skip wholly inside an already
 * taught fixed position is coped with before 1.5; (2) a skip that leaves it, or a hand whose position is
 * not taught, or a row with no range, or a demand whose vocabulary entry names no positions, gets
 * nothing; (3) after 1.5, and for a learner whose interval reading is `familiar`, support works as
 * before; (4) no interval-reading evidence is inferred from a correct fixed-position run — the predicate
 * names no skill and reads no skill state.
 *
 * **Class 3: a leap wholly inside a taught fixed position is coped with the same way** (L120d; the
 * reviewer's Question 1 on L120b, `docs/review/responses/c8680b70.md`). `interval.leap` carries the
 * positions `interval.skip` carries, so the same predicate reads them; the leap stays a measured leap,
 * `taughtAt` stays at 2.1 and `copedWithBy` at interval reading. The reviewer's five constraints are the
 * adversaries: (1) the whole sounding hand inside the taught position; (2) the position taught on that
 * learner's rung path; (3) no interval-reading evidence inferred or awarded; (4) material outside the
 * position still refuses; (5) the demand still measured as a leap; and (6) the two position lists pinned
 * equal. The clef stays out of it: a one-staff bass-clef part is not read as the left hand.
 *
 * Rows here are made the way the build makes them: the detectors run over a hand-made phrase
 * (`helpers/phrase`), the ids are `measuredDemands`, the located counts the detectors' own `at`, zero
 * counts dropped (`build.attach_demands`), and each sounding hand's lowest and highest MIDI over the
 * piece (`measurement.span`, grace notes left out). Rungs are the shipped curriculum's
 * (`public/content/curriculum.json`), the learner the rung's taught set, as the session builds it
 * (`session.taughtForLearner`), with no evidence read unless a case gives some.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detect, measuredDemands, soundedNotes } from '../../src/demands/detect';
import { eligibleFor, uncoped, type Learner } from '../../src/curriculum/eligibility';
import * as session from '../../src/curriculum/session';
import { taughtAtRung } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { evidenceFor } from '../../src/evidence/evidence';
import { LADDER_STATES, ladderState } from '../../src/evidence/ladder';
import type { ScoreModelData } from '../../src/score/types';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { observe } from './helpers/observed';
import { line, phrase } from './helpers/phrase';
import { unmeasured } from './helpers/measured';

const CONTENT = join(process.cwd(), 'public', 'content');
const SHIPPED = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const CATALOG = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];

type Taught = Pick<Learner, 'taught' | 'positionTaught'>;

/**
 * The learner a rung's own options are judged for, as the session builds it: what the rung's ancestry (and
 * the rungs the learner has reached) taught, with the fixed positions from the same rungs. Before L120b the
 * session had no `taughtForLearner`, and the learner was the taught set alone — how this file ran red there.
 */
function taughtAt(rung: string, reached: readonly string[] = []): Taught {
  const built = (session as unknown as { taughtForLearner?: (c: Curriculum, r: string, v: typeof VOCABULARY_V0, reached: readonly string[]) => Taught }).taughtForLearner;
  if (built !== undefined) {
    const learner = built(SHIPPED, rung, VOCABULARY_V0, reached);
    if (learner.taught === undefined) throw new Error(`the shipped curriculum has no rung ${rung}`);
    return learner;
  }
  const taught = taughtAtRung(SHIPPED, rung, VOCABULARY_V0, reached);
  if (taught === undefined) throw new Error(`the shipped curriculum has no rung ${rung}`);
  return { taught };
}

/** Each sounding hand's lowest and highest MIDI over the whole piece, grace notes left out (the build's `measurement.span`). */
function spanOf(model: ScoreModelData): Partial<Record<'R' | 'L', [number, number]>> {
  const span: Partial<Record<'R' | 'L', [number, number]>> = {};
  for (const note of soundedNotes(model)) {
    const held = span[note.hand];
    span[note.hand] = held === undefined ? [note.midi, note.midi] : [Math.min(held[0], note.midi), Math.max(held[1], note.midi)];
  }
  return span;
}

/** A catalogue row as the build writes one from a file: the detectors' ids and located counts (zero counts dropped) and the hands' span. */
function rowOf(id: string, model: ScoreModelData): CatalogItem {
  const located: Record<string, number> = {};
  for (const demand of VOCABULARY_V0.demands) {
    const n = detect(model, demand.detector).at.length;
    if (n > 0) located[demand.id] = n;
  }
  return {
    id,
    type: 'exercise',
    title: id,
    level: 1,
    hands: 'right',
    tracks: ['core'],
    concepts: [],
    file: `scores/${id}.musicxml`,
    demands: measuredDemands(model, VOCABULARY_V0.demands),
    measurement: {
      status: 'measured',
      definitions: 4,
      located,
      bars: model.measureCount,
      steps: model.steps.length,
      notes: soundedNotes(model).length,
      established: Object.keys(located).filter((d) => d === 'interval.step'),
      span: spanOf(model),
    },
  };
}

/** A measured row's located counts. */
const locatedOf = (row: CatalogItem): Record<string, number> => (row.measurement?.status === 'measured' ? row.measurement.located : {});

// --- class 1: the key signature --------------------------------------------------------------

/** The G major five-finger pattern's shape (D0's `five_finger` family): G A B C D and back, no F. */
const G_PATTERN = phrase({ key: 'G major', bars: [line(['G4', 'A4', 'B4', 'C5']), line(['D5', 'C5', 'B4', 'A4']), [{ at: 0, dur: 4, pitch: 'G4' }]] });
/** The same key with an F♯ that sounds: the signature altered a note the learner plays. */
const G_WITH_F_SHARP = phrase({ key: 'G major', bars: [line(['G4', 'A4', 'B4', 'C5']), line(['D5', 'E5', 'F#5', 'G5']), [{ at: 0, dur: 4, pitch: 'G5' }]] });
/** G major with a written F natural: the signature alters no sounding note; the natural is outside the key. */
const G_WITH_F_NATURAL = phrase({ key: 'G major', bars: [line(['G4', 'A4', 'B4', 'C5']), line(['D5', 'E5', 'Fn5', 'E5']), [{ at: 0, dur: 4, pitch: 'D5' }]] });

describe('a key signature that alters no sounding note is not asked on the coping question (L120b, class 1)', () => {
  it('the rows are the detectors’ own readings', () => {
    expect(rowOf('g', G_PATTERN).demands).toContain('key.signature');
    expect(locatedOf(rowOf('g', G_PATTERN))['key.signature']).toBeUndefined();
    expect(locatedOf(rowOf('g#', G_WITH_F_SHARP))['key.signature']).toBe(1);
    expect(locatedOf(rowOf('gn', G_WITH_F_NATURAL))['pitch.chromatic']).toBe(1);
    expect(locatedOf(rowOf('gn', G_WITH_F_NATURAL))['key.signature']).toBeUndefined();
  });

  it('K1: the G five-finger pattern’s shape at 1.1 — the key in `demands`, located at no note — is not uncoped', () => {
    const row = rowOf('exercise.k1.g-pattern', G_PATTERN);
    expect(uncoped(row, taughtAt('1.1'))).toEqual([]);
    expect(eligibleFor(row, taughtAt('1.1'), { for: 'equivalent' })).toMatchObject({ verdict: 'eligible' });
  });

  it('K2 (guard): the same key with a sounding F♯ at 1.1 is uncoped', () => {
    expect(uncoped(rowOf('exercise.k2.g-with-f-sharp', G_WITH_F_SHARP), taughtAt('1.1'))).toContain('key.signature');
  });

  it('K3 (guard): the notation fact stays — the row keeps the key, and a practice want for it reads incidental, located 0', () => {
    const row = rowOf('exercise.k3.g-pattern', G_PATTERN);
    expect(row.demands).toContain('key.signature');
    // At 3.1, where the key signature is taught, question 1 passes before and after L120b; question 2 is unchanged.
    expect(eligibleFor(row, taughtAt('3.1'), { for: 'demand', demand: 'key.signature' })).toEqual({ verdict: 'ineligible', why: 'incidental', wanted: 'key.signature', located: 0 });
  });

  it('K4 (guard): the rule is the key signature’s alone — compound time in `demands` with nothing located is still uncoped at 1.1', () => {
    const row: CatalogItem = { ...rowOf('exercise.k4.compound-nowhere', G_PATTERN), demands: ['interval.step', 'metre.compound'] };
    expect(locatedOf(row)['metre.compound']).toBeUndefined();
    expect(uncoped(row, taughtAt('1.1'))).toEqual(['metre.compound']);
  });

  it('K5 (guard): a runtime reading row whose controls may write a key signature asks it as now', () => {
    const row = CATALOG.find((item) => item.id === 'drill.reading.sight-reading-5');
    expect(row?.measurement).toMatchObject({ status: 'runtime' });
    expect(uncoped(row as CatalogItem, taughtAt('1.1'))).toContain('key.signature');
  });

  it('K6: G major with a written F♮ — the key located nowhere is not asked, the natural is (its guard half)', () => {
    const asked = uncoped(rowOf('exercise.k6.g-with-f-natural', G_WITH_F_NATURAL), taughtAt('1.1'));
    expect(asked, 'the note outside the key is asked (guard)').toContain('pitch.chromatic');
    expect(asked, 'the key signature altering no sounding note is not').not.toContain('key.signature');
  });
});

// --- class 2: a skip inside a taught fixed position ------------------------------------------

/** Steps and skips inside right-hand C position, C4–G4 (MIDI 60–67): *Steps and Skips in C*'s shape. */
const RIGHT_IN_C = phrase({ bars: [line(['C4', 'E4', 'G4', 'E4']), line(['D4', 'F4', 'E4', 'C4'])] });
/** The hands in turn, each inside its own C position (C4–G4 and C3–G3), never together: 1.3–1.4's arrangements' shape. */
const BOTH_IN_C = phrase({ bars: [line(['C4', 'E4', 'G4', 'E4']), line(['C3', 'E3', 'G3', 'E3'], 1, 2), [{ at: 0, dur: 4, pitch: 'C4' }]] });
/** *Kum Ba Yah*'s shape: from C up to the A a sixth above, one note past right-hand C position. */
const RIGHT_TO_A = phrase({ bars: [line(['C4', 'E4', 'G4', 'A4']), line(['G4', 'E4', 'C4', 'E4'])] });
/** The left hand alone, inside its C position (C3–G3). */
const LEFT_IN_C = phrase({ bars: [line(['C3', 'E3', 'G3', 'E3'], 1, 2), line(['D3', 'F3', 'E3', 'C3'], 1, 2)] });
/** Skips an octave above C position (C5–G5): no fixed position holds them. */
const RIGHT_ABOVE_C = phrase({ bars: [line(['C5', 'E5', 'G5', 'E5']), line(['D5', 'F5', 'E5', 'C5'])] });
/** A leap (C up to G, a fifth) inside right-hand C position, with skips back down. */
const LEAP_IN_C = phrase({ bars: [line(['C4', 'G4', 'E4', 'C4']), [{ at: 0, dur: 4, pitch: 'C4' }]] });

describe('before 1.5, a skip inside a taught fixed position is coped with by the note reading it taught (L120b, class 2)', () => {
  it('the rows are the detectors’ own readings, with each hand’s span', () => {
    expect(rowOf('in-c', RIGHT_IN_C)).toMatchObject({ demands: ['interval.step', 'interval.skip'], measurement: { span: { R: [60, 67] } } });
    expect(rowOf('both', BOTH_IN_C)).toMatchObject({ measurement: { span: { R: [60, 67], L: [48, 55] } } });
    expect(rowOf('both', BOTH_IN_C).demands).toEqual(['clef.bass', 'interval.skip']);
    expect(rowOf('to-a', RIGHT_TO_A)).toMatchObject({ measurement: { span: { R: [60, 69] } } });
    expect(rowOf('leap', LEAP_IN_C).demands).toEqual(expect.arrayContaining(['interval.skip', 'interval.leap']));
  });

  // Revised (L120d). Old assumption: the positions are the skip's alone (L120b recorded them once, on the skip).
  // The reviewer ruled a leap inside a taught position is coped with the same way, so the leap carries them too.
  it('the positions are recorded on the skip and the leap, and each is a concept the lessons name', () => {
    const withPositions = VOCABULARY_V0.demands.filter((demand) => (demand.fixedPositions ?? []).length > 0).map((demand) => demand.id);
    expect(withPositions).toEqual(['interval.skip', 'interval.leap']);
    const skip = VOCABULARY_V0.demands.find((demand) => demand.id === 'interval.skip');
    expect(skip?.fixedPositions).toEqual([
      { concept: 'C-position', hand: 'R', low: 60, high: 67 },
      { concept: 'LH-C-position', hand: 'L', low: 48, high: 55 },
    ]);
    expect(skip?.taughtAt, 'the skip is still taught at 1.5 (not moved)').toEqual(['1.5']);
    expect(skip?.copedWithBy, 'one coping skill, unchanged').toBe('interval-reading');
    const naming = (concept: string): string[] =>
      SHIPPED.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.filter((lesson) => lesson.concepts.includes(concept)).map((lesson) => lesson.id)));
    expect(naming('C-position')).toEqual(['1.1']);
    expect(naming('LH-C-position')).toEqual(['1.3']);
  });

  it('(1) at 1.2 a skip with the right hand inside 60–67 is not uncoped; at 1.4 a two-hand row inside both positions is not', () => {
    const right = rowOf('exercise.l120b.right-in-c', RIGHT_IN_C);
    expect(uncoped(right, taughtAt('1.2'))).toEqual([]);
    expect(eligibleFor(right, taughtAt('1.2'), { for: 'equivalent' })).toMatchObject({ verdict: 'eligible' });
    const both = rowOf('exercise.l120b.both-in-c', BOTH_IN_C);
    expect(uncoped(both, taughtAt('1.4'))).toEqual([]);
    expect(eligibleFor(both, taughtAt('1.4'), { for: 'equivalent' })).toMatchObject({ verdict: 'eligible' });
  });

  it('(1) the practice floor, standing on 1.1, reads the right hand’s position', () => {
    expect(uncoped(rowOf('exercise.l120b.right-in-c', RIGHT_IN_C), taughtAt('practice.1'))).toEqual([]);
  });

  it('(2, guard) at 1.2 the right hand at 60–69 (Kum Ba Yah’s shape) stays uncoped', () => {
    expect(uncoped(rowOf('song.l120b.right-to-a', RIGHT_TO_A), taughtAt('1.2'))).toContain('interval.skip');
  });

  it('(2, guard) at 1.2 the left hand inside 48–55 stays uncoped: its position is taught at 1.3', () => {
    expect(uncoped(rowOf('exercise.l120b.left-in-c', LEFT_IN_C), taughtAt('1.2'))).toContain('interval.skip');
  });

  it('(2, guard) at 1.2 the left hand playing in 60–67, the right hand’s position, stays uncoped: a position is its own hand’s', () => {
    const leftHigh = phrase({ bars: [line(['C4', 'E4', 'G4', 'E4'], 1, 2), line(['D4', 'F4', 'E4', 'C4'], 1, 2)] });
    expect(rowOf('exercise.l120b.left-high', leftHigh)).toMatchObject({ measurement: { span: { L: [60, 67] } } });
    expect(uncoped(rowOf('exercise.l120b.left-high', leftHigh), taughtAt('1.2'))).toContain('interval.skip');
  });

  it('(2, guard) at 0.3, where no position is taught, stays uncoped', () => {
    expect(uncoped(rowOf('exercise.l120b.right-in-c', RIGHT_IN_C), taughtAt('0.3'))).toContain('interval.skip');
  });

  it('(2, guard) at practice.1 a row with a left-hand note stays uncoped: the floor stands on 1.1 alone', () => {
    expect(uncoped(rowOf('exercise.l120b.both-in-c', BOTH_IN_C), taughtAt('practice.1'))).toContain('interval.skip');
  });

  it('(2, guard) an unmeasured row and a runtime reading row have no range and get nothing', () => {
    const refused = eligibleFor({ ...rowOf('song.l120b.unread', RIGHT_IN_C), ...unmeasured('constructed: not measured') }, taughtAt('1.2'), { for: 'equivalent' });
    expect(refused).toMatchObject({ verdict: 'ineligible', why: 'unknown-forbidden' });
    expect(refused.verdict === 'ineligible' && refused.why === 'unknown-forbidden' ? refused.demands : []).toContain('interval.skip');
    const reading = CATALOG.find((item) => item.id === 'drill.reading.sight-reading-1');
    expect(reading?.measurement).toMatchObject({ status: 'runtime' });
    expect(uncoped(reading as CatalogItem, taughtAt('1.2'))).toContain('interval.skip');
  });

  it('(2, guard) a row with no span — measured before the build wrote one — gets nothing', () => {
    const row = rowOf('exercise.l120b.no-span', RIGHT_IN_C);
    const { span: _span, ...measurement } = row.measurement as Extract<CatalogItem['measurement'], { status: 'measured' }>;
    expect(uncoped({ ...row, measurement }, taughtAt('1.2'))).toEqual(['interval.skip']);
  });

  it('(3, guard) at 1.5 and 2.1 a skip outside every position is taught as now', () => {
    const above = rowOf('exercise.l120b.right-above-c', RIGHT_ABOVE_C);
    expect(uncoped(above, taughtAt('1.5'))).toEqual([]);
    expect(uncoped(above, taughtAt('2.1'))).toEqual([]);
  });

  it('(3, guard) at 1.2 a learner whose interval reading is familiar is supported for an out-of-position skip as now', () => {
    const above = rowOf('exercise.l120b.right-above-c', RIGHT_ABOVE_C);
    expect(uncoped(above, taughtAt('1.2'))).toEqual(['interval.skip']);
    const familiar: Learner = { ...taughtAt('1.2'), skillState: (skill) => (skill === 'interval-reading' ? 'familiar' : undefined) };
    expect(uncoped(above, familiar)).toEqual([]);
  });

  it('(4, guard) correct runs of in-position skip items that declare no interval-reading target leave interval reading unsupported', () => {
    // The shipped songs with skips at 0.3–1.4 and on the practice floor declare no target skills.
    const early = new Set(SHIPPED.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons))
      .filter((lesson) => /^(0\.3|1\.[1-4]|practice\.\d)$/.test(lesson.id))
      .flatMap((lesson) => [...lesson.exerciseOptions, ...lesson.songOptions]));
    const skipping = CATALOG.filter((item) => early.has(item.id) && Array.isArray(item.demands) && item.demands.includes('interval.skip'));
    expect(skipping.length).toBeGreaterThan(0);
    for (const item of skipping) expect(item.targetSkills ?? [], item.id).not.toContain('interval-reading');

    // Five correct runs of the in-position item, declaring what those songs declare: nothing.
    const runs = [1, 2, 3, 4, 5].map((day) => observe(RIGHT_IN_C, { mode: 'tempo', at: `2026-09-2${String(day)}T10:00:00.000Z`, id: day, itemId: 'exercise.l120b.right-in-c' }));
    const evidence = runs.flatMap((run) => evidenceFor({ observation: run, played: RIGHT_IN_C, targetSkills: [], vocabulary: VOCABULARY_V0 }));
    expect(evidence, 'no evidence for a skill nobody declared').toEqual([]);
    const state = ladderState({ evidence: [], today: new Date('2026-09-28T12:00:00Z') }).state;
    expect(LADDER_STATES.indexOf(state)).toBeLessThan(LADDER_STATES.indexOf('familiar'));

    const learner: Learner = { ...taughtAt('1.2'), skillState: (skill) => (skill === 'interval-reading' ? state : undefined) };
    expect(uncoped(rowOf('exercise.l120b.right-above-c', RIGHT_ABOVE_C), learner), 'an out-of-position skip stays uncoped').toEqual(['interval.skip']);
    // The in-position skip is coped with by the position alone, whatever the skill state: the predicate reads none.
    expect(uncoped(rowOf('exercise.l120b.right-in-c', RIGHT_IN_C), learner)).toEqual([]);
    expect(uncoped(rowOf('exercise.l120b.right-in-c', RIGHT_IN_C), { ...taughtAt('1.2') })).toEqual([]);
  });

  it('a reached rung counts, as taughtAtRung’s second reading: at practice.1 a learner who has reached 1.3 reads both positions', () => {
    expect(uncoped(rowOf('exercise.l120b.both-in-c', BOTH_IN_C), taughtAt('practice.1', ['1.3']))).toEqual([]);
  });

  it('a learner built without the positions gives no exemption: the refusal stays, never the reverse', () => {
    const { positionTaught: _p, ...without } = taughtAt('1.2');
    expect(uncoped(rowOf('exercise.l120b.right-in-c', RIGHT_IN_C), without)).toEqual(['interval.skip']);
  });
});

// --- class 3: a leap inside a taught fixed position (L120d) ----------------------------------

/** The left hand alone leaping inside its C position: C3 up to G3, a fifth, with skips back down (L 48–55). */
const LEFT_LEAP_IN_C = phrase({ bars: [line(['C3', 'G3', 'E3', 'C3'], 1, 2), [{ at: 0, dur: 4, pitch: 'C3', staff: 2 }]] });
/** The hands in turn, never together, each leaping inside its own C position: C4 up to G4, then C3 up to G3. */
const BOTH_LEAP_IN_C = phrase({ bars: [line(['C4', 'G4', 'E4', 'C4']), line(['C3', 'G3', 'E3', 'C3'], 1, 2), [{ at: 0, dur: 4, pitch: 'C4' }]] });
/** C4 up to A4, a sixth: *Kum Ba Yah*'s reach, one note past right-hand C position (R 60–69). */
const LEAP_TO_A = phrase({ bars: [line(['C4', 'A4', 'G4', 'E4']), [{ at: 0, dur: 4, pitch: 'C4' }]] });
/** C4 up to C5, an octave, and down a fourth to G4 (R 60–72). */
const LEAP_TO_C5 = phrase({ bars: [line(['C4', 'C5', 'G4', 'E4']), [{ at: 0, dur: 4, pitch: 'C4' }]] });
/** The left hand leaping inside 60–67, the right hand's position (L 60–67). */
const LEFT_LEAP_HIGH = phrase({ bars: [line(['C4', 'G4', 'E4', 'C4'], 1, 2), [{ at: 0, dur: 4, pitch: 'C4', staff: 2 }]] });
/** The hands in turn: the right leaping inside its C position, the left from C3 up to A3, a sixth (L 48–57). */
const BOTH_LEFT_TO_A = phrase({ bars: [line(['C4', 'G4', 'E4', 'C4']), line(['C3', 'A3', 'G3', 'E3'], 1, 2), [{ at: 0, dur: 4, pitch: 'C4' }]] });
/** A runtime reading row whose reading controls may write a leap (level 2, both hands: the left part may leap). */
const READING_ROW_WITH_LEAPS = 'drill.reading.sight-reading-2';

describe('a leap wholly inside a taught fixed position is coped with by that position’s note reading (L120d, class 3)', () => {
  const leapOf = (): (typeof VOCABULARY_V0.demands)[number] | undefined => VOCABULARY_V0.demands.find((demand) => demand.id === 'interval.leap');
  const skipOf = (): (typeof VOCABULARY_V0.demands)[number] | undefined => VOCABULARY_V0.demands.find((demand) => demand.id === 'interval.skip');

  it('the rows are the detectors’ own readings, with each hand’s span', () => {
    expect(rowOf('leap', LEAP_IN_C)).toMatchObject({ demands: ['interval.skip', 'interval.leap'], measurement: { span: { R: [60, 67] } } });
    expect(rowOf('left-leap', LEFT_LEAP_IN_C)).toMatchObject({ demands: ['clef.bass', 'interval.skip', 'interval.leap'], measurement: { span: { L: [48, 55] } } });
    expect(rowOf('both-leap', BOTH_LEAP_IN_C)).toMatchObject({ demands: ['clef.bass', 'interval.skip', 'interval.leap'], measurement: { span: { R: [60, 67], L: [48, 55] } } });
    expect(rowOf('to-a', LEAP_TO_A)).toMatchObject({ measurement: { span: { R: [60, 69] } } });
    expect(rowOf('to-c5', LEAP_TO_C5)).toMatchObject({ measurement: { span: { R: [60, 72] } } });
    expect(rowOf('left-high', LEFT_LEAP_HIGH)).toMatchObject({ measurement: { span: { L: [60, 67] } } });
    expect(rowOf('both-left-to-a', BOTH_LEFT_TO_A)).toMatchObject({ measurement: { span: { R: [60, 67], L: [48, 57] } } });
    for (const model of [LEAP_TO_A, LEAP_TO_C5, LEFT_LEAP_HIGH, BOTH_LEFT_TO_A]) expect(rowOf('out', model).demands).toContain('interval.leap');
  });

  // Revised (L120d; was L120b's "(2, guard) an interval.leap inside 60–67 at 1.2 stays uncoped; the skips beside it do not").
  // Old assumption: a leap inside the position refuses. The reviewer ruled it is coped with as the skip is.
  it('(1) at 1.2 a leap with the right hand inside 60–67 is not uncoped, nor the skips beside it', () => {
    const row = rowOf('exercise.l120d.leap-in-c', LEAP_IN_C);
    expect(uncoped(row, taughtAt('1.2'))).toEqual([]);
    expect(eligibleFor(row, taughtAt('1.2'), { for: 'equivalent' })).toMatchObject({ verdict: 'eligible' });
  });

  it('(1) at 1.4 a two-hand row leaping inside both positions (C4 to G4, C3 to G3) is not uncoped', () => {
    const row = rowOf('exercise.l120d.both-leap-in-c', BOTH_LEAP_IN_C);
    expect(uncoped(row, taughtAt('1.4'))).toEqual([]);
    expect(eligibleFor(row, taughtAt('1.4'), { for: 'equivalent' })).toMatchObject({ verdict: 'eligible' });
  });

  it('(1) the practice floor, standing on 1.1, reads the right hand’s position for a leap', () => {
    expect(uncoped(rowOf('exercise.l120d.leap-in-c', LEAP_IN_C), taughtAt('practice.1'))).toEqual([]);
  });

  it('(2, guard) at 1.2 a left-hand leap inside 48–55 stays uncoped: the left position is 1.3’s', () => {
    expect(uncoped(rowOf('exercise.l120d.left-leap-in-c', LEFT_LEAP_IN_C), taughtAt('1.2'))).toContain('interval.leap');
  });

  it('(2, guard) at 0.3, where no position is taught, a right-hand leap inside 60–67 stays uncoped', () => {
    expect(uncoped(rowOf('exercise.l120d.leap-in-c', LEAP_IN_C), taughtAt('0.3'))).toContain('interval.leap');
  });

  it('(2, guard) at practice.1 a two-hand leap row stays uncoped: the floor stands on 1.1 alone', () => {
    expect(uncoped(rowOf('exercise.l120d.both-leap-in-c', BOTH_LEAP_IN_C), taughtAt('practice.1'))).toContain('interval.leap');
  });

  it('(2) at practice.1 the same row for a learner who has reached 1.3 is coped with (taughtAtRung’s second reading)', () => {
    expect(uncoped(rowOf('exercise.l120d.both-leap-in-c', BOTH_LEAP_IN_C), taughtAt('practice.1', ['1.3']))).toEqual([]);
  });

  it('(2, guard) a learner built without the positions gets nothing for a leap: the refusal stays, never the reverse', () => {
    const { positionTaught: _p, ...without } = taughtAt('1.2');
    expect(uncoped(rowOf('exercise.l120d.leap-in-c', LEAP_IN_C), without)).toEqual(['interval.skip', 'interval.leap']);
  });

  it('(3) no interval-reading evidence is inferred or awarded from the exemption, and the options it admits declare none', () => {
    // The shipped options whose leap a taught position now copes with at their own rung declare no interval-reading
    // target, so no run of one is ever read as interval-reading evidence (`evidence.ts` reads declared targets).
    const coped: string[] = [];
    for (const lesson of SHIPPED.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons))) {
      const learner = taughtAt(lesson.id);
      if (learner.taught?.('interval.leap') === true) continue;
      for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
        const item = CATALOG.find((row) => row.id === id);
        if (item === undefined || !Array.isArray(item.demands) || !item.demands.includes('interval.leap')) continue;
        if (!uncoped(item, learner).includes('interval.leap')) coped.push(`${lesson.id} ${id}`);
      }
    }
    expect(coped, 'the three Jingle Bells options are among them').toEqual(
      expect.arrayContaining(['1.2 song.holiday.jingle-bells.rh', 'holiday song.holiday.jingle-bells.rh', 'holiday song.holiday.jingle-bells.ht']),
    );
    for (const entry of coped) {
      const item = CATALOG.find((row) => row.id === entry.split(' ')[1]);
      expect(item?.targetSkills ?? [], entry).not.toContain('interval-reading');
    }

    // L120b's adversary (4), repeated for the leap: five correct runs of the in-position leap item, declaring no target.
    const runs = [1, 2, 3, 4, 5].map((day) => observe(LEAP_IN_C, { mode: 'tempo', at: `2026-09-2${String(day)}T10:00:00.000Z`, id: day, itemId: 'exercise.l120d.leap-in-c' }));
    const evidence = runs.flatMap((run) => evidenceFor({ observation: run, played: LEAP_IN_C, targetSkills: [], vocabulary: VOCABULARY_V0 }));
    expect(evidence, 'no evidence for a skill nobody declared').toEqual([]);
    const state = ladderState({ evidence: [], today: new Date('2026-09-30T12:00:00Z') }).state;
    expect(LADDER_STATES.indexOf(state), 'interval reading stays below familiar').toBeLessThan(LADDER_STATES.indexOf('familiar'));

    const learner: Learner = { ...taughtAt('1.2'), skillState: (skill) => (skill === 'interval-reading' ? state : undefined) };
    expect(uncoped(rowOf('song.l120d.leap-to-a', LEAP_TO_A), learner), 'an out-of-position leap stays uncoped').toContain('interval.leap');
    // The in-position leap is coped with by the position alone, whatever the skill state: the predicate reads none.
    for (const held of [undefined, ...LADDER_STATES]) {
      expect(uncoped(rowOf('exercise.l120d.leap-in-c', LEAP_IN_C), { ...taughtAt('1.2'), skillState: () => held }), String(held)).toEqual([]);
    }
  });

  it('(4, guard) at 1.2 a leap from C4 up to A4 (R 60–69, Kum Ba Yah’s reach) stays uncoped and refused', () => {
    const row = rowOf('song.l120d.leap-to-a', LEAP_TO_A);
    expect(uncoped(row, taughtAt('1.2'))).toContain('interval.leap');
    const verdict = eligibleFor(row, taughtAt('1.2'), { for: 'equivalent' });
    expect(verdict).toMatchObject({ verdict: 'ineligible', why: 'untaught' });
    expect(verdict.verdict === 'ineligible' && verdict.why === 'untaught' ? verdict.demands : []).toContain('interval.leap');
  });

  it('(4, guard) at 1.2 a leap from C4 up to C5 (R 60–72) stays uncoped', () => {
    expect(uncoped(rowOf('song.l120d.leap-to-c5', LEAP_TO_C5), taughtAt('1.2'))).toContain('interval.leap');
  });

  it('(4, guard) at 1.2 a left hand leaping inside 60–67, the right hand’s position, stays uncoped: a position is its own hand’s', () => {
    expect(uncoped(rowOf('exercise.l120d.left-leap-high', LEFT_LEAP_HIGH), taughtAt('1.2'))).toContain('interval.leap');
  });

  it('(4, guard) at 1.4 a two-hand row whose left hand reaches A3 (57) stays uncoped', () => {
    expect(uncoped(rowOf('song.l120d.both-left-to-a', BOTH_LEFT_TO_A), taughtAt('1.4'))).toContain('interval.leap');
  });

  it('(4, guard) an unmeasured row, a runtime reading row and a measured row with no span get nothing for a leap', () => {
    const refused = eligibleFor({ ...rowOf('song.l120d.unread', LEAP_IN_C), ...unmeasured('constructed: not measured') }, taughtAt('1.2'), { for: 'equivalent' });
    expect(refused).toMatchObject({ verdict: 'ineligible', why: 'unknown-forbidden' });
    expect(refused.verdict === 'ineligible' && refused.why === 'unknown-forbidden' ? refused.demands : []).toContain('interval.leap');
    const reading = CATALOG.find((item) => item.id === READING_ROW_WITH_LEAPS);
    expect(reading?.measurement).toMatchObject({ status: 'runtime' });
    expect(uncoped(reading as CatalogItem, taughtAt('1.2'))).toContain('interval.leap');
    const row = rowOf('exercise.l120d.no-span', LEAP_IN_C);
    const { span: _span, ...measurement } = row.measurement as Extract<CatalogItem['measurement'], { status: 'measured' }>;
    expect(uncoped({ ...row, measurement }, taughtAt('1.2'))).toEqual(['interval.skip', 'interval.leap']);
  });

  it('(5, guard) the demand stays a measured leap: the detector finds it, taughtAt stays 2.1, copedWithBy stays interval reading', () => {
    const row = rowOf('exercise.l120d.leap-in-c', LEAP_IN_C);
    expect(row.demands).toContain('interval.leap');
    expect(locatedOf(row)['interval.leap']).toBeGreaterThan(0);
    expect(leapOf()?.taughtAt).toEqual(['2.1']);
    expect(leapOf()?.copedWithBy).toBe('interval-reading');
    expect(leapOf()?.detector).toBe('leaps');
  });

  it('(5, guard) at 1.5, between the leap’s introduction and 2.1, an out-of-position leap stays uncoped', () => {
    // The two reach past a five-finger position too (`range.beyond-position`), a demand of its own, taught later.
    expect(uncoped(rowOf('song.l120d.leap-to-c5', LEAP_TO_C5), taughtAt('1.5'))).toContain('interval.leap');
    expect(uncoped(rowOf('song.l120d.leap-to-a', LEAP_TO_A), taughtAt('1.5'))).toContain('interval.leap');
    expect(uncoped(rowOf('song.l120d.leap-to-c5', LEAP_TO_C5), taughtAt('2.1')), 'taught from 2.1 as before').not.toContain('interval.leap');
  });

  it('(6, guard) one fact in two places: the leap’s positions equal the skip’s', () => {
    expect(leapOf()?.fixedPositions).toBeDefined();
    expect(leapOf()?.fixedPositions).toEqual(skipOf()?.fixedPositions);
  });
});
