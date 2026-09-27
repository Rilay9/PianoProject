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
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as session from '../../src/curriculum/session';
import { buildSession, swapOptions, taughtAtRung, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { measured } from './helpers/measured';

const CONTENT = join(process.cwd(), 'public', 'content');
const SHIPPED = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
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

/** Vocabulary v0 with the walking bass taught at A.5. */
const X_AT_A5: Vocabulary = {
  ...VOCABULARY_V0,
  demands: VOCABULARY_V0.demands.map((demand) => (demand.id === WALK ? { ...demand, taughtAt: 'A.5' } : demand)),
};

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

  it('the walking bass is taught at blues.5 and blues.6, not at jazz.5, jazz.6 or classical.5', () => {
    expect(taught('blues.5', WALK), `${WALK} at blues.5, the rung that teaches it`).toBe(true);
    expect(taught('blues.6', WALK), `${WALK} at blues.6, which builds on blues.5`).toBe(true);
    expect(taught('jazz.5', WALK), `${WALK} at jazz.5: the file’s order credited blues.5, stored before jazz.5`).toBe(false);
    expect(taught('jazz.6', WALK), `${WALK} at jazz.6: the file’s order credited blues.5, stored before jazz.6`).toBe(false);
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
