/**
 * The excerpt as an item the app reads (E1 item 7; Part 24's adversary 10), each reader of
 * `item.type` held to what it must do with one — not to what its default would do (the reviewer's
 * constraint, `docs/review/responses/bf2666a.md`):
 *
 * - a swap sheet's tiers that search the whole catalogue never offer an unplaced excerpt, and a
 *   swap that leaves songs out leaves excerpts out (`selectors.tieredAlternatives`);
 * - the session's slots that leave songs out leave excerpts out; the repertoire slot and repertoire
 *   retention keep to songs; "the same kind" of an exercise is never an excerpt (`session.ts`);
 * - the Skills screen lists no excerpt as practice for a skill until F places it;
 * - the Library filters excerpts by their own type and lists one under its own title with the
 *   parent named, its source and licence the parent's;
 * - a run of an excerpt writes the cut's file identity into its evidence context as `material`,
 *   the stored self-assessment keeps it, and the parent is neither passed nor performed by it;
 * - the Score screen opens an excerpt as it opens any notated item.
 *
 * Since E1a the teaching-use admission refuses an excerpt without a `yes` on its cut from every
 * automatic offer, so an undecided excerpt no longer tells a reader's own rule from the admission:
 * the reader cases below use an excerpt with a `yes` (`APPROVED`), so what keeps it out is the
 * reader's rule alone — unplaced is not placed, a passage is not an exercise, not the piece. And the
 * Library and exploration stay open to an undecided excerpt (E1a item 4 (c)).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { admittedForTeaching, eligibleFor } from '../../src/curriculum/eligibility';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { buildSession, swapOptions, type BuildInput } from '../../src/curriculum/session';
import { cutIdentity, excerptLine, isExcerpt, isExerciseKind, isPieceMaterial } from '../../src/curriculum/excerpt';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import {
  getProgress,
  learnedPieces,
  recentPerformances,
  recordRun,
  resetProgressForTest,
  sessionsForItem,
  type RunResult,
} from '../../src/data/progressStore';
import { evidenceFor, isRefusal } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { buildConcepts } from '../../src/ui/screens/SkillsScreen';
import { matches } from '../../src/ui/screens/LibraryScreen';
import { isPlayable, targetFor } from '../../src/ui/openItem';
import { phrase, line } from './helpers/phrase';
import { observe } from './helpers/observed';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { measured } from './helpers/measured';

const TODAY = new Date(2026, 9, 20, 9);
const daysAgo = (n: number): string => new Date(2026, 9, 20 - n, 12).toISOString();

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 3, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

const PARENT = item('song.minuet', {
  title: 'Minuet in F',
  source: { name: 'PDMX (MuseScore upload)', url: 'https://musescore.com/score/1', license: 'cc-zero' },
  ...measured(['key.signature']),
});
const EXCERPT = item('excerpt.minuet.b25-32', {
  type: 'excerpt',
  title: 'Minuet in F, bars 25–32',
  excerptOf: PARENT.id,
  concepts: ['key-signatures'],
  source: PARENT.source,
  ...measured(['key.signature']),
  provenance: {
    source: 'excerpt',
    facts: {},
    review: { score: null, teaching: null },
    excerpt: { of: PARENT.id, fromBar: 25, toBar: 32, selection: 'both', cutVersion: 1, parentSha256: 'a'.repeat(64), key: 'b'.repeat(64) },
  },
});
/**
 * The same cut with a teaching-use `yes` on its identity (E1a), as the build writes one: admitted, so
 * a reader that keeps it out does so by its own rule.
 */
const APPROVED: CatalogItem = {
  ...EXCERPT,
  provenance: {
    ...(EXCERPT.provenance as NonNullable<CatalogItem['provenance']>),
    facts: { reviewedTeaching: { kind: 'reviewed', via: 'content/review/decisions.jsonl', value: 'yes' } },
    review: { score: null, teaching: true },
  },
};
const EXERCISE = item('exercise.study', { type: 'exercise', concepts: ['key-signatures'], ...measured(['key.signature']) });
const OTHER_SONG = item('song.other', measured(['key.signature']));

const lesson = (id: string, over: Partial<Lesson>): Lesson => ({
  id,
  title: `Lesson ${id}`,
  concepts: ['key-signatures'],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  ...over,
});

function curriculum(lessons: Lesson[]): Curriculum {
  return {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [{ number: 3, title: 'Three', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons }] }],
  };
}

describe('what an excerpt is, to the readers', () => {
  it('is music from a piece, never an exercise kind', () => {
    expect(isExcerpt(EXCERPT)).toBe(true);
    expect(isPieceMaterial(EXCERPT)).toBe(true);
    expect(isExerciseKind(EXCERPT)).toBe(false);
    expect(isPieceMaterial(EXERCISE)).toBe(false);
  });
});

describe('the swap sheet (selectors.tieredAlternatives)', () => {
  const learner = { taught: (): boolean => true };
  const CUR = curriculum([lesson('3.1', { exerciseOptions: [EXERCISE.id], songOptions: [OTHER_SONG.id] })]);

  it('offers an unplaced excerpt from no tier that searches the whole catalogue, even one with a teaching-use yes', () => {
    const catalog = indexCatalog([PARENT, APPROVED, EXERCISE, OTHER_SONG]);
    const offered = tieredAlternatives({ itemId: OTHER_SONG.id, lessonId: '3.1' }, CUR, catalog, undefined, learner).map((one) => one.item.id);
    expect(offered).not.toContain(APPROVED.id);
    // The same catalogue offers the parent through the demand tier: the excerpt is left out for what it is, not for its demands.
    expect(offered).toContain(PARENT.id);
  });

  it('leaves an excerpt out where it leaves songs out, even one a rung lists and a yes admits', () => {
    const placed = curriculum([lesson('3.1', { exerciseOptions: [EXERCISE.id, 'exercise.two'], songOptions: [APPROVED.id] })]);
    const catalog = indexCatalog([PARENT, APPROVED, EXERCISE, item('exercise.two', { type: 'exercise', ...measured(['key.signature']) })]);
    const offered = tieredAlternatives({ itemId: EXERCISE.id, lessonId: '3.1', excludeSongs: true }, placed, catalog, undefined, learner).map((one) => one.item.id);
    expect(offered).toContain('exercise.two');
    expect(offered).not.toContain(APPROVED.id);
  });
});

describe('the session (session.ts)', () => {
  // The cut with a yes, so the teaching-use admission lets it through and each reader's own rule is what is held.
  const PLACED = curriculum([
    lesson('3.1', {
      exerciseOptions: [EXERCISE.id],
      songOptions: [APPROVED.id, OTHER_SONG.id],
      requirements: [{ kind: 'runs', from: 'any', count: 1 }],
    }),
  ]);
  const ITEMS = [PARENT, APPROVED, EXERCISE, OTHER_SONG];

  function session(extra: Partial<BuildInput> = {}): ReturnType<typeof buildSession> {
    return buildSession({
      curriculum: PLACED,
      catalog: indexCatalog(ITEMS),
      items: ITEMS,
      states: rungState([], PLACED, VOCABULARY_V0, TODAY),
      rows: [],
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
      ...extra,
    });
  }

  it('never makes an excerpt the repertoire slot’s piece or a technique slot’s exercise', () => {
    const built = session();
    for (const slot of built.slots) {
      if (slot.kind === 'repertoire' || slot.kind === 'technique') expect(slot.item?.id, slot.kind).not.toBe(EXCERPT.id);
    }
  });

  it('never brings an excerpt back as a piece to keep playable (repertoire retention keeps to songs)', () => {
    const learned = [{ itemId: EXCERPT.id, status: 'passed' as const, lastPlayed: daysAgo(60) }];
    const review = session({ learned, lastPlayed: new Map([[EXCERPT.id, daysAgo(60)]]) }).slots.find((slot) => slot.kind === 'review');
    expect(review?.claim?.kind === 'piece-retention' && review.item?.id === EXCERPT.id).toBe(false);
  });

  it('never offers an excerpt as "the same kind" of an exercise on the swap sheet’s last resort', () => {
    // An exercise alone on 3.2 with nothing for any tier, and an excerpt a reached rung (3.1) lists.
    const lonely = item('exercise.lonely', { type: 'exercise', ...measured([]) });
    const cur = curriculum([lesson('3.1', { songOptions: [APPROVED.id] }), lesson('3.2', { exerciseOptions: [lonely.id] })]);
    const options = swapOptions(
      { kind: 'technique', item: lonely, lessonId: '3.2', minutes: 5, reason: '' },
      [],
      cur,
      indexCatalog([lonely, APPROVED]),
      { rung: '3.2', activeTracks: ['core'] },
    );
    expect(options.map((one) => one.item.id)).not.toContain(APPROVED.id);
    // The same walk offers a song for a song: the last resort still runs.
    const song = item('song.lonely', measured([]));
    const withSong = curriculum([lesson('3.1', { songOptions: [OTHER_SONG.id, APPROVED.id] }), lesson('3.2', { songOptions: [song.id] })]);
    const forSong = swapOptions({ kind: 'new', item: song, lessonId: '3.2', minutes: 5, reason: '' }, [], withSong,
      indexCatalog([song, OTHER_SONG, APPROVED]), { rung: '3.2', activeTracks: ['core'] }).map((one) => one.item.id);
    expect(forSong).toContain(OTHER_SONG.id);
    expect(forSong).not.toContain(APPROVED.id);
  });
});

describe('the Skills screen (buildConcepts)', () => {
  it('lists no excerpt as practice for a skill; an exercise it lists', () => {
    const entries = buildConcepts(curriculum([lesson('3.1', {})]), [EXCERPT, EXERCISE], new Map());
    const listed = entries.flatMap((entry) => entry.items.map((one) => one.id));
    expect(listed).toContain(EXERCISE.id);
    expect(listed).not.toContain(EXCERPT.id);
  });
});

describe('the Library', () => {
  const filters = { query: '', type: 'excerpt', track: 'all', status: 'all', hands: 'all', minLevel: 0, maxLevel: 10, importedOnly: false, sort: 'level' } as const;

  it('filters excerpts by their own type', () => {
    expect(matches(EXCERPT, filters as never, new Map())).toBe(true);
    expect(matches(PARENT, filters as never, new Map())).toBe(false);
  });

  it('lists an excerpt under its own title with the parent named, and its source is the parent’s', () => {
    const byId = new Map([PARENT, EXCERPT].map((one) => [one.id, one]));
    expect(excerptLine(EXCERPT, byId)).toBe('From Minuet in F, bars 25–32');
    expect(excerptLine(PARENT, byId)).toBeUndefined();
    expect(EXCERPT.source).toEqual(PARENT.source);
  });
});

/**
 * E1a item 4 (c): the admission closes automatic offers only. The Library lists an excerpt whatever its
 * teaching-use bit and the opener opens it (exploration), and neither asks the gate or the admission;
 * the detail sheet says nothing of the bit in this seam (the reviewer's constraint, `responses/7bdd8a0.md`).
 */
describe('the Library and exploration, whatever the teaching-use bit (E1a)', () => {
  const filters = { query: '', type: 'excerpt', track: 'all', status: 'all', hands: 'all', minLevel: 0, maxLevel: 10, importedOnly: false, sort: 'level' } as const;
  const COPES = { taught: (): boolean => true };
  const REJECTED: CatalogItem = {
    ...EXCERPT,
    provenance: { ...(EXCERPT.provenance as NonNullable<CatalogItem['provenance']>), review: { score: null, teaching: false } },
  };

  it('lists an undecided cut, one with a no and one with a yes, and opens each as a score for exploration; only the yes is admitted to an automatic offer', () => {
    for (const row of [EXCERPT, REJECTED, APPROVED]) {
      const bit = String(row.provenance?.review.teaching);
      expect(matches(row, filters as never, new Map()), bit).toBe(true);
      expect(targetFor(row), bit).toBe('score');
      expect(isPlayable(row), bit).toBe(true);
      expect(eligibleFor(row, COPES, { for: 'exploration' }), bit).toEqual({ verdict: 'eligible', for: 'exploration' });
    }
    expect([EXCERPT, REJECTED, APPROVED].map(admittedForTeaching)).toEqual([false, false, true]);
  });

  it('on the built catalogue, every excerpt is undecided, listed by the Library’s excerpt filter and open to exploration, and admitted to no automatic offer', () => {
    const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
    const cuts = catalog.filter(isExcerpt);
    expect(cuts.length, 'no excerpt in the built catalogue — has the content build run?').toBeGreaterThan(0);
    expect(catalog.filter((one) => matches(one, filters as never, new Map())).map((one) => one.id).sort()).toEqual(cuts.map((one) => one.id).sort());
    for (const cut of cuts) {
      expect(cut.provenance?.review.teaching, cut.id).toBeNull();
      expect(targetFor(cut), cut.id).toBe('score');
      expect(eligibleFor(cut, COPES, { for: 'exploration' }).verdict, cut.id).toBe('eligible');
      expect(admittedForTeaching(cut), cut.id).toBe(false);
    }
  });

  it('the Library and the opener ask neither the gate nor the admission', () => {
    for (const file of ['src/ui/screens/LibraryScreen.ts', 'src/ui/openItem.ts']) {
      expect(readFileSync(join(process.cwd(), file), 'utf8'), file).not.toMatch(/eligib|admittedForTeaching/);
    }
  });
});

describe('the Score screen', () => {
  it('opens an excerpt as it opens any notated item', () => {
    expect(targetFor(EXCERPT)).toBe('score');
  });
});

describe('a run of an excerpt (adversary 10, and the material it was)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  const run = (over: Partial<RunResult> = {}): RunResult => ({
    itemId: EXCERPT.id,
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    passed: true,
    masterEligible: true,
    tempoMeasured: true,
    performance: true,
    material: { kind: 'file', sha256: 'c'.repeat(64) },
    ...over,
  });

  it('marks the excerpt passed, and the parent neither passed nor performed', async () => {
    await recordRun(run(), TODAY);
    expect((await getProgress(EXCERPT.id)).status).toBe('passed');
    const parent = await getProgress(PARENT.id);
    expect(parent.attempts).toBe(0);
    expect(parent.status).toBe('new');
    expect(await sessionsForItem(PARENT.id)).toEqual([]);
    const performances = await recentPerformances();
    expect(performances.map((row) => row.itemId)).toEqual([EXCERPT.id]);
  });

  it('keeps the material on the stored row, beside the item and the seed', async () => {
    await recordRun(run(), TODAY);
    const [stored] = await sessionsForItem(EXCERPT.id);
    expect(stored?.material).toEqual({ kind: 'file', sha256: 'c'.repeat(64) });
  });

  it('is never a learned piece the session keeps playable', async () => {
    await recordRun(run(), TODAY);
    const learned = learnedPieces([await getProgress(EXCERPT.id)], () => false);
    // The store lists what was passed; the session's repertoire retention keeps to songs (above).
    expect(learned.map((one) => one.itemId)).toEqual([EXCERPT.id]);
  });

  it('writes the cut’s file identity into the evidence context, and the stored self-assessment keeps it', async () => {
    // A played run, as the evidence suites make one (the real engine, `measuresOf`): a ledger-line
    // note in bar 1, every note right.
    const LEDGER = phrase({ bars: [line(['E4', 'F4', 'A5', 'G4'], 1), line(['E4', 'D4', 'C4', 'D4'], 1)] });
    const material = { kind: 'file' as const, sha256: 'c'.repeat(64) };
    const observation = { ...observe(LEDGER, { mode: 'tempo', itemId: EXCERPT.id }), material };
    const [measuredResult] = evidenceFor({ observation, played: LEDGER, targetSkills: ['ledger-lines'], vocabulary: VOCABULARY_V0 });
    expect(measuredResult && !isRefusal(measuredResult), JSON.stringify(measuredResult)).toBe(true);
    expect(measuredResult?.kind === 'measured' ? measuredResult.context.material : undefined).toEqual(material);
    // The learner's own word about a run nothing measured keeps the same pick (itemId, seed, material).
    const unheard = { ...observe(LEDGER, { mode: 'tempo', itemId: EXCERPT.id, silent: true }), material, selfReport: 'ok' as const };
    const [told] = evidenceFor({ observation: unheard, played: LEDGER, targetSkills: ['ledger-lines'], vocabulary: VOCABULARY_V0 });
    expect(told?.kind === 'self-assessed' ? told.context.material : undefined, JSON.stringify(told)).toEqual(material);
    expect(await cutIdentity(new Uint8Array([1, 2, 3]))).toEqual({
      kind: 'file',
      sha256: '039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81',
    });
  });
});
