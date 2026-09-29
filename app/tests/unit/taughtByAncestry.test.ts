/**
 * "Taught by this rung" is the rung's ancestry, never the curriculum file's order
 * (E0a; the reviewer's finding 1 on E0, `docs/review/responses/f3b75b7.md`).
 *
 * The curriculum is not one line: from Stage 5 the tracks run in parallel, and a
 * learner on the jazz track has never met what the blues track teaches. The
 * predicate read "taught" from the teaching lesson's place in the flattened file —
 * `blues.5` is stored before `jazz.5`, so the walking bass read as taught at `jazz.5`
 * and at every rung stored after it, on every track. The ancestry is what every
 * learner at a rung has been through in the app's own model (`docs/04` §2, the
 * strands): on the core path, every core rung before it in stage-and-unit order (the
 * spine is walked in that order, and its `prerequisites` do not say all of it — 4.6's
 * lack 3.4, 4.7 has none); on a track, its `prerequisites`, followed back, and the
 * core path up to the track rung's stage, which is where a track opens. A learner's
 * own path is the second reading: a demand taught at a rung they have reached is
 * taught for them, wherever they are judged.
 *
 * Each case is written to fail on the committed predicate with the demand, the rung
 * and the lesson the file's order credited.
 *
 * Since E0b a demand can name more than one teaching rung (`taughtAt` is a list, one
 * rung per path): the walking bass is `blues.5`'s, `jazz.6`'s and `jam.6`'s, and is
 * taught wherever any of them is on the rung's path or in the learner's reached set
 * (the last `describe`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as session from '../../src/curriculum/session';
import { buildSession, readingOptions, swapOptions, taughtAtRung, type SessionSlot } from '../../src/curriculum/session';
import { targetDemandsFor } from '../../src/curriculum/eligibility';
import { indexCatalog } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { READING_CONTROLS } from '../../src/engine/readingControls';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { measured } from './helpers/measured';

const CONTENT = join(process.cwd(), 'public', 'content');
const SHIPPED = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const CATALOG = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const TODAY = new Date(2026, 9, 20, 9);
const WALK = 'texture.walking-bass';

/** The ancestry map, where the module has one (it did not before E0a, which is how this file ran red there). */
const ancestryOf = (curriculum: Curriculum): ReadonlyMap<string, ReadonlySet<string>> | undefined =>
  (session as unknown as { rungAncestry?: (c: Curriculum) => ReadonlyMap<string, ReadonlySet<string>> }).rungAncestry?.(curriculum);

const lesson = (id: string, over: Partial<Lesson> = {}): Lesson => ({
  id,
  title: `Lesson ${id}`,
  concepts: [],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'any', count: 1 }],
  ...over,
});

/**
 * A core path and two sibling tracks from it, track A stored before track B at every
 * stage — so the file's order puts A.5 before B.5 and A.6 before B.6. A.5 teaches the
 * walking bass (the demand X of the brief); B teaches nothing of it.
 */
function twoTracks(options: { b6?: Partial<Lesson>; b5?: Partial<Lesson> } = {}): Curriculum {
  return {
    version: 1,
    tracks: [
      { id: 'core', title: 'Core', description: '', startsAtStage: 0 },
      { id: 'A', title: 'Track A', description: '', startsAtStage: 5 },
      { id: 'B', title: 'Track B', description: '', startsAtStage: 5 },
    ],
    stages: [
      { number: 1, title: 'One', summary: '', units: [{ id: 'core.1', title: 'C1', track: 'core', lessons: [lesson('core.1')] }] },
      { number: 4, title: 'Four', summary: '', units: [{ id: 'core.4', title: 'C4', track: 'core', lessons: [lesson('core.4', { prerequisites: ['core.1'] })] }] },
      {
        number: 5,
        title: 'Five',
        summary: '',
        units: [
          { id: 'A.5', title: 'A5', track: 'A', lessons: [lesson('A.5', { prerequisites: ['core.4'] })] },
          { id: 'B.5', title: 'B5', track: 'B', lessons: [lesson('B.5', { prerequisites: ['core.4'], ...options.b5 })] },
        ],
      },
      {
        number: 6,
        title: 'Six',
        summary: '',
        units: [
          { id: 'A.6', title: 'A6', track: 'A', lessons: [lesson('A.6', { prerequisites: ['A.5'] })] },
          { id: 'B.6', title: 'B6', track: 'B', lessons: [lesson('B.6', { prerequisites: ['B.5'], ...options.b6 })] },
        ],
      },
    ],
  };
}

/** Vocabulary v0 with the walking bass taught at the listed rungs (E0b: `taughtAt` is a list). */
const walkTaughtAt = (...rungs: string[]): Vocabulary => ({
  ...VOCABULARY_V0,
  demands: VOCABULARY_V0.demands.map((demand) => (demand.id === WALK ? { ...demand, taughtAt: rungs } : demand)),
});
/** Vocabulary v0 with the walking bass taught at A.5. */
const X_AT_A5: Vocabulary = walkTaughtAt('A.5');

describe('two sibling tracks: a demand taught on one is not taught on the other', () => {
  const curriculum = twoTracks();
  const at = (rung: string, reached?: readonly string[]) => taughtAtRung(curriculum, rung, X_AT_A5, reached);

  it('X is taught at A.5 and at A.6', () => {
    expect(at('A.5')?.(WALK), 'X at A.5, the rung that teaches it').toBe(true);
    expect(at('A.6')?.(WALK), 'X at A.6, which builds on A.5').toBe(true);
  });

  it('X is not taught at B.5, at B.6, or at core.4', () => {
    expect(at('B.5')?.(WALK), 'X at B.5: the file’s order credited A.5, stored before B.5').toBe(false);
    expect(at('B.6')?.(WALK), 'X at B.6: the file’s order credited A.5, stored before B.6').toBe(false);
    expect(at('core.4')?.(WALK), 'X at core.4, before either track').toBe(false);
  });

  it('with the learner’s own path, X is taught on B.6 for a learner who reached A.5', () => {
    expect(at('B.6', ['core.1', 'core.4', 'A.5', 'B.5', 'B.6'])?.(WALK), 'X at B.6 for a learner whose reached set holds A.5').toBe(true);
    expect(at('B.6', ['core.1', 'core.4', 'B.5', 'B.6'])?.(WALK), 'X at B.6 for a learner who reached only core and B').toBe(false);
  });

  it('a rung the curriculum lacks, and no rung, still read as no rung judging', () => {
    expect(taughtAtRung(curriculum, 'Z.9', X_AT_A5)).toBeUndefined();
    expect(taughtAtRung(curriculum, undefined, X_AT_A5)).toBeUndefined();
  });

  it('the ancestry is worked out once per curriculum: the same object gives the same set', () => {
    const first = ancestryOf(curriculum);
    expect(first, 'rungAncestry is exported').toBeDefined();
    expect(ancestryOf(curriculum)).toBe(first);
    expect(ancestryOf(curriculum)?.get('B.6')).toBe(first?.get('B.6'));
    expect([...(first?.get('B.6') ?? [])].sort()).toEqual(['B.5', 'B.6', 'core.1', 'core.4']);
    expect([...(first?.get('A.6') ?? [])].sort()).toEqual(['A.5', 'A.6', 'core.1', 'core.4']);
  });
});

describe('the shipped curriculum', () => {
  const taught = (rung: string, demand: string): boolean | undefined => taughtAtRung(SHIPPED, rung)?.(demand);

  // Revised (E0b): jazz.6 left this case. Old assumption (E0a's brief, item 3): jazz.6 is not a teaching
  // rung, so the walking bass is untaught there. Its lesson teaches a walking line and assigns one, and
  // the vocabulary lists it (`describe` 'a demand taught at more than one rung', below).
  // Revised (F2 item 1): blues.5 introduces the walking bass (its exercise is the line alone, left hand
  // only) and blues.6, whose exercise puts a right hand over it, teaches it. Old assumption: blues.5 teaches it.
  it('the walking bass is taught at blues.6, not at blues.5, jazz.5 or classical.5', () => {
    expect(taught('blues.5', WALK), `${WALK} at blues.5, which introduces it`).toBe(false);
    expect(taught('blues.6', WALK), `${WALK} at blues.6, the blues path's teaching rung`).toBe(true);
    expect(taught('jazz.5', WALK), `${WALK} at jazz.5: the file’s order credited the blues track, stored before jazz.5`).toBe(false);
    expect(taught('classical.5', WALK), `${WALK} at classical.5`).toBe(false);
  });

  it('the same fault at Stage 3: ledger lines (3.4) are not taught at blues.3, whose path leaves the core at 3.2', () => {
    expect(taught('blues.3', 'pitch.ledger'), 'pitch.ledger at blues.3: the file’s order credited 3.4, stored before blues.3').toBe(false);
    expect(taught('classical.3', 'pitch.ledger'), 'pitch.ledger at classical.3, which builds on 3.4').toBe(true);
  });

  it('a track rung stands on the core path up to its stage: syncopation (4.5) is taught at jazz.5', () => {
    // jazz.5 → chords-pop.5 → chords-pop.4 → chords-pop.3 → 3.2: the prerequisites alone stop at 3.2,
    // but a Stage 5 track opens only once the core path is done (`docs/04` §2, `strandsOf`).
    expect(taught('jazz.5', 'rhythm.syncopation'), 'rhythm.syncopation at jazz.5').toBe(true);
    expect(taught('jazz.5', 'texture.left-hand-pattern'), 'texture.left-hand-pattern (3.6) at jazz.5').toBe(true);
    expect(taught('classical.5', 'texture.left-hand-pattern'), 'texture.left-hand-pattern (3.6) at classical.5').toBe(true);
  });

  it('on the core path (Stages 0–4): a demand taught at 2.5 is taught at 3.1 and not at 2.2', () => {
    expect(taught('3.1', 'range.beyond-position'), 'range.beyond-position at 3.1').toBe(true);
    expect(taught('2.2', 'range.beyond-position'), 'range.beyond-position at 2.2').toBe(false);
  });

  it('the core path is its stage-and-unit order: 1.5’s ancestry is 0.1–1.5, 4.6’s every core rung to it, 3.4 included', () => {
    const ancestry = ancestryOf(SHIPPED);
    const core = SHIPPED.stages.flatMap((stage) => stage.units.filter((unit) => unit.track === 'core').flatMap((unit) => unit.lessons.map((one) => one.id)));
    const upTo = (id: string): string[] => core.slice(0, core.indexOf(id) + 1).sort();
    expect([...(ancestry?.get('1.5') ?? [])].sort()).toEqual(upTo('1.5'));
    expect([...(ancestry?.get('4.6') ?? [])].sort()).toEqual(upTo('4.6'));
    // 4.6's prerequisites, followed back, never reach 3.4 (3.5 builds on 3.3, 3.4 on 3.1), and every
    // learner on the spine walks 3.4 before 3.5: ledger lines are taught at 4.6, and at 4.7, which names none.
    expect(taught('4.6', 'pitch.ledger'), 'pitch.ledger at 4.6').toBe(true);
    expect(taught('4.7', 'rhythm.syncopation'), 'rhythm.syncopation (4.5) at 4.7').toBe(true);
  });

  it('the build reads the same ancestry: the rung-claims report’s "untaught here" and the gate read one thing', () => {
    // `tools/content/claims.py`'s `rung_ancestry`, as the content build wrote it beside the report.
    const report = JSON.parse(readFileSync(join(process.cwd(), '..', 'build', 'rung-claims.json'), 'utf8')) as { ancestry?: Record<string, string[]> };
    const app = ancestryOf(SHIPPED);
    expect(report.ancestry, 'build/rung-claims.json carries every rung’s ancestry').toBeDefined();
    expect(Object.keys(report.ancestry ?? {}).length).toBe(app?.size);
    const differ = [...(app?.entries() ?? [])]
      .filter(([rung, members]) => JSON.stringify([...members].sort()) !== JSON.stringify(report.ancestry?.[rung]))
      .map(([rung]) => rung);
    expect(differ).toEqual([]);
  });

  it('the file’s order decides nothing: with every stage’s track units stored before its core units, every rung teaches the same', () => {
    const reordered: Curriculum = {
      ...SHIPPED,
      stages: SHIPPED.stages.map((stage) => ({ ...stage, units: [...stage.units.filter((u) => u.track !== 'core'), ...stage.units.filter((u) => u.track === 'core')] })),
    };
    const moved: string[] = [];
    for (const stage of SHIPPED.stages) {
      for (const unit of stage.units) {
        for (const rung of unit.lessons) {
          for (const demand of VOCABULARY_V0.demands) {
            const before = taughtAtRung(SHIPPED, rung.id)?.(demand.id);
            const after = taughtAtRung(reordered, rung.id)?.(demand.id);
            if (before !== after) moved.push(`${demand.id} at ${rung.id}: ${String(before)} as shipped, ${String(after)} reordered`);
          }
        }
      }
    }
    expect(moved).toEqual([]);
  });
});

describe('the gate’s consumers read the learner’s own path', () => {
  const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({
    id,
    type: 'exercise',
    title: id,
    level: 5,
    hands: 'both',
    tracks: ['B'],
    concepts: [],
    file: `scores/${id}.mxl`,
    ...over,
  });

  it('the swap sheet on B.6: a walking-bass option is refused unless the learner reached A.5', () => {
    const curriculum = twoTracks({ b6: { songOptions: ['song.b6', 'song.walks'] } });
    const row = item('song.b6', { type: 'song', ...measured([]) });
    const items = [row, item('song.walks', { type: 'song', ...measured([WALK]) })];
    const catalog = indexCatalog(items);
    const slot: SessionSlot = { kind: 'repertoire', minutes: 5, item: row, lessonId: 'B.6', reason: '' };
    const offered = (reached?: readonly string[]) =>
      swapOptions(slot, [slot], curriculum, catalog, {
        items,
        rung: 'B.6',
        vocabulary: X_AT_A5,
        ...(reached === undefined ? {} : { reached }),
      }).map((option) => option.item.id);
    expect(offered(), 'song.walks on B.6’s sheet with no path given: the file’s order credited A.5').not.toContain('song.walks');
    expect(offered(['core.1', 'core.4', 'B.5', 'B.6']), 'song.walks for a learner who reached only core and B').not.toContain('song.walks');
    expect(offered(['core.1', 'core.4', 'A.5', 'A.6', 'B.5', 'B.6']), 'song.walks for a learner who reached A.5').toContain('song.walks');
  });

  it('the session on B.6: the warm-up serves B.6’s hand-independence ask with walking-bass drills only for a learner whose path went through A.5', () => {
    // B.6 asks for hand independence, and its own drill (a walking bass) cannot be played. For a learner who
    // reached A.5 the gate passes that drill into the ask, which waits for the fallback ladder, and the skill
    // step offers B.5's walking-bass drill through the gate. For one who did not, the gate refuses B.6's drill,
    // the rung asks nothing a warm-up can serve, and the exposure rule fills the slot: never the skill step.
    const curriculum = twoTracks({
      b5: { exerciseOptions: ['ex.walks'] },
      b6: { exerciseOptions: ['ex.b6'], requirements: [{ kind: 'skill', skill: 'hand-independence', state: 'familiar' }] },
    });
    const items = [
      item('ex.b6', { targetSkills: ['hand-independence'], file: null, ...measured([WALK]) }),
      item('ex.walks', { targetSkills: ['hand-independence'], ...measured([WALK]) }),
    ];
    const warmup = (activeTracks: string[]) =>
      buildSession({
        curriculum,
        catalog: indexCatalog(items),
        items,
        states: rungState([], curriculum, X_AT_A5, TODAY),
        rows: [],
        learned: [],
        lastPlayed: new Map(),
        activeTracks,
        minutes: 15,
        // Everything before B.6 behind the placement: passed, so reached (the walk of the tracks switched on).
        startAt: 'B.6',
        today: TODAY,
        skillActivation: EVERY_DECLARED_SKILL,
        vocabulary: X_AT_A5,
      }).slots.find((one) => one.kind === 'technique');
    const withA = warmup(['core', 'A', 'B']);
    expect(withA?.item?.id).toBe('ex.walks');
    expect(withA?.claim?.kind, 'the skill step, for a learner who reached A.5').toBe('skill');
    const withoutA = warmup(['core', 'B']);
    expect(withoutA?.claim?.kind, 'the exposure rule on B.6, never the skill step: the file’s order credited A.5').toBe('exposure');
  });
});

/**
 * A demand taught at more than one rung (E0b; the reviewer's finding 2 on E0a,
 * `docs/review/responses/5bfe6d2.md`). `taughtAt` named one rung, the first in the
 * file whose concepts named the demand, so the walking bass was `blues.5`'s alone and a
 * learner through `jazz.6` — whose lesson teaches a walking line and assigns one — was
 * withheld it at `jazz.8`. It is now every rung that teaches the demand, one per path,
 * and a demand is taught when any listed rung is in the rung's ancestry or the
 * learner's reached set. Each case fails on the committed vocabulary and predicate with
 * the demand and the rung, except the ones marked as holding already.
 */
describe('a demand taught at more than one rung', () => {
  const WALK_ON_TWO_TRACKS = walkTaughtAt('A.5', 'B.6');

  it('two listed rungs on sibling tracks: taught on each path from its own rung, never before it', () => {
    const curriculum = twoTracks();
    const at = (rung: string, reached?: readonly string[]) => taughtAtRung(curriculum, rung, WALK_ON_TWO_TRACKS, reached);
    expect(at('A.5')?.(WALK), 'X at A.5, a listed rung').toBe(true);
    expect(at('A.6')?.(WALK), 'X at A.6, which builds on A.5').toBe(true);
    expect(at('B.6')?.(WALK), 'X at B.6, the other listed rung, whose path never reaches A.5').toBe(true);
    expect(at('B.5')?.(WALK), 'X at B.5, before B.6 on its track: B.6 teaches it later').toBe(false);
    expect(at('core.4')?.(WALK), 'X at core.4, before either track').toBe(false);
    expect(at('B.5', ['core.1', 'core.4', 'A.5', 'B.5'])?.(WALK), 'X at B.5 for a learner who reached A.5').toBe(true);
  });

  const taught = (rung: string, demand: string, reached?: readonly string[]): boolean | undefined =>
    taughtAtRung(SHIPPED, rung, VOCABULARY_V0, reached)?.(demand);

  it('(a) jazz.6 teaches the walking bass to a learner who never reached blues.5, and so does every jazz rung after it', () => {
    expect(ancestryOf(SHIPPED)?.get('jazz.6')?.has('blues.5'), 'jazz.6’s path goes through blues.5').toBe(false);
    for (const rung of ['jazz.6', 'jazz.7', 'jazz.8', 'jazz.9']) {
      expect(taught(rung, WALK), `${WALK} at ${rung}: jazz.6 teaches it, on ${rung}’s path`).toBe(true);
    }
    expect(taught('jam.6', WALK), `${WALK} at jam.6: “Walking bass, when there is no bass player”`).toBe(true);
  });

  it('(b) reading row 7 at jazz.8 may write its walking bass again; at theory.9 it still may not', () => {
    const row = CATALOG.find((one) => one.id === 'drill.reading.sight-reading-7') as CatalogItem;
    const walks = READING_CONTROLS[WALK] as (typeof READING_CONTROLS)[string];
    const mayWrite = (rung: string) => walks.mayWrite(readingOptions(row, undefined, 1, taughtAtRung(SHIPPED, rung)));
    expect(mayWrite('jazz.8'), `row 7 opened from jazz.8: ${WALK} held out though jazz.6 taught it`).toBe(true);
    // Holding already: theory.9's path reaches no teaching rung (the reviewer's finding 3).
    expect(mayWrite('theory.9'), `row 7 opened from theory.9: ${WALK} written off the path`).toBe(false);
    expect(taught('theory.9', WALK), `${WALK} at theory.9`).toBe(false);
  });

  it('(c) classical.6 and chords-pop.6 still do not inherit it by adjacency (holding already); a learner who reached jazz.6 carries it there', () => {
    expect(taught('classical.6', WALK), `${WALK} at classical.6`).toBe(false);
    expect(taught('chords-pop.6', WALK), `${WALK} at chords-pop.6, the track jazz.5 builds on`).toBe(false);
    expect(taught('chords-pop.6', WALK, ['chords-pop.5', 'chords-pop.6']), `${WALK} at chords-pop.6 for a learner who stayed on it`).toBe(false);
    expect(taught('chords-pop.6', WALK, ['jazz.5', 'jazz.6']), `${WALK} at chords-pop.6 for a learner who reached jazz.6`).toBe(true);
  });

  it('“something else like this” on jazz.6: the demand tier wants the walking bass jazz.6 teaches', () => {
    const walking: CatalogItem = { id: 'song.walks', type: 'song', title: 'A walk', level: 6, hands: 'both', tracks: ['jazz'], concepts: [], file: 'scores/song.walks.mxl', ...measured([WALK]) };
    expect(targetDemandsFor(walking, 'jazz.6'), `${WALK} is among what jazz.6 teaches`).toEqual([WALK]);
    // Revised (F2 item 1): blues.6 teaches it and blues.5 only introduces it; the old line held blues.5.
    expect(targetDemandsFor(walking, 'blues.6')).toEqual([WALK]);
    expect(targetDemandsFor(walking, 'blues.5'), 'blues.5 introduces the walking bass: nothing it teaches').toEqual([]);
    expect(targetDemandsFor(walking, 'jazz.7'), 'jazz.7 teaches nothing of it itself').toEqual([]);
  });

  /** A stored run showing hand independence at the practice standard: familiar on one supporting record. */
  const handsShown = (): SessionRow => ({
    itemId: 'drill.walks',
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1000,
    at: new Date(2026, 9, 19, 12).toISOString(),
    evidenceDefinitions: EVIDENCE_DEFINITIONS,
    evidence: [
      {
        kind: 'measured',
        skill: 'hand-independence',
        standard: 'practice',
        n: 8,
        right: 8,
        at: new Date(2026, 9, 19, 12).toISOString(),
        observationId: 1,
        context: { itemId: 'drill.walks', firstContact: true, met: ['keep-tempo', 'both-hands'], unattributed: 0, estimated: false },
        byDemand: [],
      } as unknown as MeasuredEvidence,
    ],
  });

  it('the repertoire slot’s claim on the shipped jazz.6: its strand’s edges name the walking bass', () => {
    const TODAY_AT = new Date(2026, 9, 20, 9);
    const shown = handsShown();
    const walks: CatalogItem = { id: 'song.walks', type: 'song', title: 'A walk', level: 6, hands: 'both', tracks: ['jazz'], concepts: [], file: 'scores/song.walks.mxl', ...measured([WALK]) };
    const slot = buildSession({
      curriculum: SHIPPED,
      catalog: indexCatalog([walks]),
      items: [walks],
      states: rungState([shown], SHIPPED, VOCABULARY_V0, TODAY_AT),
      rows: [shown],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core', 'jazz'],
      minutes: 30,
      startAt: 'jazz.6',
      today: TODAY_AT,
    }).slots.find((one) => one.kind === 'repertoire');
    expect(slot?.claim, `the repertoire claim for a learner placed at jazz.6, which teaches ${WALK}`).toMatchObject({ kind: 'ready', demand: WALK });
  });

  it('the repertoire slot’s claim on B.6: a strand on a listed rung offers a piece with the demand it teaches', () => {
    const TODAY_AT = new Date(2026, 9, 20, 9);
    const curriculum = twoTracks({ b6: { songOptions: ['song.b6'] } });
    const shown = handsShown();
    const items: CatalogItem[] = [
      { id: 'song.b6', type: 'song', title: 'B6', level: 6, hands: 'both', tracks: ['B'], concepts: [], file: 'scores/song.b6.mxl', ...measured([]) },
      { id: 'song.walks', type: 'song', title: 'A walk', level: 6, hands: 'both', tracks: ['B'], concepts: [], file: 'scores/song.walks.mxl', ...measured([WALK]) },
    ];
    const slot = buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([shown], curriculum, WALK_ON_TWO_TRACKS, TODAY_AT),
      rows: [shown],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core', 'B'],
      minutes: 30,
      startAt: 'B.6',
      today: TODAY_AT,
      vocabulary: WALK_ON_TWO_TRACKS,
    }).slots.find((one) => one.kind === 'repertoire');
    expect(slot?.claim, `the repertoire claim on B.6, which the vocabulary lists for ${WALK}`).toMatchObject({ kind: 'ready', demand: WALK });
    expect(slot?.item?.id).toBe('song.walks');
  });
});

/**
 * A demand a rung only introduces is not taught (F2 item 7; the reviewer's required change,
 * `docs/review/responses/12af708.md`). A lesson's `introduces` list names a measurable demand the rung
 * introduces while no piece there practises it yet. The build's derivation (`claims.teaching_rungs`)
 * reads `concepts` alone, so `taughtAt` never names an introducing rung, and the app reads `taughtAt`,
 * never a lesson's lists: a later option carrying the demand on the same path stays untaught for every
 * gate consumer. The constructed vocabularies below are what the derivation gives each curriculum (no
 * rung for an introduction, A.5 for a lesson that names the concept). The shipped case: `blues.5`
 * introduces the walking bass (its exercise is the line alone), `blues.6` teaches it.
 */
describe('a demand a rung only introduces is not taught (F2)', () => {
  const withA = (a5: Partial<Lesson>, a6: Partial<Lesson>): Curriculum => {
    const curriculum = twoTracks();
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        unit.lessons = unit.lessons.map((one) => (one.id === 'A.5' ? { ...one, ...a5 } : one.id === 'A.6' ? { ...one, ...a6 } : one));
      }
    }
    return curriculum;
  };
  const item = (id: string, demands: readonly string[]): CatalogItem => ({
    id,
    type: 'song',
    title: id,
    level: 6,
    hands: 'both',
    tracks: ['A'],
    concepts: [],
    file: `scores/${id}.mxl`,
    ...measured([...demands]),
  });

  const offeredOnA6 = (curriculum: Curriculum, vocabulary: Vocabulary): string[] => {
    const row = item('song.a6', []);
    const items = [row, item('song.walks', [WALK])];
    const slot: SessionSlot = { kind: 'repertoire', minutes: 5, item: row, lessonId: 'A.6', reason: '' };
    return swapOptions(slot, [slot], curriculum, indexCatalog(items), { items, rung: 'A.6', vocabulary }).map((option) => option.item.id);
  };

  it('a later option carrying the demand on the same path is untaught when the earlier rung only introduces it', () => {
    // `introduces` is the build's field; the app's `Lesson` type does not name it because nothing in the app reads it.
    const introducing = { introduces: ['walking-bass'] } as Partial<Lesson & { introduces: readonly string[] }>;
    const curriculum = withA(introducing, { songOptions: ['song.a6', 'song.walks'] });
    const nothingTeachesIt = walkTaughtAt();
    expect(taughtAtRung(curriculum, 'A.6', nothingTeachesIt)?.(WALK), `${WALK} at A.6: A.5 only introduced it`).toBe(false);
    expect(offeredOnA6(curriculum, nothingTeachesIt), 'song.walks on A.6’s sheet: its walk is untaught there').not.toContain('song.walks');
  });

  it('and taught when an earlier rung genuinely teaches it', () => {
    const curriculum = withA({ concepts: ['walking-bass'] }, { songOptions: ['song.a6', 'song.walks'] });
    const a5TeachesIt = walkTaughtAt('A.5');
    expect(taughtAtRung(curriculum, 'A.6', a5TeachesIt)?.(WALK), `${WALK} at A.6: A.5 teaches it, on A.6’s path`).toBe(true);
    expect(offeredOnA6(curriculum, a5TeachesIt), 'song.walks on A.6’s sheet once A.5 teaches the walk').toContain('song.walks');
  });

  it('on the shipped curriculum: blues.5 introduces the walking bass and is no teaching rung; blues.6 teaches it', () => {
    const blues5 = SHIPPED.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons)).find((one) => one.id === 'blues.5') as Lesson & {
      introduces?: readonly string[];
    };
    expect(blues5.introduces, 'blues.5’s introduces list names the walking bass').toContain('walking-bass');
    expect(blues5.concepts).not.toContain('walking-bass');
    const listed = VOCABULARY_V0.demands.find((demand) => demand.id === WALK)?.taughtAt ?? [];
    expect(listed, 'taughtAt never names an introducing rung').not.toContain('blues.5');
    expect(taughtAtRung(SHIPPED, 'blues.5')?.(WALK), `${WALK} at blues.5`).toBe(false);
    expect(taughtAtRung(SHIPPED, 'blues.6')?.(WALK), `${WALK} at blues.6`).toBe(true);
  });
});

/**
 * The core's teaching truth at actual opportunity (F2a; the reviewer's required change on F2,
 * `docs/review/responses/b41e19e.md`). No option on 1.5 establishes a leap and none on 3.1 a note
 * outside the key; they were taught there by a hand reading of the lessons. 1.5 and 3.1 now introduce
 * them, and 2.1 (the left hand's moves from C to F and to G) and 3.3 (A minor's raised seventh) name
 * them, so the vocabulary's derived `taughtAt` is 2.1 and 3.3. Every gate consumer reads `taughtAt`
 * against the rung's ancestry: what a rung has taught, what it teaches itself (`targetDemandsFor`),
 * and the reading hold (`readingOptions`). Each case below fails on the vocabulary before F2a, except
 * the ones marked as holding already.
 */
describe('the core teaches the leap at 2.1 and the note outside the key at 3.3 (F2a)', () => {
  const LEAP = 'interval.leap';
  const CHROMATIC = 'pitch.chromatic';
  const taught = (rung: string, demand: string): boolean | undefined => taughtAtRung(SHIPPED, rung)?.(demand);

  it('the leap: untaught at 1.5, which only introduces it, and on holiday, whose path leaves the core there; taught from 2.1', () => {
    expect(taught('1.4', LEAP), `${LEAP} at 1.4 (holding already)`).toBe(false);
    expect(taught('1.5', LEAP), `${LEAP} at 1.5, which introduces it`).toBe(false);
    expect(taught('holiday', LEAP), `${LEAP} at holiday, whose path leaves the core at 1.5`).toBe(false);
    expect(taught('2.1', LEAP), `${LEAP} at 2.1, the core's teaching rung`).toBe(true);
    expect(taught('2.2', LEAP), `${LEAP} at 2.2`).toBe(true);
  });

  it('the note outside the key: untaught at 3.1, which only introduces it, at 3.2 and on blues.3; taught from 3.3', () => {
    expect(taught('3.1', CHROMATIC), `${CHROMATIC} at 3.1, which introduces accidentals`).toBe(false);
    expect(taught('3.2', CHROMATIC), `${CHROMATIC} at 3.2`).toBe(false);
    expect(taught('blues.3', CHROMATIC), `${CHROMATIC} at blues.3, whose path leaves the core at 3.2`).toBe(false);
    expect(taught('3.3', CHROMATIC), `${CHROMATIC} at 3.3, the core's teaching rung (holding already)`).toBe(true);
    expect(taught('technique.4', CHROMATIC), `${CHROMATIC} at technique.4, whose chromatic scale stands on 3.3 (holding already)`).toBe(true);
  });

  it('a later option carrying the demand: 2.1 and 3.3 teach it themselves, 1.5 and 3.1 teach it no more', () => {
    const song = (id: string, demand: string): CatalogItem => ({ id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...measured([demand]) });
    const leaping = song('song.leaps', LEAP);
    const outside = song('song.outside', CHROMATIC);
    expect(targetDemandsFor(leaping, '1.5'), `${LEAP}: 1.5 introduces it, it teaches nothing of it`).toEqual([]);
    expect(targetDemandsFor(leaping, '2.1'), `${LEAP} is among what 2.1 teaches`).toEqual([LEAP]);
    expect(targetDemandsFor(outside, '3.1'), `${CHROMATIC}: 3.1 introduces it`).toEqual([]);
    expect(targetDemandsFor(outside, '3.3'), `${CHROMATIC} is among what 3.3 teaches`).toEqual([CHROMATIC]);
  });

  it('the reading hold follows it: row 2 opened from 1.5 holds its leaps out and from 2.1 writes them; row 4 opened from 3.1 holds its accidentals out and from 3.3 writes them', () => {
    const row = (id: string): CatalogItem => CATALOG.find((one) => one.id === id) as CatalogItem;
    const held = (id: string, rung: string) => readingOptions(row(id), undefined, 1, taughtAtRung(SHIPPED, rung));
    const leaps = READING_CONTROLS[LEAP] as (typeof READING_CONTROLS)[string];
    const accidentals = READING_CONTROLS[CHROMATIC] as (typeof READING_CONTROLS)[string];
    expect(held('drill.reading.sight-reading-2', '1.5').leaps, `row 2 opened from 1.5: ${LEAP} not held out`).toBe(false);
    expect(leaps.mayWrite(held('drill.reading.sight-reading-2', '2.1')), `row 2 opened from 2.1: ${LEAP} held out though 2.1 teaches it`).toBe(true);
    expect(accidentals.mayWrite(held('drill.reading.sight-reading-4', '3.1')), `row 4 opened from 3.1: ${CHROMATIC} written though untaught`).toBe(false);
    expect(accidentals.mayWrite(held('drill.reading.sight-reading-4', '3.3')), `row 4 opened from 3.3: ${CHROMATIC} held out though 3.3 teaches it`).toBe(true);
  });

  it('the practice track walks its own rungs (F2a item 3): each stands on the one before, and no other rung stands on one', () => {
    const ancestry = ancestryOf(SHIPPED);
    for (let n = 2; n <= 5; n += 1) {
      const members = ancestry?.get(`practice.${String(n)}`);
      for (let k = 1; k < n; k += 1) expect(members?.has(`practice.${String(k)}`), `practice.${String(n)} stands on practice.${String(k)}`).toBe(true);
    }
    const outside = [...(ancestry?.entries() ?? [])]
      .filter(([rung, members]) => !rung.startsWith('practice.') && [...members].some((one) => one.startsWith('practice.')))
      .map(([rung]) => rung);
    expect(outside, 'a practice prerequisite changed another rung’s ancestry').toEqual([]);
  });
});

/**
 * The practice floor stands on 1.1 (F2b; the reviewer's required change on F2a,
 * `docs/review/responses/fc91e5a.md`, part 1). `practice.1` named no core rung, so its
 * path stopped at Stage 0 and the five-finger pattern and *Ode to Joy* on it read as
 * untaught, though a learner there stands on 1.1. It names 1.1 now: its path, and every
 * practice rung's after it, holds 1.1 and no later Stage 1 rung, so what 1.1 teaches is
 * taught on the track and the steps-and-skips study's skips (1.5's) are not. The track
 * opens once 1.1 is met, set aside or behind the placement (`strandsOf`): from the
 * second rung of Stage 1 (`docs/02` D8a). Each case fails on the stage file before F2b.
 */
describe('the practice floor stands on 1.1 (F2b)', () => {
  const taught = (rung: string, demand: string): boolean | undefined => taughtAtRung(SHIPPED, rung)?.(demand);

  it('every practice rung’s path holds 1.1 and no later Stage 1 rung; steps are taught there and skips are not', () => {
    const ancestry = ancestryOf(SHIPPED);
    for (let n = 1; n <= 5; n += 1) {
      const rung = `practice.${String(n)}`;
      const stageOne = [...(ancestry?.get(rung) ?? [])].filter((one) => one.startsWith('1.')).sort();
      expect(stageOne, `${rung}'s Stage 1 path`).toEqual(['1.1']);
    }
    expect(taught('practice.1', 'interval.step'), 'interval.step at practice.1: 1.1 teaches it, on its path').toBe(true);
    expect(taught('practice.1', 'interval.skip'), 'interval.skip at practice.1: 1.5 teaches it, off its path').toBe(false);
    expect(taught('practice.3', 'interval.step'), 'interval.step at practice.3, which stands on practice.1').toBe(true);
  });

  it('Today’s practice row: absent for a learner placed at 1.1, there from 1.2, and the floor case at 1.5 unchanged', () => {
    const items = CATALOG;
    const practiceRows = (startAt: string): string[] =>
      buildSession({
        curriculum: SHIPPED,
        catalog: indexCatalog(items),
        items,
        states: rungState([], SHIPPED, VOCABULARY_V0, TODAY),
        rows: [],
        learned: [],
        lastPlayed: new Map(),
        activeTracks: defaultActiveTracks(SHIPPED),
        minutes: 30,
        startAt,
        today: TODAY,
      })
        .slots.filter((slot) => {
          const claim = slot.claim;
          const rung = claim !== undefined && 'rung' in claim ? claim.rung.id : undefined;
          return rung?.startsWith('practice.') === true;
        })
        .map((slot) => `${slot.kind} ${slot.item?.id ?? '-'} (${slot.claim !== undefined && 'rung' in slot.claim ? slot.claim.rung.id : '-'})`);
    expect(defaultActiveTracks(SHIPPED), 'the practice track is on by default').toContain('practice');
    expect(practiceRows('1.1'), 'placed at 1.1: practice.1 waits for 1.1').toEqual([]);
    // Revised (X1 item 7, the practice row's place as a stated teaching policy; the F2b review's constraint):
    // the new piece is the learner's own rung's new material first, and How to practise's row second — here
    // the repertoire slot takes practice.1's song. Old assumption: the balance rule's order, which gave the
    // new slot to the newly opened practice rung because the warm-up had served the spine already.
    expect(practiceRows('1.2'), 'placed at 1.2: 1.1 is behind the placement, so the track is open').toEqual([
      'repertoire song.folk.hot-cross-buns (practice.1)',
    ]);
    expect(practiceRows('1.5'), 'placed at 1.5 (F2’s floor case in today.spec)').toEqual([
      'repertoire song.folk.hot-cross-buns (practice.1)',
    ]);
    expect(practiceRows('2.1'), 'placed at 2.1: the placement puts the whole track behind (holding already)').toEqual([]);
  });

  it('the new piece at 1.2 and 1.5 is the rung’s own new material, never the practice row (X1 item 7)', () => {
    const items = CATALOG;
    const newRow = (startAt: string): string => {
      const slot = buildSession({
        curriculum: SHIPPED,
        catalog: indexCatalog(items),
        items,
        states: rungState([], SHIPPED, VOCABULARY_V0, TODAY),
        rows: [],
        learned: [],
        lastPlayed: new Map(),
        activeTracks: defaultActiveTracks(SHIPPED),
        minutes: 30,
        startAt,
        today: TODAY,
      }).slots.find((one) => one.kind === 'new');
      const claim = slot?.claim;
      return `${slot?.item?.id ?? '-'} (${claim?.kind ?? '-'} ${claim !== undefined && 'rung' in claim ? claim.rung.id : '-'})`;
    };
    expect(newRow('1.2')).toBe('song.folk.lightly-row (asked 1.2)');
    expect(newRow('1.5')).toBe('exercise.reading.steps-and-skips-c (asked 1.5)');
  });
});
