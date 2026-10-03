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
 *
 * Since D3a and D3b, also the teaching-use admission: at the gate (D3a), and on the
 * session card's rows drawn straight from a rung's list without the gate (D3b); since
 * E1a, for an excerpt as for a music-promising generated item.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { admittedForTeaching, eligibleFor } from '../../src/curriculum/eligibility';
import { buildSession, swapOptions, type BuildInput, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL, SHIPPED_SKILL_ACTIVATION } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { rungState, type RungReading } from '../../src/evidence/rungState';
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
 * app never reads the table). Since E1a the oracle also names every excerpt (its `type`) without a
 * `yes`: an excerpt is music whose teaching suitability rests on a person's decision on the cut.
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
/** What no automatic offer may take: music-promising generated items (D3a) and excerpts (E1a), each without a yes. */
const unapproved = (item: CatalogItem): boolean => (promisesMusic(item) || item.type === 'excerpt') && item.provenance?.review.teaching !== true;
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

describe('the swap sheet on the built catalogue offers no music-promising generated item (D3a) or excerpt (E1a) without an affirmative teaching-use decision', () => {
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

/**
 * D3b: the session card's rows that take an item straight from a rung's list — a rung's `runs`, `done` and
 * `measure` asks, the fallback ladder's rung and prerequisite steps, the jam slot and the exposure rule —
 * are automatic offers too, and pass the same teaching-use admission as the gate (the reviewer's required
 * change on D3a, `responses/c8717be.md`): an authored placement is not a teaching-use decision. Each path
 * on constructed rungs, for `teaching: null` and `false` (refused alike) and `true` (offered again, the
 * card then exactly what it is for the same item with no promise at all), with a generated drill and a
 * notated song beside it offered as before; where the refused item was the row's only candidate, the row
 * is filled by the next step that already passes, or dropped — never by the refused item, and never by a
 * line saying the rung's asks are met.
 */
describe('the session card’s rows drawn straight from a rung’s list pass the same admission (D3b)', () => {
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
  /** A generated groove as the build writes one: a file, a drill kind, the family's promise `music`, the stored bit. */
  const groove = (id: string, teaching: boolean | null, kind = 'clave'): CatalogItem => exercise(id, { drill: { kind, params: {} }, ...measured([]), ...musical(teaching) });
  /** The same item with no promise fact: what every one of these paths offered before D3b, whatever the bit. */
  const unpromised = (item: CatalogItem): CatalogItem => ({ ...item, provenance: { source: 'authored', facts: {}, review: { score: null, teaching: null } } });
  /** A generated drill: its family promises a drill, and no person has decided its teaching use. */
  const drill = (id: string, kind = 'scale'): CatalogItem =>
    exercise(id, {
      drill: { kind, params: {} },
      ...measured([]),
      provenance: { source: 'generated', facts: { promise: { kind: 'authored', via: 'family_contracts.json', value: 'drill' } }, review: { score: null, teaching: null } },
    });
  /** A notated song no person has decided on: its notes are its truth. */
  const notated = (id: string): CatalogItem => song(id, { ...measured([]), provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null } } });
  /** P's exercise, an ordinary notated one: what the ladder's prerequisite step finds. */
  const pre = exercise('ex.pre', measured([]));
  /** R's own exercise training the skill it asks for, never playable: the skill requirement has a pool and nothing to offer. */
  const gone = exercise('ex.r-gone', { targetSkills: ['subdivision'], file: null, ...measured(['rhythm.eighths']) });
  const REFUSED = [null, false] as const;

  /**
   * The rung after R asks for an exercise the card can have: a card that treated a refused ask as met would
   * offer it as "The next lesson asks for it", which is false while R's ask waits (`claimsNext`).
   */
  const next = exercise('ex.next', measured([]));
  /** E and P before R (placed at R, so both behind the placement); R builds on P; R2 after R. */
  const core = (r: Partial<Lesson>, p: string[] = ['ex.pre'], e: string[] = []): Curriculum => ({
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
              lesson('E', { exerciseOptions: e, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              lesson('P', { title: 'The lesson R builds on', exerciseOptions: p, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              lesson('R', { prerequisites: ['P'], ...r }),
              lesson('R2', { title: 'The lesson after R', exerciseOptions: ['ex.next'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
            ],
          },
        ],
      },
    ],
  });
  const card = (curriculum: Curriculum, listed: CatalogItem[], over: Partial<BuildInput> = {}): SessionSlot[] => {
    const items = [...listed, next];
    return buildSession({
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
      ...over,
    }).slots;
  };
  const row =(slots: SessionSlot[], kind: SessionSlot['kind']): SessionSlot | undefined => slots.find((slot) => slot.kind === kind);
  const shape = (slots: SessionSlot[]) => slots.map((slot) => [slot.kind, slot.item?.id, slot.claim?.kind, slot.reason]);
  const ids = (slots: SessionSlot[]) => slots.map((slot) => slot.item?.id);
  /** No row says the rung's asks are met: none offers the next lesson's as "the next lesson asks for it". */
  const claimsNext = (slots: SessionSlot[]) => slots.some((slot) => slot.claim?.kind === 'asked' && slot.claim.next);

  it('runs: the rung’s own groove is not what it asks for until approved; the warm-up takes the next valid step, and a drill and a notated song beside it are offered as before', () => {
    const only = core({ exerciseOptions: ['ex.groove'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] });
    for (const teaching of REFUSED) {
      const slots = card(only, [groove('ex.groove', teaching), pre]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(row(slots, 'technique'), `teaching ${String(teaching)}`).toMatchObject({ item: { id: 'ex.pre' }, claim: { kind: 'prerequisite', rung: { id: 'P' } } });
      expect(claimsNext(slots)).toBe(false);
    }
    const approved = card(only, [groove('ex.groove', true), pre]);
    expect(row(approved, 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'asked', requirement: { kind: 'runs' } } });
    expect(shape(approved)).toEqual(shape(card(only, [unpromised(groove('ex.groove', true)), pre])));

    const beside = core({
      exerciseOptions: ['ex.groove', 'ex.drill'],
      songOptions: ['song.notated'],
      requirements: [
        { kind: 'runs', from: 'exercises', count: 1 },
        { kind: 'runs', from: 'songs', count: 1 },
      ],
    });
    const items = (teaching: boolean | null) => [groove('ex.groove', teaching), drill('ex.drill'), notated('song.notated'), pre];
    for (const teaching of REFUSED) {
      const slots = card(beside, items(teaching));
      expect(row(slots, 'technique'), `teaching ${String(teaching)}`).toMatchObject({ item: { id: 'ex.drill' }, claim: { kind: 'asked', requirement: { kind: 'runs', from: 'exercises' } } });
      expect(row(slots, 'new'), `teaching ${String(teaching)}`).toMatchObject({ item: { id: 'song.notated' }, claim: { kind: 'asked', requirement: { kind: 'runs', from: 'songs' } } });
    }
    const both = card(beside, items(true));
    expect([row(both, 'technique')?.item?.id, row(both, 'new')?.item?.id]).toEqual(['ex.groove', 'song.notated']);
    expect(shape(both)).toEqual(shape(card(beside, [unpromised(groove('ex.groove', true)), drill('ex.drill'), notated('song.notated'), pre])));
  });

  it('done: a requirement naming the groove stays unmet and no row claims it; the next valid step fills the warm-up, or the rung’s other option', () => {
    const only = core({ exerciseOptions: ['ex.groove'], requirements: [{ kind: 'done', item: 'ex.groove' }] });
    for (const teaching of REFUSED) {
      const slots = card(only, [groove('ex.groove', teaching), pre]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(slots.some((slot) => slot.claim?.kind === 'asked' && slot.claim.requirement.kind === 'done')).toBe(false);
      expect(row(slots, 'technique')).toMatchObject({ item: { id: 'ex.pre' }, claim: { kind: 'prerequisite' } });
      expect(claimsNext(slots)).toBe(false);
    }
    expect(row(card(only, [groove('ex.groove', true), pre]), 'technique')).toMatchObject({
      item: { id: 'ex.groove' },
      claim: { kind: 'asked', requirement: { kind: 'done', item: 'ex.groove' } },
    });

    const beside = core({ exerciseOptions: ['ex.groove', 'ex.drill'], requirements: [{ kind: 'done', item: 'ex.groove' }] });
    for (const teaching of REFUSED) {
      // The rung asks for the groove and cannot have it: its other option, said as the rung's own, never as what it asks.
      expect(row(card(beside, [groove('ex.groove', teaching), drill('ex.drill'), pre]), 'technique')).toMatchObject({ item: { id: 'ex.drill' }, claim: { kind: 'rung', rung: { id: 'R' } } });
    }
    expect(row(card(beside, [groove('ex.groove', true), drill('ex.drill'), pre]), 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'asked' } });
  });

  it('measure: the rung’s groove of the measured kind is refused; a generated drill of the same kind beside it is what the rung asks for', () => {
    const only = core({ exerciseOptions: ['ex.groove'], requirements: [{ kind: 'measure', measure: 'clave' }] });
    for (const teaching of REFUSED) {
      const slots = card(only, [groove('ex.groove', teaching), pre]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(row(slots, 'technique')).toMatchObject({ item: { id: 'ex.pre' }, claim: { kind: 'prerequisite' } });
    }
    expect(row(card(only, [groove('ex.groove', true), pre]), 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'asked', requirement: { kind: 'measure' } } });

    const beside = core({ exerciseOptions: ['ex.groove', 'ex.clave-drill'], requirements: [{ kind: 'measure', measure: 'clave' }] });
    const items = (teaching: boolean | null) => [groove('ex.groove', teaching), drill('ex.clave-drill', 'clave'), pre];
    for (const teaching of REFUSED) {
      expect(row(card(beside, items(teaching)), 'technique'), `teaching ${String(teaching)}`).toMatchObject({ item: { id: 'ex.clave-drill' }, claim: { kind: 'asked', requirement: { kind: 'measure' } } });
    }
    expect(row(card(beside, items(true)), 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'asked' } });
  });

  it('the ladder’s rung step: the rung’s groove is passed over for the next step, or for a drill of the rung beside it', () => {
    const skill = [{ kind: 'skill' as const, skill: 'subdivision', state: 'familiar' as const }];
    const only = core({ exerciseOptions: ['ex.r-gone', 'ex.groove'], requirements: skill });
    for (const teaching of REFUSED) {
      const slots = card(only, [gone, groove('ex.groove', teaching), pre]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(row(slots, 'technique')).toMatchObject({ item: { id: 'ex.pre' }, claim: { kind: 'prerequisite' } });
    }
    const approved = card(only, [gone, groove('ex.groove', true), pre]);
    expect(row(approved, 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'rung', rung: { id: 'R' } } });
    expect(shape(approved)).toEqual(shape(card(only, [gone, unpromised(groove('ex.groove', true)), pre])));

    const beside = core({ exerciseOptions: ['ex.r-gone', 'ex.groove', 'ex.drill'], requirements: skill });
    for (const teaching of REFUSED) {
      expect(row(card(beside, [gone, groove('ex.groove', teaching), drill('ex.drill'), pre]), 'technique')).toMatchObject({ item: { id: 'ex.drill' }, claim: { kind: 'rung' } });
    }
    expect(row(card(beside, [gone, groove('ex.groove', true), drill('ex.drill'), pre]), 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'rung' } });
  });

  it('the ladder’s prerequisite step: the prerequisite rung’s groove is passed over for exposure, or for its notated exercise beside it', () => {
    const skill = [{ kind: 'skill' as const, skill: 'subdivision', state: 'familiar' as const }];
    const expo = exercise('ex.expo', { file: null, drill: { kind: 'scale', params: {} } });
    const only = core({ exerciseOptions: ['ex.r-gone'], requirements: skill }, ['ex.groove'], ['ex.expo']);
    for (const teaching of REFUSED) {
      const slots = card(only, [gone, groove('ex.groove', teaching), expo]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(row(slots, 'technique')).toMatchObject({ item: { id: 'ex.expo' }, claim: { kind: 'exposure', family: { by: 'kind', id: 'scale' } } });
    }
    const approved = card(only, [gone, groove('ex.groove', true), expo]);
    expect(row(approved, 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'prerequisite', rung: { id: 'P' }, of: { id: 'R' } } });
    expect(shape(approved)).toEqual(shape(card(only, [gone, unpromised(groove('ex.groove', true)), expo])));

    const beside = core({ exerciseOptions: ['ex.r-gone'], requirements: skill }, ['ex.groove', 'ex.pre'], ['ex.expo']);
    for (const teaching of REFUSED) {
      expect(row(card(beside, [gone, groove('ex.groove', teaching), pre, expo]), 'technique')).toMatchObject({ item: { id: 'ex.pre' }, claim: { kind: 'prerequisite' } });
    }
    expect(row(card(beside, [gone, groove('ex.groove', true), pre, expo]), 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'prerequisite' } });
  });

  it('the jam slot: a reached jam rung’s groove is not the jam; with nothing else there the row is dropped, and a song beside it is the jam', () => {
    /** The core path's C, the learner's rung; the jazz rung J met, so reached and not a strand. */
    const jamCurriculum = (exercises: string[], songs: string[]): Curriculum => ({
      version: 1,
      tracks: [
        { id: 'core', title: 'Core', description: '', startsAtStage: 0 },
        { id: 'jazz', title: 'Jazz', description: '', startsAtStage: 1 },
      ],
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
                lesson('C', {
                  exerciseOptions: ['ex.c'],
                  songOptions: ['song.c'],
                  requirements: [
                    { kind: 'runs', from: 'exercises', count: 1 },
                    { kind: 'runs', from: 'songs', count: 1 },
                  ],
                }),
              ],
            },
            { id: 'j', title: 'J', track: 'jazz', lessons: [lesson('J', { title: 'Comping behind somebody', exerciseOptions: exercises, songOptions: songs, requirements: [{ kind: 'runs', from: 'any', count: 1 }] })] },
          ],
        },
      ],
    });
    const jamCard = (curriculum: Curriculum, items: CatalogItem[]) => {
      const j = curriculum.stages[0]?.units[1]?.lessons[0] as Lesson;
      const met: RungReading = { rung: j, status: 'met', judged: true, carried: false, requirements: [] };
      return card(curriculum, [exercise('ex.c', measured([])), notated('song.c'), ...items], {
        states: { byRung: new Map([['J', met]]) },
        activeTracks: ['core', 'jazz'],
        minutes: 60,
        startAt: undefined,
      });
    };
    const only = jamCurriculum(['ex.groove'], []);
    for (const teaching of REFUSED) {
      const slots = jamCard(only, [groove('ex.groove', teaching)]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(row(slots, 'jam'), `teaching ${String(teaching)}`).toBeUndefined();
    }
    const approved = jamCard(only, [groove('ex.groove', true)]);
    expect(row(approved, 'jam')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'jam', rung: { id: 'J' } } });
    expect(shape(approved)).toEqual(shape(jamCard(only, [unpromised(groove('ex.groove', true))])));

    const beside = jamCurriculum(['ex.groove'], ['song.j']);
    for (const teaching of REFUSED) {
      expect(row(jamCard(beside, [groove('ex.groove', teaching), notated('song.j')]), 'jam')).toMatchObject({ item: { id: 'song.j' }, claim: { kind: 'jam' } });
    }
    expect(row(jamCard(beside, [groove('ex.groove', true), notated('song.j')]), 'jam')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'jam' } });
  });

  it('the exposure rule: a family whose only member is the groove is not "from your lessons"; with nothing else the warm-up is dropped, and a drill’s family beside it is chosen', () => {
    /** R asks only for a song, so the warm-up has nothing asked of it and takes the exposure rule over E's exercises. */
    const exposureCurriculum = (e: string[]): Curriculum => ({
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
                lesson('E', { exerciseOptions: e, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
                lesson('R', { songOptions: ['song.r'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] }),
              ],
            },
          ],
        },
      ],
    });
    const only = exposureCurriculum(['ex.groove']);
    for (const teaching of REFUSED) {
      const slots = card(only, [groove('ex.groove', teaching), notated('song.r')]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('ex.groove');
      expect(row(slots, 'technique'), `teaching ${String(teaching)}`).toBeUndefined();
      expect(row(slots, 'new')).toMatchObject({ item: { id: 'song.r' }, claim: { kind: 'asked' } });
    }
    const approved = card(only, [groove('ex.groove', true), notated('song.r')]);
    expect(row(approved, 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'exposure', family: { by: 'kind', id: 'clave' } } });
    expect(shape(approved)).toEqual(shape(card(only, [unpromised(groove('ex.groove', true)), notated('song.r')])));

    const beside = exposureCurriculum(['ex.groove', 'ex.scale']);
    for (const teaching of REFUSED) {
      expect(row(card(beside, [groove('ex.groove', teaching), drill('ex.scale'), notated('song.r')]), 'technique')).toMatchObject({
        item: { id: 'ex.scale' },
        claim: { kind: 'exposure', family: { by: 'kind', id: 'scale' } },
      });
    }
    expect(row(card(beside, [groove('ex.groove', true), drill('ex.scale'), notated('song.r')]), 'technique')).toMatchObject({ item: { id: 'ex.groove' }, claim: { kind: 'exposure' } });
  });

  it('the admission is one exported predicate: refused for a music promise without a yes (an excerpt, E1a, below); drills, notated songs, reading rows and bare items admitted', () => {
    expect(admittedForTeaching(groove('x', null))).toBe(false);
    expect(admittedForTeaching(groove('x', false))).toBe(false);
    expect(admittedForTeaching(groove('x', true))).toBe(true);
    expect(admittedForTeaching(drill('x'))).toBe(true);
    expect(admittedForTeaching(notated('x'))).toBe(true);
    expect(admittedForTeaching(exercise('x', { file: null, drill: { kind: 'sight-reading', params: {} } }))).toBe(true);
    expect(admittedForTeaching(song('x'))).toBe(true);
  });

  it('session.ts reads neither the promise fact nor the teaching bit: it asks the admission', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'curriculum', 'session.ts'), 'utf8');
    expect(source).not.toMatch(/facts\??\.promise|review\??\.teaching/);
    expect(source).toMatch(/admittedForTeaching\(/);
  });
});

describe('the card on the built catalogue offers no music-promising generated item (D3b) or excerpt (E1a) without an affirmative teaching-use decision', () => {
  const CONTENT = join(process.cwd(), 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const TODAY = new Date(2026, 8, 28, 9);
  const tracks = curriculum.tracks.map((track) => track.id);
  /** A fresh learner placed at `rung` with every track on (D3a's card probe), at `minutes`. */
  const cardAt = (items: CatalogItem[], rung: string, minutes: number): SessionSlot[] =>
    buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([], curriculum, VOCABULARY_V0, TODAY),
      rows: [],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: tracks,
      minutes,
      startAt: rung,
      today: TODAY,
    }).slots;
  const rungs = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));

  it('the gate refuses as not approved for teaching use exactly the items the admission refuses: one reading of the fact and the bit', () => {
    const disagree: string[] = [];
    let refused = 0;
    for (const item of catalog) {
      if (admittedForTeaching(item) === unapproved(item)) disagree.push(`${item.id} (against the contract table)`);
      // A declared large-hand voicing is refused before the teaching-use check, whatever it promises.
      if (item.provenance?.physical) continue;
      const verdict = eligibleFor(item, COPES, { for: 'equivalent' });
      const notApproved = verdict.verdict === 'ineligible' && verdict.why === 'teaching-use-not-approved';
      if (notApproved) refused += 1;
      if (notApproved === admittedForTeaching(item)) disagree.push(item.id);
    }
    expect(disagree.slice(0, 12), `${String(disagree.length)} disagree`).toEqual([]);
    expect(refused).toBeGreaterThan(0);
  });

  it('every rung, a fresh learner placed there, every track on, every length: no row is one', () => {
    const index = indexCatalog(catalog);
    const offered: string[] = [];
    for (const rung of rungs) {
      for (const minutes of [15, 30, 60, 120]) {
        const slots = buildSession({
          curriculum,
          catalog: index,
          items: catalog,
          states: rungState([], curriculum, VOCABULARY_V0, TODAY),
          rows: [],
          learned: [],
          lastPlayed: new Map(),
          activeTracks: tracks,
          minutes,
          startAt: rung,
          today: TODAY,
        }).slots;
        for (const slot of slots) if (slot.item && unapproved(slot.item)) offered.push(`${rung} (${String(minutes)} min): ${slot.kind} ${slot.item.id} (${slot.claim?.kind ?? 'no claim'})`);
      }
    }
    expect(offered.slice(0, 12), `${String(offered.length)} rows`).toEqual([]);
  }, 300_000);

  it('once a teaching-use yes is on their identity, the rungs’ own grooves are the card’s rows again', () => {
    const items = catalog.map((item) => (promisesMusic(item) ? approved(item) : item));
    expect(cardAt(items, 'holiday.5', 30).find((slot) => slot.kind === 'technique')).toMatchObject({ item: { id: 'exercise.ostinato.a.arpeggio' }, claim: { kind: 'asked' } });
    expect(cardAt(items, 'jazz.9', 60).find((slot) => slot.kind === 'jam')).toMatchObject({ item: { id: 'exercise.comping.c.anticipated' }, claim: { kind: 'jam' } });
    expect(cardAt(items, 'ragtime.9', 30).find((slot) => slot.kind === 'review')).toMatchObject({ item: { id: 'exercise.secondary-rag.c.4bar' }, claim: { kind: 'rung' } });
  });
});

/**
 * E1a (the reviewer's required change on E1, `responses/8326ff3.md`; Q59): an excerpt is music whose
 * teaching suitability is not established until a person's `yes` is on its cut, so the admission the
 * gate and the card already read refuses it — no excerpt branch in any consumer. E1's rule that no tier
 * searching the whole catalogue offers an unplaced excerpt stays; it is no longer the only guard. Here, a
 * cut a rung lists: the card's rows (`session.usable`) and the swap sheet's lesson tier and last resort
 * (the gate) refuse it at `teaching: null` and `false` and offer it at `true`; an unplaced one reaches
 * no card row at any bit; and on the built catalogue, each excerpt placed as the one song of the first
 * rung that teaches what it was cut for is offered by no card row and no swap-sheet tier until a yes, and
 * by the lesson tier and the card's songs ask once one is on it.
 */
describe('a rung-listed excerpt passes the same admission on the card and the swap sheet; an unplaced one reaches neither (E1a)', () => {
  const TODAY = new Date(2026, 9, 20, 9);
  const REFUSED = [null, false] as const;
  /** A cut as the build writes one: its own file and measurement, the stored teaching-use bit. */
  const cut = (id: string, teaching: boolean | null): CatalogItem => ({
    id,
    type: 'excerpt',
    title: id,
    level: 2,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    file: `scores/excerpts/${id}.mxl`,
    excerptOf: 'song.parent',
    ...measured(['interval.step', 'interval.skip']),
    provenance: {
      source: 'excerpt',
      facts: {},
      review: { score: null, teaching },
      excerpt: { of: 'song.parent', fromBar: 1, toBar: 4, selection: 'both', cutVersion: 1, parentSha256: 'a'.repeat(64), key: 'b'.repeat(64) },
    },
  });
  const exercise = (id: string): CatalogItem => ({ id, type: 'exercise', title: id, level: 1.5, hands: 'right', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...measured([]) });
  /** P before R; R builds on P and asks for a run of one of its songs, which it lists. */
  const listing = (songs: string[]): Curriculum => ({
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
              lesson('P', { exerciseOptions: ['ex.pre'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              lesson('R', { prerequisites: ['P'], exerciseOptions: ['ex.r'], songOptions: songs, requirements: [{ kind: 'runs', from: 'songs', count: 1 }] }),
            ],
          },
        ],
      },
    ],
  });
  const card = (curriculum: Curriculum, items: CatalogItem[]): SessionSlot[] =>
    buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([], curriculum, VOCABULARY_V0, TODAY),
      rows: [],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 30,
      startAt: 'R',
      today: TODAY,
    }).slots;
  const ids = (slots: SessionSlot[]) => slots.map((slot) => slot.item?.id);
  /** The row that says R's songs ask is what it serves. */
  const songsAsk = (slots: SessionSlot[]) =>
    slots.find((slot) => slot.claim?.kind === 'asked' && slot.claim.rung.id === 'R' && slot.claim.requirement.kind === 'runs' && slot.claim.requirement.from === 'songs');

  it('the admission itself: an excerpt is refused at null and false and admitted at true; with no provenance at all, refused', () => {
    expect(admittedForTeaching(cut('excerpt.x', null))).toBe(false);
    expect(admittedForTeaching(cut('excerpt.x', false))).toBe(false);
    expect(admittedForTeaching(cut('excerpt.x', true))).toBe(true);
    const { provenance: _none, ...bare } = cut('excerpt.x', true);
    expect(admittedForTeaching(bare)).toBe(false);
  });

  it('the card: a rung listing the cut does not offer it until a yes is on the cut, and no row claims the songs ask for it; with a yes it is the ask’s row', () => {
    const only = listing(['excerpt.x']);
    const items = (teaching: boolean | null) => [cut('excerpt.x', teaching), exercise('ex.r'), exercise('ex.pre')];
    for (const teaching of REFUSED) {
      const slots = card(only, items(teaching));
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('excerpt.x');
      expect(songsAsk(slots), `teaching ${String(teaching)}`).toBeUndefined();
    }
    expect(songsAsk(card(only, items(true)))).toMatchObject({ item: { id: 'excerpt.x' }, claim: { kind: 'asked', next: false } });

    const beside = listing(['excerpt.x', 'song.r']);
    const withSong = (teaching: boolean | null) => [...items(teaching), song('song.r', measured([]))];
    for (const teaching of REFUSED) {
      const slots = card(beside, withSong(teaching));
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('excerpt.x');
      expect(songsAsk(slots)?.item?.id, `teaching ${String(teaching)}`).toBe('song.r');
    }
    expect(songsAsk(card(beside, withSong(true)))?.item?.id).toBe('excerpt.x');
  });

  it('the card: an unplaced cut is no row at any bit — placement and admission answer different questions', () => {
    const curriculum = listing(['song.r']);
    for (const teaching of [null, false, true] as const) {
      const slots = card(curriculum, [cut('excerpt.x', teaching), song('song.r', measured([])), exercise('ex.r'), exercise('ex.pre')]);
      expect(ids(slots), `teaching ${String(teaching)}`).not.toContain('excerpt.x');
    }
  });

  it('the swap sheet’s lesson tier: another option of the rung does not offer the cut until a yes is on it; with a yes it does', () => {
    const curriculum = listing(['song.r', 'excerpt.x']);
    const tiers = (teaching: boolean | null) =>
      tieredAlternatives(
        { itemId: 'song.r', lessonId: 'R', limit: 50 },
        curriculum,
        indexCatalog([song('song.r', measured(['interval.step'])), cut('excerpt.x', teaching)]),
        SHIPPED_SKILL_ACTIVATION,
        COPES,
      ).map((one) => [one.item.id, one.tier]);
    for (const teaching of REFUSED) expect(tiers(teaching), `teaching ${String(teaching)}`).toEqual([]);
    expect(tiers(true)).toEqual([['excerpt.x', 'lesson']]);
  });

  it('the swap sheet’s last resort, an excerpt for an excerpt from the lessons reached: not offered until a yes is on it; then offered', () => {
    const curriculum: Curriculum = {
      version: 1,
      tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
      stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('L', { songOptions: ['excerpt.a', 'excerpt.b'] })] }] }],
    };
    // Cuts carrying no demand, so the rung's learner copes and only the admission can refuse one.
    const bare = (id: string, teaching: boolean | null): CatalogItem => ({ ...cut(id, teaching), ...measured([]) });
    const kindOf = (teaching: boolean | null) => {
      const items = [bare('excerpt.a', null), bare('excerpt.b', teaching)];
      // A review row carries no lesson, so the tiers have nothing and the sheet walks to its last resort.
      const slot: SessionSlot = { kind: 'review', minutes: 5, item: items[0], reason: '' };
      return swapOptions(slot, [slot], curriculum, indexCatalog(items), { items, rung: 'L', activeTracks: ['core'] }).map((one) => [one.item.id, one.tier]);
    };
    for (const teaching of REFUSED) expect(kindOf(teaching), `teaching ${String(teaching)}`).toEqual([]);
    expect(kindOf(true)).toEqual([['excerpt.b', 'kind']]);
  });

  describe('on the built catalogue, each excerpt placed on the first rung that teaches what it was cut for', () => {
    const CONTENT = join(process.cwd(), 'public', 'content');
    const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
    const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
    const lessons = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
    const excerpts = catalog.filter((item) => item.type === 'excerpt');
    /** The core path and the track the rung is on: a learner on that path, so the rung's own asks reach the card. */
    const tracksFor = (rung: string): string[] => ['core', curriculum.stages.flatMap((stage) => stage.units).find((unit) => unit.lessons.some((one) => one.id === rung))?.track ?? 'core'];
    /** A target is a demand, or a skill standing for its opportunity's demands; the first rung teaching one, in curriculum order. */
    const rungFor = (item: CatalogItem): string | undefined => {
      const demands = (item.provenance?.excerpt?.targets ?? []).flatMap((target) => {
        const skill = VOCABULARY_V0.skills.find((one) => one.id === target);
        return skill === undefined ? [target] : Array.isArray(skill.opportunity) ? [...skill.opportunity] : [];
      });
      const teaches = new Set(demands.flatMap((demand) => VOCABULARY_V0.demands.find((one) => one.id === demand)?.taughtAt ?? []));
      return lessons.find((lesson) => teaches.has(lesson.id))?.id;
    };
    /** The curriculum with the excerpt as that rung's one song: a rung that lists the cut where it listed its pieces. */
    const placing = (item: CatalogItem, rung: string): Curriculum => ({
      ...curriculum,
      stages: curriculum.stages.map((stage) => ({
        ...stage,
        units: stage.units.map((unit) => ({
          ...unit,
          lessons: unit.lessons.map((lesson) => (lesson.id === rung ? { ...lesson, songOptions: [item.id] } : lesson)),
        })),
      })),
    });
    const withBit = (teaching: true | null) => (teaching === true ? catalog.map((item) => (item.type === 'excerpt' ? approved(item) : item)) : catalog);
    /** For each placement: every card a fresh learner placed there gets (the core path and the rung's track, every length), and every swap sheet of the rung's exercises. */
    const offers = (teaching: true | null) => {
      const items = withBit(teaching);
      const index = indexCatalog(items);
      const found: { card: string[]; sheet: string[] } = { card: [], sheet: [] };
      for (const item of excerpts) {
        const rung = rungFor(item) as string;
        const placed = placing(item, rung);
        for (const minutes of [15, 30, 60, 120]) {
          const slots = buildSession({
            curriculum: placed,
            catalog: index,
            items,
            states: rungState([], placed, VOCABULARY_V0, TODAY),
            rows: [],
            learned: [],
            lastPlayed: new Map(),
            activeTracks: tracksFor(rung),
            minutes,
            startAt: rung,
            today: TODAY,
          }).slots;
          for (const slot of slots) if (slot.item?.type === 'excerpt') found.card.push(`${rung} (${String(minutes)} min): ${slot.kind} ${slot.item.id}`);
        }
        const lesson = lessons.find((one) => one.id === rung) as Lesson;
        for (const id of lesson.exerciseOptions) {
          for (const one of tieredAlternatives({ itemId: id, lessonId: rung, limit: 10_000 }, placed, index, SHIPPED_SKILL_ACTIVATION, COPES)) {
            if (one.item.type === 'excerpt') found.sheet.push(`${one.item.id} (${one.tier}) for ${id} on ${rung}`);
          }
        }
      }
      return found;
    };

    it('every built excerpt is undecided and has a rung that teaches what it was cut for', () => {
      expect(excerpts.length, 'no excerpt in the built catalogue').toBeGreaterThan(0);
      for (const item of excerpts) {
        expect(item.provenance?.review.teaching, item.id).toBeNull();
        expect(rungFor(item), item.id).toBeDefined();
      }
    });

    it('undecided: no card row and no swap-sheet tier offers one', () => {
      const found = offers(null);
      expect(found.card.slice(0, 12), `${String(found.card.length)} card rows`).toEqual([]);
      expect(found.sheet.slice(0, 12), `${String(found.sheet.length)} swap-sheet offers`).toEqual([]);
    }, 300_000);

    it('with a yes on each cut: the lesson tier offers each on its rung, and the card offers the rungs’ songs asks with them', () => {
      const found = offers(true);
      for (const item of excerpts) {
        expect(found.sheet.some((line) => line.startsWith(`${item.id} (lesson)`)), `${item.id} on ${String(rungFor(item))}`).toBe(true);
      }
      // A rung that asks for a run of one of its songs offers the placed cut, its one song, as that ask.
      expect(found.card.filter((line) => line.includes(': new ')).length, 'no card row offers an approved placed excerpt').toBeGreaterThan(0);
    }, 300_000);
  });
});
