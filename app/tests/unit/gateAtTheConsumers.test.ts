/**
 * The one gate at the consumers (E0 item 4; Part 23's activation condition, L36):
 * once every piece carries measured demands, C6's dormant demand tier and the
 * repertoire slot's demand claim go live — and they go live only through the gate.
 *
 * Written against the consumers' own signatures (`tieredAlternatives`,
 * `swapOptions`, `buildSession`), with constructed items carrying the measurement
 * the build writes, so the same file runs on the code before E0 and shows the traps
 * it springs there: a candidate sharing a demand incidentally, an unmeasured
 * same-lesson option, a declared skill the notes do not carry, a level-close
 * candidate the learner is not ready for, a declared large-hand voicing, and a
 * repertoire piece whose new demand is only incidental.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSession, swapOptions, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL, SHIPPED_SKILL_ACTIVATION } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { matches as libraryMatches } from '../../src/ui/screens/LibraryScreen';

/** The build's measurement of a constructed item: `established` at a useful density, the rest incidental. */
function measured(demands: string[], established: string[] = demands): Partial<CatalogItem> {
  const bars = 16;
  return {
    demands,
    measurement: {
      status: 'measured',
      definitions: 3,
      located: Object.fromEntries(demands.map((d) => [d, established.includes(d) ? bars : 1])),
      bars,
      steps: bars * 4,
      notes: bars * 4,
      established,
    },
  };
}

function song(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

const lesson = (id: string, over: Partial<Lesson> = {}): Lesson => ({
  id,
  title: `Lesson ${id}`,
  concepts: [],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  ...over,
});

/** A learner whose lessons have taught steps and skips. */
const LEARNER = { taught: (demand: string) => demand === 'interval.step' || demand === 'interval.skip' };

describe('the swap sheet’s tiers', () => {
  const curriculum: Curriculum = {
    version: 1,
    tracks: [],
    stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('1.5', { songOptions: ['song.source', 'song.unmeasured-option'] })] }] }],
  };
  const catalog = indexCatalog([
    song('song.source', { targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip'], ['interval.skip']) }),
    // Same lesson, never measured: not an equivalent option.
    song('song.unmeasured-option', { demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'constructed' } }),
    // Shares a step, which every piece has, and nothing the row is for.
    song('song.shares-a-step', { level: 2, ...measured(['interval.step']) }),
    // Declares the row's skill and its notes carry none of that skill's opportunity at density.
    song('song.declares-but-lacks', { level: 2, targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip'], []) }),
    // At the row's level, provides skips, and brings a leap the learner has not met.
    song('song.close-not-ready', { level: 2, ...measured(['interval.step', 'interval.skip', 'interval.leap']) }),
    // Three levels away and clean.
    song('song.far-clean', { level: 5, ...measured(['interval.step', 'interval.skip']) }),
    // A declared large-hand voicing, its alternative not yet shown to the learner.
    song('song.large-hand', {
      level: 2,
      ...measured(['interval.step', 'interval.skip']),
      provenance: { source: 'generated', facts: {}, review: { score: null, teaching: null }, physical: { prerequisite: 'a ninth', alternative: 'the root in the left hand' } },
    }),
  ]);
  const tiers = () =>
    (tieredAlternatives as (...args: unknown[]) => ReturnType<typeof tieredAlternatives>)(
      { itemId: 'song.source', lessonId: '1.5', limit: 50 },
      curriculum,
      catalog,
      EVERY_DECLARED_SKILL,
      LEARNER,
    );

  it('offers only the clean candidate that provides the demand the row exists for', () => {
    expect(tiers().map((one) => [one.item.id, one.tier])).toEqual([['song.far-clean', 'demand']]);
  });

  it('never offers an incidental sharer, an unmeasured option, a declaration the notes lack, an unready candidate or a large-hand voicing', () => {
    const ids = tiers().map((one) => one.item.id);
    for (const refused of ['song.shares-a-step', 'song.unmeasured-option', 'song.declares-but-lacks', 'song.close-not-ready', 'song.large-hand']) {
      expect(ids, refused).not.toContain(refused);
    }
  });
});

describe('the repertoire slot’s claim', () => {
  const TODAY = new Date(2026, 9, 20, 9);
  // One core rung, 1.5, which the vocabulary says teaches skips and leaps.
  const curriculum: Curriculum = {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [
      {
        number: 1,
        title: 'One',
        summary: '',
        units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('1.5', { exerciseOptions: [], songOptions: ['song.rung'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] })] }],
      },
    ],
  };
  /** A stored run whose evidence supports reading by interval: familiar on one supporting record. */
  const shown: SessionRow = {
    itemId: 'drill.reader',
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
        skill: 'interval-reading',
        standard: 'practice',
        n: 8,
        right: 8,
        at: new Date(2026, 9, 19, 12).toISOString(),
        observationId: 1,
        context: { itemId: 'drill.reader', firstContact: true, met: [], unattributed: 0, estimated: false },
        byDemand: [],
      } as unknown as MeasuredEvidence,
    ],
  };
  const repertoireOf = (items: CatalogItem[]) =>
    buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([], curriculum, VOCABULARY_V0, TODAY),
      rows: [shown],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
    }).slots.find((slot) => slot.kind === 'repertoire');

  it('a piece whose new demand is only incidental is not "a piece with skips"', () => {
    const incidental = song('song.skips-incidental', measured(['interval.step', 'interval.skip'], ['interval.step']));
    const rung = song('song.rung', measured(['interval.step']));
    const slot = repertoireOf([rung, incidental]);
    expect(slot?.claim?.kind === 'ready' ? slot.item?.id : undefined).toBeUndefined();
  });

  it('a piece providing the new demand, every demand supported by the reads, is', () => {
    const clean = song('song.skips-clean', measured(['interval.step', 'interval.skip']));
    const rung = song('song.rung', measured(['interval.step']));
    const slot = repertoireOf([rung, clean]);
    expect(slot?.claim).toMatchObject({ kind: 'ready', demand: 'interval.skip' });
    expect(slot?.item?.id).toBe('song.skips-clean');
  });
});

/**
 * D3a: a generated item whose family promises music and whose teaching use no person has approved
 * reaches no automatic offer, on every path through the one gate — the swap sheet's four tiers and
 * its last resort, the session's skill requirement and its skill and demand steps — and the Library
 * still lists it. Written to the consumers' own signatures, so the same file runs on the code before
 * D3a and shows the side door there (`responses/ee70b43.md`).
 *
 * Which items promise music is read here from the contract table, rule by recipe as
 * `family_contracts.selected` reads it: the oracle, independent of the fact the build writes (the
 * app never reads the table).
 */
type PromiseRule = { promise: string; when?: Record<string, unknown> };
const CONTRACTS = JSON.parse(readFileSync(join(process.cwd(), '..', 'tools', 'content', 'family_contracts.json'), 'utf8')) as {
  families: Record<string, { promise: PromiseRule[] }>;
};
const familyOf = (item: CatalogItem): string | undefined => (item.drill as { generator?: { family?: string } } | null | undefined)?.generator?.family;
function promisesMusic(item: CatalogItem): boolean {
  const family = familyOf(item);
  const row = family === undefined ? undefined : CONTRACTS.families[family];
  if (row === undefined || item.provenance?.source !== 'generated') return false;
  const recipe: Record<string, unknown> = { hands: item.hands, ...(item.drill?.params ?? {}) };
  const fits = (when: PromiseRule['when']): boolean =>
    Object.entries(when ?? {}).every(([name, wanted]) => (Array.isArray(wanted) ? wanted : [wanted]).includes(recipe[name]));
  return (row.promise.find((rule) => fits(rule.when)) ?? row.promise[row.promise.length - 1])?.promise === 'music';
}
const unapproved = (item: CatalogItem): boolean => promisesMusic(item) && item.provenance?.review.teaching !== true;
/** The item with an affirmative teaching-use decision on its current identity, as D2's build writes it. */
function approved(item: CatalogItem): CatalogItem {
  const provenance = item.provenance as NonNullable<CatalogItem['provenance']>;
  return {
    ...item,
    provenance: {
      ...provenance,
      facts: { ...provenance.facts, reviewedTeaching: { kind: 'reviewed', via: 'content/review/decisions.jsonl', value: 'yes' } },
      review: { ...provenance.review, teaching: true },
    },
  };
}
/** A constructed generated item whose family promises music, with the teaching-use bit given. */
const musical = (teaching: boolean | null): Partial<CatalogItem> => ({
  provenance: { source: 'generated', facts: { promise: { kind: 'authored', via: 'family_contracts.json', value: 'music' } }, review: { score: null, teaching } },
});
/** A learner who copes with every demand anything carries. */
const COPES = { taught: () => true };

describe('the swap sheet on the built catalogue offers no music-promising generated item without an affirmative teaching-use decision (D3a)', () => {
  const CONTENT = join(process.cwd(), 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const lessons = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
  const study = catalog.find((item) => familyOf(item) === 'study') as CatalogItem;

  it('the built catalogue has studies and grooves to refuse, none approved', () => {
    const music = catalog.filter(promisesMusic);
    expect(music.filter((item) => familyOf(item) === 'study').length, 'no study in the built catalogue').toBeGreaterThan(0);
    expect(music.filter((item) => familyOf(item) !== 'study').length, 'no groove in the built catalogue').toBeGreaterThan(0);
    expect(music.filter((item) => item.provenance?.review.teaching === true).map((item) => item.id)).toEqual([]);
  });

  it('every row of every rung, for a learner who copes with everything: no tier offers one', () => {
    const index = indexCatalog(catalog);
    const offered: string[] = [];
    for (const lesson of lessons) {
      for (const id of [...lesson.exerciseOptions, ...lesson.songOptions]) {
        for (const one of tieredAlternatives({ itemId: id, lessonId: lesson.id, limit: 10_000 }, curriculum, index, SHIPPED_SKILL_ACTIVATION, COPES)) {
          if (unapproved(one.item)) offered.push(`${one.item.id} (${one.tier}) for ${id} on ${lesson.id}`);
        }
      }
    }
    expect(offered.slice(0, 12), `${String(offered.length)} offers`).toEqual([]);
  }, 300_000);

  it('once a teaching-use yes is on their identity, the same rows offer them again, subject to the existing gates', () => {
    const index = indexCatalog(catalog.map((item) => (promisesMusic(item) ? approved(item) : item)));
    // 2.1's five-finger review row: the studies provide hands together, which 2.1 teaches.
    const review = tieredAlternatives({ itemId: 'exercise.five-finger.c-major.both', lessonId: '2.1', limit: 10_000 }, curriculum, index, SHIPPED_SKILL_ACTIVATION, COPES);
    expect(review.filter((one) => one.tier === 'demand' && familyOf(one.item) === 'study').length).toBeGreaterThan(0);
    // 4.5's 6/8 rhythm row: the rung's own clave, from the same lesson.
    const rhythm = tieredAlternatives({ itemId: 'drill.rhythm.six-eight', lessonId: '4.5', limit: 10_000 }, curriculum, index, SHIPPED_SKILL_ACTIVATION, COPES);
    expect(rhythm.filter((one) => one.tier === 'lesson' && familyOf(one.item) === 'clave').map((one) => one.item.id)).toContain('exercise.clave.rumba-3-2');
    // Still refused where the learner has not met what it carries: a learner taught steps alone.
    const early = tieredAlternatives({ itemId: 'exercise.five-finger.c-major.both', lessonId: '2.1', limit: 10_000 }, curriculum, index, SHIPPED_SKILL_ACTIVATION, LEARNER);
    expect(early.filter((one) => familyOf(one.item) === 'study').map((one) => one.item.id)).toEqual([]);
  });

  it('an authored alternatives[] entry naming an unapproved study is not offered; with a yes on its identity it is', () => {
    const source = song('song.names-a-study', { ...measured(['interval.step']), alternatives: [study.id] });
    const empty: Curriculum = { version: 1, tracks: [], stages: [] };
    const named = (candidate: CatalogItem) =>
      tieredAlternatives({ itemId: source.id }, empty, indexCatalog([source, candidate]), SHIPPED_SKILL_ACTIVATION, COPES).map((one) => [one.item.id, one.tier]);
    expect(named(study), study.id).toEqual([]);
    expect(named(approved(study)), study.id).toEqual([[study.id, 'alternative']]);
  });

  it('the Library still lists the study: browsing is not an offer, and the Library never asks the gate', () => {
    const browse = { query: 'study', type: 'all', track: 'all', status: 'all', hands: 'all', minLevel: 0, maxLevel: 10, importedOnly: false, sort: 'level' } as const;
    expect(libraryMatches(study, browse as never, new Map()), study.id).toBe(true);
    expect(catalog.filter((item) => familyOf(item) === 'study' && libraryMatches(item, browse as never, new Map())).length).toBe(
      catalog.filter((item) => familyOf(item) === 'study').length,
    );
    expect(readFileSync(join(process.cwd(), 'src', 'ui', 'screens', 'LibraryScreen.ts'), 'utf8')).not.toMatch(/eligib/);
  });
});

describe('the session’s skill requirement and its skill and demand steps refuse it too (D3a)', () => {
  const TODAY = new Date(2026, 9, 20, 9);
  /** Vocabulary v0 with eighth notes taught at the constructed lesson E (as `fallbackOrder.test.ts`). */
  const VOCABULARY: Vocabulary = {
    ...VOCABULARY_V0,
    demands: VOCABULARY_V0.demands.map((demand) => (demand.id === 'rhythm.eighths' ? { ...demand, taughtAt: ['E'] } : demand)),
  };
  const exercise = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({
    id,
    type: 'exercise',
    title: id,
    level: 1.5,
    hands: 'right',
    tracks: ['core'],
    concepts: [],
    file: `scores/${id}.mxl`,
    ...over,
  });
  /** E and P before R; R asks for subdivision and lists `own`. */
  const curriculumWith = (own: string[], earlier: string[]): Curriculum => ({
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [
      {
        number: 1,
        title: 'One',
        summary: '',
        units: [
          {
            id: 'u',
            title: 'U',
            track: 'core',
            lessons: [
              lesson('E', { exerciseOptions: earlier, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              lesson('P', { exerciseOptions: ['ex.pre'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              lesson('R', { exerciseOptions: own, requirements: [{ kind: 'skill', skill: 'subdivision', state: 'familiar' }], prerequisites: ['P'] }),
            ],
          },
        ],
      },
    ],
  });
  const warmup = (curriculum: Curriculum, items: CatalogItem[]): SessionSlot | undefined =>
    buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([], curriculum, VOCABULARY_V0, TODAY),
      rows: [],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 15,
      startAt: 'R',
      today: TODAY,
      skillActivation: EVERY_DECLARED_SKILL,
      vocabulary: VOCABULARY,
    }).slots.find((slot) => slot.kind === 'technique');
  const pre = exercise('ex.pre', measured([]));
  /** R's own exercise training the skill, never playable: the requirement has a pool and nothing to offer. */
  const gone = exercise('ex.r-gone', { targetSkills: ['subdivision'], file: null, ...measured(['rhythm.eighths']) });

  it('the skill requirement: an unapproved music-promising exercise is not what the rung asks for; approved, it is', () => {
    const own = (teaching: boolean | null) => exercise('ex.r-music', { targetSkills: ['subdivision'], ...measured(['rhythm.eighths']), ...musical(teaching) });
    const curriculum = curriculumWith(['ex.r-music'], []);
    const refused = warmup(curriculum, [own(null), pre]);
    expect(refused?.claim?.kind === 'asked' && refused.item?.id === 'ex.r-music', `claimed ${JSON.stringify(refused?.claim)}`).toBe(false);
    const served = warmup(curriculum, [own(true), pre]);
    expect(served?.item?.id).toBe('ex.r-music');
    expect(served?.claim).toMatchObject({ kind: 'asked', skill: 'subdivision' });
  });

  it('the skill step: an unapproved music-promising exercise declaring the skill is passed over for the prerequisite; approved, it is chosen', () => {
    const earlier = (teaching: boolean | null) => exercise('ex.e-music', { targetSkills: ['subdivision'], ...measured(['rhythm.eighths']), ...musical(teaching) });
    const curriculum = curriculumWith(['ex.r-gone'], ['ex.e-music']);
    const refused = warmup(curriculum, [gone, earlier(null), pre]);
    expect(refused?.item?.id).toBe('ex.pre');
    expect(refused?.claim?.kind).toBe('prerequisite');
    const chosen = warmup(curriculum, [gone, earlier(true), pre]);
    expect(chosen?.item?.id).toBe('ex.e-music');
    expect(chosen?.claim).toMatchObject({ kind: 'skill', skill: 'subdivision' });
  });

  it('the demand step: an unapproved music-promising exercise providing the demand is passed over; approved, it is chosen', () => {
    const earlier = (teaching: boolean | null) => exercise('ex.e-groove', { ...measured(['rhythm.eighths']), ...musical(teaching) });
    const curriculum = curriculumWith(['ex.r-gone'], ['ex.e-groove']);
    const refused = warmup(curriculum, [gone, earlier(null), pre]);
    expect(refused?.item?.id).toBe('ex.pre');
    const chosen = warmup(curriculum, [gone, earlier(true), pre]);
    expect(chosen?.item?.id).toBe('ex.e-groove');
    expect(chosen?.claim).toMatchObject({ kind: 'demand', demand: 'rhythm.eighths' });
  });

  it('the swap sheet’s last resort, the same kind from the lessons reached: an unapproved one is not offered; approved, it is', () => {
    const curriculum: Curriculum = {
      version: 1,
      tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
      stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('L', { exerciseOptions: ['ex.groove-a', 'ex.groove-b'] })] }] }],
    };
    const groove = (id: string, teaching: boolean | null) => exercise(id, { drill: { kind: 'clave', params: {} }, ...measured([]), ...musical(teaching) });
    const kindOf = (teaching: boolean | null) => {
      const items = [groove('ex.groove-a', null), groove('ex.groove-b', teaching)];
      // A review row carries no lesson, so the tiers have nothing and the sheet walks to its last resort.
      const slot: SessionSlot = { kind: 'review', minutes: 5, item: items[0], reason: '' };
      return swapOptions(slot, [slot], curriculum, indexCatalog(items), { items, rung: 'L', activeTracks: ['core'] }).map((one) => [one.item.id, one.tier]);
    };
    expect(kindOf(null)).toEqual([]);
    expect(kindOf(true)).toEqual([['ex.groove-b', 'kind']]);
  });
});
