/**
 * Review has two reasons, and the line says which (C6 item 2; the reviewer's
 * correction of 2026-09-26).
 *
 * *Skill retention* — a skill whose evidence the reads have not shown for the
 * ladder's retention span — is `slotsFromEvidence.test.ts`'s learner B.
 * *Repertoire retention* is here: a piece the learner learned deserves playing
 * again when it has not been played for the repertoire window, **even when
 * every skill it carries was shown yesterday elsewhere**, because reading
 * eighths in time does not mean the learner still remembers the piece. The
 * line is the piece's ("keeping this piece playable"), never a skill's.
 *
 * It replaces the item calendar (`reviewQueue`: 1, 3, 7 and 21 days after a
 * first pass, one due item a session) rather than deleting its role, and it
 * retires the repertoire slot's mastered-piece-every-session habit (L17): a
 * learned piece comes back when it has gone unplayed for the window, in the
 * review row.
 *
 * The last block is G1d's: the review reads the learner's project for one
 * thing — a piece they paused or put away on its project sheet is not offered
 * as a piece to keep playable (the reviewer's G82 ruling). Every case before it
 * passes no projects, which suppresses nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  buildSession,
  FALLBACK_ORDER,
  REPERTOIRE_WINDOW_DAYS,
  type BuildInput,
  type SessionSlot,
} from '../../src/curriculum/session';
import { knownMaterial, materialKey } from '../../src/curriculum/material';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import * as progressStore from '../../src/data/progressStore';
import { learnedPieces, type LearnedPiece } from '../../src/data/progressStore';
import { ACTION_STATE, PROJECT_STATES, type ProjectAction, type ProjectRow, type ProjectState } from '../../src/data/projectStore';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { RETENTION_DAYS } from '../../src/evidence/ladder';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Identity } from '../../src/review/record';
import { measured } from './helpers/measured';

const TODAY = new Date(2026, 9, 20, 9);
const daysAgo = (n: number, hour = 12): string => new Date(2026, 9, 20 - n, hour).toISOString();

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

/** The piece carries eighths: it declares subdivision, as D will have pieces declare what they train. */
const PIECE = item('song.learned', { targetSkills: ['subdivision'] });
const READING_ROW = item('drill.reading.row', {
  type: 'drill',
  file: null,
  drill: { kind: 'sight-reading', params: { level: 2, hands: 'right' } },
  targetSkills: ['sight-reading', 'subdivision'],
});
const ITEMS: CatalogItem[] = [
  PIECE,
  READING_ROW,
  item('ex.now', { type: 'exercise' }),
  item('song.now'),
  item('song.now.2'),
];

const lesson = (id: string, over: Partial<Lesson>): Lesson => ({
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

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    {
      number: 2,
      title: 'Two',
      summary: '',
      units: [
        {
          id: 'u',
          title: 'U',
          track: 'core',
          lessons: [
            lesson('2.1', { songOptions: ['song.learned'] }),
            lesson('2.2', { exerciseOptions: ['drill.reading.row', 'ex.now'], songOptions: ['song.now', 'song.now.2'] }),
          ],
        },
      ],
    },
  ],
};

/** A read yesterday whose stored evidence shows subdivision (and sight-reading), right 8 of 8. */
function readYesterday(id: number): SessionRow {
  const at = daysAgo(1, 9);
  const shown = (skill: string): MeasuredEvidence =>
    ({
      kind: 'measured',
      skill,
      standard: 'full',
      n: 8,
      right: 8,
      at,
      observationId: id,
      context: { itemId: READING_ROW.id, firstContact: true, met: [], unattributed: 0, estimated: false },
      byDemand: [],
    }) as unknown as MeasuredEvidence;
  return {
    id,
    itemId: READING_ROW.id,
    lessonId: '2.2',
    mode: 'tempo',
    tempoPct: 70,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    unseen: true,
    at,
    evidenceDefinitions: EVIDENCE_DEFINITIONS,
    evidence: [shown('sight-reading'), shown('subdivision')],
  };
}

/** The piece passed on 2.1, from 2.1's page, `days` ago, and not played since. */
function passedOn21(days: number): SessionRow {
  return {
    id: 100,
    itemId: PIECE.id,
    lessonId: '2.1',
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 0.95,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 120_000,
    at: daysAgo(days),
  };
}

function reviewAfter(days: number, extra: Partial<BuildInput> = {}): SessionSlot | undefined {
  const rows = [passedOn21(days), readYesterday(1)];
  const learned: LearnedPiece[] = [{ itemId: PIECE.id, status: 'passed', lastPlayed: daysAgo(days) }];
  return buildSession({
    curriculum: CURRICULUM,
    catalog: indexCatalog(ITEMS),
    items: ITEMS,
    states: rungState(rows, CURRICULUM, VOCABULARY_V0, TODAY),
    rows,
    readingRows: rows.filter((row) => row.itemId === READING_ROW.id),
    learned,
    lastPlayed: new Map(rows.map((row) => [row.itemId, row.at])),
    activeTracks: ['core'],
    minutes: 15,
    today: TODAY,
    ...extra,
  }).slots.find((slot) => slot.kind === 'review');
}

describe('a learned piece returns after the repertoire window, though every skill it carries was shown yesterday', () => {
  it('at the window, the review is the piece, and the line is the piece’s', () => {
    const review = reviewAfter(REPERTOIRE_WINDOW_DAYS);
    expect(review?.item?.id).toBe(PIECE.id);
    expect(review?.claim?.kind).toBe('piece-retention');
    expect(review?.reason).toMatch(/^Keeping this piece playable — last played /);
    // Not a skill's words: subdivision was shown yesterday, and the line says nothing about it.
    expect(review?.reason.toLowerCase()).not.toContain('subdivision');
    expect(review?.reason).not.toMatch(/shown/);
  });

  it('a day inside the window it is not due, and nothing claims it is', () => {
    const review = reviewAfter(REPERTOIRE_WINDOW_DAYS - 1);
    expect(review?.claim?.kind).not.toBe('piece-retention');
    expect(review?.item?.id).not.toBe(PIECE.id);
  });

  it('the window is its own named hypothesis, not the ladder’s retention span', () => {
    expect(REPERTOIRE_WINDOW_DAYS).toBeGreaterThan(0);
    expect(REPERTOIRE_WINDOW_DAYS).not.toBe(RETENTION_DAYS);
  });

  it('the old item calendar is gone: a piece passed yesterday is not "due for review today"', () => {
    const review = reviewAfter(1);
    expect(review?.reason ?? '').not.toContain('Due for review');
    expect(review?.claim?.kind).not.toBe('piece-retention');
    expect('reviewQueue' in progressStore, 'the calendar still exported').toBe(false);
  });
});

describe('what counts as learned (progressStore.learnedPieces)', () => {
  const row = (over: Partial<ProgressRow>): ProgressRow => ({
    itemId: 'song.x',
    status: 'passed',
    bestAccuracy: 0.95,
    bestTempoPct: 100,
    attempts: 3,
    lastPracticedAt: daysAgo(20),
    minutes: 12,
    passedOn: ['2026-09-30'],
    ...over,
  });
  const generated = (id: string): boolean => id.startsWith('drill.reading');

  it('a piece passed or mastered on a measured run, with when it was last played', () => {
    const learned = learnedPieces(
      [row({ itemId: 'song.passed' }), row({ itemId: 'song.mastered', status: 'mastered' }), row({ itemId: 'song.started', status: 'started', passedOn: [] })],
      generated,
    );
    expect(learned).toEqual([
      { itemId: 'song.passed', status: 'passed', lastPlayed: daysAgo(20) },
      { itemId: 'song.mastered', status: 'mastered', lastPlayed: daysAgo(20) },
    ]);
  });

  it('never a generated reading row, whatever an older build wrote on it, and never the learner’s word alone', () => {
    const learned = learnedPieces(
      [row({ itemId: 'drill.reading.row', status: 'mastered' }), row({ itemId: 'song.said', selfPassed: true })],
      generated,
    );
    expect(learned).toEqual([]);
  });

  it('and the session never offers a reading row as a piece to keep playable, even if it is handed one', () => {
    const review = reviewAfter(REPERTOIRE_WINDOW_DAYS - 1, {
      learned: [{ itemId: READING_ROW.id, status: 'mastered', lastPlayed: daysAgo(60) }],
    });
    expect(review?.claim?.kind).not.toBe('piece-retention');
  });
});

describe('a piece, not a scale', () => {
  it('a scale passed a month ago is technique, kept warm by the exposure rule, never "a piece to keep playable"', () => {
    const SCALE = item('ex.scale', { type: 'exercise', drill: { kind: 'scale', params: {} } });
    const rows = [readYesterday(1)];
    const review = buildSession({
      curriculum: CURRICULUM,
      catalog: indexCatalog([...ITEMS, SCALE]),
      items: [...ITEMS, SCALE],
      states: rungState(rows, CURRICULUM, VOCABULARY_V0, TODAY),
      rows,
      readingRows: rows,
      learned: [{ itemId: SCALE.id, status: 'passed', lastPlayed: daysAgo(30) }],
      lastPlayed: new Map([[SCALE.id, daysAgo(30)]]),
      activeTracks: ['core'],
      minutes: 15,
      today: TODAY,
    }).slots.find((slot) => slot.kind === 'review');
    expect(review?.claim?.kind).not.toBe('piece-retention');
  });
});

describe('neither reason is dropped for the other', () => {
  it('a skill not shown for weeks and a piece past its window: Shuffle reaches both, each in its own words', () => {
    // Subdivision last shown five weeks ago (not yesterday), and the piece a month unplayed.
    const old = { ...readYesterday(1), at: daysAgo(35) };
    const rows = [passedOn21(30), old];
    const learned: LearnedPiece[] = [{ itemId: PIECE.id, status: 'passed', lastPlayed: daysAgo(30) }];
    const review = (seed: number): SessionSlot | undefined =>
      buildSession({
        curriculum: CURRICULUM,
        catalog: indexCatalog(ITEMS),
        items: ITEMS,
        states: rungState(rows, CURRICULUM, VOCABULARY_V0, TODAY),
        rows,
        readingRows: [old],
        learned,
        lastPlayed: new Map(rows.map((r) => [r.itemId, r.at])),
        activeTracks: ['core'],
        minutes: 15,
        today: TODAY,
        seed,
      }).slots.find((slot) => slot.kind === 'review');
    const kinds = new Set([0, 1, 2, 3].map((seed) => review(seed)?.claim?.kind));
    expect(kinds).toContain('skill-retention');
    expect(kinds).toContain('piece-retention');
  });
});

// ---------------------------------------------------------------------------------------------------

/**
 * The learner's project, read for one thing (G1d; the reviewer's G82 ruling, `responses/536d9bc2.md`):
 * a piece the learner paused or put away on its project sheet is not offered as *Keeping this piece
 * playable* — the sentence would contradict what they said there. Every other state (`maintaining`, the
 * positive retention state; `refreshing`, active work; `saved`, `learning`, `polishing`,
 * `performance-ready`) and no project leave the offer exactly as it was. The project is the one the
 * lesson page and Progress find (`projectStore.projectIn` over `materialOfItem`). Nothing on the card says
 * why. With `projects` absent, as in every case above, nothing is suppressed.
 */
describe('a piece the learner paused or put away is not kept playable by the review (G1d; G82)', () => {
  const DUE = REPERTOIRE_WINDOW_DAYS + 1;
  const SUPPRESSED: readonly ProjectState[] = ['paused', 'retired'];
  /**
   * The file's items measured, with no demands, as the build writes every bundled row: the ladder's
   * rung step asks the one gate, which offers no unmeasured option automatically (X1, L113), so with
   * the unmeasured items above a review with nothing due has no row at all, and "the ladder's row"
   * would be a missing row.
   */
  const MEASURED: CatalogItem[] = ITEMS.map((one) => (one.id === READING_ROW.id ? one : { ...one, ...measured([]) }));

  /** The input `reviewAfter` builds, on the measured items, whole, so a case can read every slot of the card. */
  function inputAfter(days: number, extra: Partial<BuildInput> = {}): BuildInput {
    const rows = [passedOn21(days), readYesterday(1)];
    return {
      curriculum: CURRICULUM,
      catalog: indexCatalog(MEASURED),
      items: MEASURED,
      states: rungState(rows, CURRICULUM, VOCABULARY_V0, TODAY),
      rows,
      readingRows: rows.filter((row) => row.itemId === READING_ROW.id),
      learned: [{ itemId: PIECE.id, status: 'passed', lastPlayed: daysAgo(days) }],
      lastPlayed: new Map(rows.map((row) => [row.itemId, row.at])),
      activeTracks: ['core'],
      minutes: 15,
      today: TODAY,
      ...extra,
    };
  }
  const reviewOf = (input: BuildInput): SessionSlot | undefined => buildSession(input).slots.find((slot) => slot.kind === 'review');
  /** What the learner reads on the row, and what chose it. */
  const shown = (slot: SessionSlot | undefined): { item?: string; claim?: SessionSlot['claim']; reason?: string } => ({
    item: slot?.item?.id,
    claim: slot?.claim,
    reason: slot?.reason,
  });

  /**
   * A project row as the sheet keeps one: keyed by the piece's material where it has one, else by its
   * id (`projectStore.projectKey`). The history is one line entering the state; the session reads the
   * state alone.
   */
  function project(state: ProjectState, itemId: string, material?: Identity): ProjectRow {
    const at = daysAgo(3);
    const why = (Object.keys(ACTION_STATE) as ProjectAction[]).find((action) => ACTION_STATE[action] === state) as ProjectAction;
    return {
      id: materialKey(material, itemId),
      material: knownMaterial(material) ? material : { kind: 'id', itemId },
      itemId,
      state,
      since: at,
      history: [{ state, at, why }],
    };
  }

  it('paused, and put away: not offered, nothing on the card says why, and the review is the ladder’s — the row of a learner with no piece to keep', () => {
    // Without a project the piece is due and offered, in its own words.
    expect(shown(reviewOf(inputAfter(DUE)))).toMatchObject({ item: PIECE.id, claim: { kind: 'piece-retention' } });
    // The ladder's row: the same learner with nothing learned, so nothing due.
    const ladder = shown(reviewOf(inputAfter(DUE, { learned: [] })));
    expect(FALLBACK_ORDER as readonly string[]).toContain(ladder.claim?.kind);
    for (const state of SUPPRESSED) {
      const card = buildSession(inputAfter(DUE, { projects: [project(state, PIECE.id)] })).slots;
      const review = card.find((slot) => slot.kind === 'review');
      expect(review?.item?.id, `${state}: the piece is still offered`).not.toBe(PIECE.id);
      expect(review?.claim?.kind, `${state}: still a piece to keep playable`).not.toBe('piece-retention');
      expect(shown(review), `${state}: the review is not the ladder's`).toEqual(ladder);
      // Silent (the brief's item 3): the learner said it on the sheet, and no line on the card repeats it.
      expect(card.map((slot) => slot.reason).join(' · '), state).not.toMatch(/paus|put away|project|not offered/i);
    }
  });

  it('every other state — maintaining, refreshing, saved and the rest — and no project leave the whole card as it was', () => {
    const before = buildSession(inputAfter(DUE)).slots;
    expect(before.find((slot) => slot.kind === 'review')?.claim?.kind).toBe('piece-retention');
    const others = PROJECT_STATES.filter((state) => !SUPPRESSED.includes(state));
    // The ruling names two states; a state added to the lifecycle asks for its own decision here.
    expect(others).toEqual(['saved', 'learning', 'polishing', 'performance-ready', 'maintaining', 'refreshing']);
    for (const state of others) {
      expect(buildSession(inputAfter(DUE, { projects: [project(state, PIECE.id)] })).slots, state).toEqual(before);
    }
    expect(buildSession(inputAfter(DUE, { projects: [] })).slots, 'no project').toEqual(before);
    // Another piece's project, paused or put away, is that piece's.
    const elsewhere = [project('paused', 'song.now'), project('retired', 'song.now.2')];
    expect(buildSession(inputAfter(DUE, { projects: elsewhere })).slots, 'another piece’s project').toEqual(before);
  });

  it('the project is found as the lesson page and Progress find it: the same file under another id is the piece; another id’s id-only row is not', () => {
    const FILE: Identity = { kind: 'file', sha256: 'f'.repeat(64) };
    const EARLIER: Identity = { kind: 'file', sha256: 'e'.repeat(64) };
    const provenance = { source: 'kern' as const, facts: {}, review: { score: null, teaching: null }, identity: FILE };
    const items = MEASURED.map((one) => (one.id === PIECE.id ? { ...one, provenance } : one));
    const offered = (projects: ProjectRow[]): SessionSlot | undefined => reviewOf(inputAfter(DUE, { items, catalog: indexCatalog(items), projects }));
    expect(offered([])?.claim?.kind, 'a piece with a file is offered like any').toBe('piece-retention');
    // The same file, its project made under another catalogue id: one piece, one project.
    expect(offered([project('paused', 'song.learned.twin', FILE)])?.item?.id, 'the same file under another id').not.toBe(PIECE.id);
    // Its own id, the project made on a file the catalogue has since built again: still its project.
    expect(offered([project('retired', PIECE.id, EARLIER)])?.item?.id, 'its own id, an earlier file').not.toBe(PIECE.id);
    // Never guessed: another id's id-only row, or another file's row under another id, is not this piece's.
    expect(shown(offered([project('paused', 'song.learned.twin')])), 'another id’s id-only row').toEqual(shown(offered([])));
    expect(shown(offered([project('paused', 'song.other', EARLIER)])), 'another file under another id').toEqual(shown(offered([])));
  });

  it('pieces due, the most overdue one paused: the next is offered in its own words, and the order of the rest is untouched', () => {
    const SECOND = item('song.learned.2', measured([]));
    const THIRD = item('song.learned.3', measured([]));
    const items = [...MEASURED, SECOND, THIRD];
    const learned: LearnedPiece[] = [
      { itemId: PIECE.id, status: 'passed', lastPlayed: daysAgo(40) },
      { itemId: SECOND.id, status: 'passed', lastPlayed: daysAgo(30) },
      { itemId: THIRD.id, status: 'passed', lastPlayed: daysAgo(20) },
    ];
    const at = (seed: number, projects?: ProjectRow[]): ReturnType<typeof shown> =>
      shown(reviewOf(inputAfter(40, { items, catalog: indexCatalog(items), learned, seed, ...(projects ? { projects } : {}) })));
    // Without a project: the most overdue first, and Shuffle reaches the others in order.
    const before = [0, 1, 2].map((seed) => at(seed));
    expect(before.map((one) => one.item)).toEqual([PIECE.id, SECOND.id, THIRD.id]);
    expect(before.map((one) => one.claim?.kind)).toEqual(['piece-retention', 'piece-retention', 'piece-retention']);
    // The most overdue paused: the second is offered, exactly as it was offered second, then the third.
    const paused = [project('paused', PIECE.id)];
    expect([0, 1].map((seed) => at(seed, paused))).toEqual([before[1], before[2]]);
  });
});
