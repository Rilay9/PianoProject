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
 *
 * After it, G1e's (the G1d review's required change): the same project read
 * once for the whole card, and no automatic chooser — retention, the
 * repertoire slot's demand-based choice, the fallback ladder's skill, demand
 * and prerequisite steps, the exposure rule, the jam slot — offers a piece the
 * learner paused or put away; and, by the reviewer's ruling on G1e, neither does
 * a rung's own ask or the ladder's rung step: the rung's other option is chosen,
 * and a rung whose every piece is paused revives none and says it waits.
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
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import * as progressStore from '../../src/data/progressStore';
import { learnedPieces, type LearnedPiece } from '../../src/data/progressStore';
import { ACTION_STATE, PROJECT_STATES, type ProjectAction, type ProjectRow, type ProjectState } from '../../src/data/projectStore';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { RETENTION_DAYS } from '../../src/evidence/ladder';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
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
    // Another piece's project, paused or put away, is that piece's. Revised (G1e, the reviewer's ruling on
    // G1e): these were 2.2's own songs, and a pause now withdraws a rung's song from the card too (the G1e
    // block below), so the other pieces are ones no rung of this card lists. Old assumption: a paused song
    // the learner's rung asks for leaves the card as it was.
    const elsewhere = [project('paused', 'song.elsewhere'), project('retired', 'song.elsewhere.2')];
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

// ---------------------------------------------------------------------------------------------------

/**
 * One rule for every automatic offer (G1e; the G1d review's required change, `responses/d59f2ef8.md`;
 * G89). G1d taught the review's retention the learner's word, and the repertoire slot's fallback did not
 * hear it: in a thin catalogue the same paused piece came back as *A piece you know — for variety*
 * (`runs/G1d/probe-a-piece-you-know.txt`). The session now reads the projects Today passes once, as one
 * predicate built in `buildSession`'s context assembly, and every chooser that offers a piece of its own
 * accord reads it — retention, the repertoire slot's demand-based choice, the fallback ladder's skill,
 * demand and prerequisite steps, the exposure rule, the jam slot, and the transfer offer (its case is in
 * `transferOffer.test.ts`, beside its learner) — so that no chooser has a piece paused or put away among its
 * candidates: on each learner here the card is the card of the catalogue without it. (What the learner
 * played stays played: the exposure rule's *none played since* still reads every play of a family, the one
 * place a paused piece still counts, and none of these learners turns on it.) Revised (the reviewer's
 * required change on G1e, `responses/questions-ea14b1fe.md`): a rung's own ask (its `runs`, `done` and
 * `measure` asks, this lesson's or the next's) and the ladder's rung step read the same rule — the rung's
 * other option is chosen; with every piece option paused or put away none is revived, the rung is not taken
 * as met, and the new row says the lesson waits (the (d) cases). Old assumption: the brief's item 3 left the
 * rung's own list exactly as it was. Silent otherwise, as G1d.
 */
describe('a piece paused or put away is offered by no automatic chooser, a rung’s own ask and the rung step included (G1e; G89; the reviewer’s ruling)', () => {
  const DUE = REPERTOIRE_WINDOW_DAYS + 1;
  const WITHDRAWN: readonly ProjectState[] = ['paused', 'retired'];
  const KEPT: readonly ProjectState[] = PROJECT_STATES.filter((state) => !WITHDRAWN.includes(state));
  /** A project row as the sheet keeps one for an item that names no material: the id's (identity is G1d's case). */
  const rowFor = (state: ProjectState, itemId: string): ProjectRow => {
    const at = daysAgo(3);
    const why = (Object.keys(ACTION_STATE) as ProjectAction[]).find((action) => ACTION_STATE[action] === state) as ProjectAction;
    return { id: materialKey(undefined, itemId), material: { kind: 'id', itemId }, itemId, state, since: at, history: [{ state, at, why }] };
  };
  const named = (slots: readonly SessionSlot[], id: string): SessionSlot[] => slots.filter((slot) => slot.item?.id === id);
  const rows = (slots: readonly SessionSlot[], id: string): string[] => named(slots, id).map((slot) => `${slot.kind} (${slot.claim?.kind ?? '-'}): ${slot.reason}`);
  const words = (slots: readonly SessionSlot[]): string => slots.map((slot) => slot.reason).join(' · ');
  /** The same learner with the item gone from the catalogue: what every automatic chooser should see of a withdrawn piece. */
  const without = (input: BuildInput, id: string): BuildInput => {
    const items = input.items.filter((one) => one.id !== id);
    return { ...input, items, catalog: indexCatalog(items) };
  };
  /**
   * The rule on one constructed learner: without a project the piece is on the card, chosen by `claim`;
   * paused or put away it is on no row, the whole card is the card of the catalogue without it, and no
   * line says why; every other state, and no project, leave the whole card as it was.
   */
  function holds(input: BuildInput, id: string, claim: string): void {
    const before = buildSession(input).slots;
    expect(named(before, id).map((slot) => slot.claim?.kind), `${id}: the construction does not offer it by ${claim}`).toContain(claim);
    const absent = buildSession(without(input, id)).slots;
    for (const state of WITHDRAWN) {
      const card = buildSession({ ...input, projects: [rowFor(state, id)] }).slots;
      expect(rows(card, id), `${state}: ${id} is still offered`).toEqual([]);
      expect(card, `${state}: the card is not the card without ${id}`).toEqual(absent);
      expect(words(card), state).not.toMatch(/paus|put away|project|not offered/i);
    }
    for (const state of KEPT) expect(buildSession({ ...input, projects: [rowFor(state, id)] }).slots, `${state} moved the card`).toEqual(before);
    expect(buildSession({ ...input, projects: [] }).slots, 'no project moved the card').toEqual(before);
  }

  /** The file's items measured, no demands, as the build writes every bundled row (X1, L113: a rung's list asks the one gate). */
  const MEASURED: CatalogItem[] = ITEMS.map((one) => (one.id === READING_ROW.id ? one : { ...one, ...measured([]) }));

  // --- (a), (b), (c): the thin catalogue of the G1d probe -------------------------------------------

  /** The G1d probe's catalogue: the learner's rung, 2.2, lists one song; the only learned piece is 2.1's. */
  const THIN: Curriculum = {
    ...CURRICULUM,
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
              lesson('2.2', { exerciseOptions: ['drill.reading.row', 'ex.now'], songOptions: ['song.now'] }),
            ],
          },
        ],
      },
    ],
  };
  const THIN_ITEMS = MEASURED.filter((one) => one.id !== 'song.now.2');
  /** The 30-minute card of a learner on 2.2 who mastered 2.1's piece and has not played it for the window and a day. */
  function thin(extra: Partial<BuildInput> = {}): BuildInput {
    const runs = [passedOn21(DUE), readYesterday(1)];
    return {
      curriculum: THIN,
      catalog: indexCatalog(THIN_ITEMS),
      items: THIN_ITEMS,
      states: rungState(runs, THIN, VOCABULARY_V0, TODAY),
      rows: runs,
      readingRows: runs.filter((row) => row.itemId === READING_ROW.id),
      learned: [{ itemId: PIECE.id, status: 'mastered', lastPlayed: daysAgo(DUE) }],
      lastPlayed: new Map(runs.map((row) => [row.itemId, row.at])),
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
      ...extra,
    };
  }

  it('(a, b) the thin catalogue: the only learned piece, mastered and then paused or put away, is on no row — not kept playable, not *a piece you know* — and the card is the card without it', () => {
    const before = buildSession(thin()).slots;
    // Without a project: kept playable, in the review.
    expect(rows(before, PIECE.id)).toEqual([expect.stringMatching(/^review \(piece-retention\): Keeping this piece playable — /)]);
    for (const state of WITHDRAWN) {
      const card = buildSession(thin({ projects: [rowFor(state, PIECE.id)] })).slots;
      // G1d's suppression holds: the review does not keep it playable.
      expect(card.find((slot) => slot.kind === 'review')?.claim?.kind, state).not.toBe('piece-retention');
      // And no other row brings it back: the repertoire slot's exposure step offered it as *A piece you know — for variety*.
      expect(rows(card, PIECE.id), `${state}: the piece is still on the card`).toEqual([]);
    }
    holds(thin(), PIECE.id, 'piece-retention');
  });

  it('(c) maintaining, refreshing, saved and every other state, and no project, leave the thin card exactly as it was', () => {
    expect(KEPT).toEqual(['saved', 'learning', 'polishing', 'performance-ready', 'maintaining', 'refreshing']);
    const before = buildSession(thin()).slots;
    for (const state of KEPT) expect(buildSession(thin({ projects: [rowFor(state, PIECE.id)] })).slots, state).toEqual(before);
    expect(buildSession(thin({ projects: [] })).slots, 'no project').toEqual(before);
  });

  it('the exposure rule: a family whose only piece is paused is passed over for the next family, as if it held nothing', () => {
    // A Classical rung met, its song played two days ago: the core family (2.1's piece, a fortnight and more
    // unplayed) is the one played least lately, and the Classical family the next.
    const WITH_A_TRACK: Curriculum = {
      ...THIN,
      tracks: [...THIN.tracks, { id: 'classical', title: 'Classical', description: '', startsAtStage: 0 }],
      stages: [
        {
          ...(THIN.stages[0] as Curriculum['stages'][number]),
          units: [
            ...(THIN.stages[0] as Curriculum['stages'][number]).units,
            { id: 'k', title: 'K', track: 'classical', lessons: [lesson('K1', { songOptions: ['song.k1'] })] },
          ],
        },
      ],
    };
    const K1 = item('song.k1', { tracks: ['classical'], ...measured([]) });
    const items = [...THIN_ITEMS, K1];
    const runs = [passedOn21(DUE), readYesterday(1), { ...passedOn21(2), id: 101, itemId: K1.id, lessonId: 'K1' }];
    const input = thin({
      curriculum: WITH_A_TRACK,
      items,
      catalog: indexCatalog(items),
      states: rungState(runs, WITH_A_TRACK, VOCABULARY_V0, TODAY),
      rows: runs,
      lastPlayed: new Map(runs.map((row) => [row.itemId, row.at])),
      activeTracks: ['core', 'classical'],
    });
    const repertoire = (projects?: ProjectRow[]): SessionSlot | undefined =>
      buildSession({ ...input, ...(projects ? { projects } : {}) }).slots.find((slot) => slot.kind === 'repertoire');
    // Kept playable by the review, the piece's family is on the card, and the repertoire row is the next family's.
    expect(repertoire()).toMatchObject({ item: { id: K1.id }, claim: { kind: 'exposure', family: { by: 'track', id: 'classical' } } });
    for (const state of WITHDRAWN) {
      expect(repertoire([rowFor(state, PIECE.id)]), state).toMatchObject({ item: { id: K1.id }, claim: { kind: 'exposure', family: { by: 'track', id: 'classical' } } });
    }
    holds(input, PIECE.id, 'piece-retention');
  });

  it('the exposure rule: within the family played least lately, a paused piece is passed over for the next piece of it', () => {
    // 2.1 lists a second song, never played, which the learner made a project of and paused before a run
    // (the sheet offers *Learn this* before any success); 2.1's piece was played two days ago, so nothing is
    // due. The earlier lessons' family is the repertoire row's, and in it the song not yet played comes first.
    const WITH_A_SECOND: Curriculum = {
      ...THIN,
      stages: [
        {
          ...(THIN.stages[0] as Curriculum['stages'][number]),
          units: [
            {
              id: 'u',
              title: 'U',
              track: 'core',
              lessons: [
                lesson('2.1', { songOptions: ['song.learned', 'song.other'] }),
                lesson('2.2', { exerciseOptions: ['drill.reading.row', 'ex.now'], songOptions: ['song.now'] }),
              ],
            },
          ],
        },
      ],
    };
    const items = [...THIN_ITEMS, item('song.other', measured([]))];
    const runs = [passedOn21(2), readYesterday(1)];
    const input = thin({
      curriculum: WITH_A_SECOND,
      items,
      catalog: indexCatalog(items),
      states: rungState(runs, WITH_A_SECOND, VOCABULARY_V0, TODAY),
      rows: runs,
      learned: [{ itemId: PIECE.id, status: 'mastered', lastPlayed: daysAgo(2) }],
      lastPlayed: new Map(runs.map((row) => [row.itemId, row.at])),
    });
    expect(rows(buildSession(input).slots, 'song.other')).toEqual([expect.stringMatching(/^repertoire \(exposure\): For variety: /)]);
    holds(input, 'song.other', 'exposure');
    // The family's next piece takes the row: the mastered one, in its own words.
    const paused = buildSession({ ...input, projects: [rowFor('paused', 'song.other')] }).slots;
    expect(rows(paused, PIECE.id)).toEqual([expect.stringMatching(/^repertoire \(exposure\): A piece you know — for variety: /)]);
  });

  // --- (d): a rung's own list — the reviewer's ruling on G1e -------------------------------------------
  //
  // Revised (the reviewer's required change, `responses/questions-ea14b1fe.md` § G1e): a rung assigning a
  // piece is a teaching relationship, and it does not authorize the app to override a later pause. The rule
  // reaches the rung's own ask (`runs`, `done`, `measure`, this lesson's and the next lesson's) and the
  // ladder's rung step: another eligible option of the rung is chosen; with every piece option paused or put
  // away, none is revived, the rung is not taken as met, and the row that serves the rung says so. Old
  // assumption (G1e as first built, item 3): a rung's ask and the rung step left the paused piece on the card.

  /** The file's curriculum at 2.2, which lists two songs: the new slot asks for the first, the repertoire row takes the second from the rung. */
  function atTwoTwo(extra: Partial<BuildInput> = {}): BuildInput {
    const runs = [passedOn21(3), readYesterday(1)];
    return {
      curriculum: CURRICULUM,
      catalog: indexCatalog(MEASURED),
      items: MEASURED,
      states: rungState(runs, CURRICULUM, VOCABULARY_V0, TODAY),
      rows: runs,
      readingRows: runs.filter((row) => row.itemId === READING_ROW.id),
      learned: [],
      lastPlayed: new Map(runs.map((row): [string, string] => [row.itemId, row.at])),
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
      ...extra,
    };
  }

  it('(d) the rung’s ask: the song the learner’s rung asks for, paused or put away, is not offered — its other song is what the lesson asks for', () => {
    const before = buildSession(atTwoTwo()).slots;
    expect(rows(before, 'song.now')).toEqual(['new (asked): This lesson asks for it — not counted yet']);
    for (const state of WITHDRAWN) {
      const card = buildSession(atTwoTwo({ projects: [rowFor(state, 'song.now')] })).slots;
      expect(rows(card, 'song.now'), `${state}: the paused song is still asked for`).toEqual([]);
      expect(rows(card, 'song.now.2'), state).toEqual(['new (asked): This lesson asks for it — not counted yet']);
    }
    // To the rung's ask the paused song is as if the catalogue did not hold it: another option is there.
    holds(atTwoTwo(), 'song.now', 'asked');
  });

  it('(d) the ladder’s rung step: the rung’s other song, mastered and then paused, is not the repertoire row’s *a piece you know — more music from this lesson*', () => {
    // The learner mastered 2.2's second song two days ago on a run no rung counted (constructed: `learned`
    // is handed in beside the runs).
    const input = atTwoTwo({
      learned: [{ itemId: 'song.now.2', status: 'mastered', lastPlayed: daysAgo(2) }],
      lastPlayed: new Map([[READING_ROW.id, daysAgo(1, 9)], [PIECE.id, daysAgo(3)], ['song.now.2', daysAgo(2)]]),
    });
    expect(rows(buildSession(input).slots, 'song.now.2')).toEqual(['repertoire (rung): A piece you know — more music from this lesson']);
    holds(input, 'song.now.2', 'rung');
  });

  /**
   * R, the learner's first rung, asks for an exercise and a song and lists two of each; S, the next lesson,
   * lists a song. Nothing is played yet: the warm-up takes R's first exercise, the new slot R's first song,
   * the repertoire row R's second song and the review R's second exercise.
   */
  const R_AND_S: Curriculum = {
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
              lesson('R', {
                exerciseOptions: ['ex.r1', 'ex.r2'],
                songOptions: ['song.r1', 'song.r2'],
                requirements: [
                  { kind: 'runs', from: 'exercises', count: 1 },
                  { kind: 'runs', from: 'songs', count: 1 },
                ],
              }),
              lesson('S', { exerciseOptions: ['ex.s1'], songOptions: ['song.s1'] }),
            ],
          },
        ],
      },
    ],
  };
  const R_ITEMS: CatalogItem[] = [
    item('ex.r1', { type: 'exercise', ...measured([]) }),
    item('ex.r2', { type: 'exercise', ...measured([]) }),
    item('song.r1', measured([])),
    item('song.r2', measured([])),
    item('ex.s1', { type: 'exercise', ...measured([]) }),
    item('song.s1', measured([])),
  ];
  function onR(curriculum: Curriculum = R_AND_S, extra: Partial<BuildInput> = {}): BuildInput {
    const items = R_ITEMS.filter((one) => curriculum.stages.some((stage) => stage.units.some((unit) => unit.lessons.some((l) => [...l.exerciseOptions, ...l.songOptions].includes(one.id)))));
    return {
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([], curriculum, VOCABULARY_V0, TODAY),
      rows: [],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
      ...extra,
    };
  }
  const HELD = /^This lesson waits on pieces you paused or put away — more from this lesson$/;

  it('(d) every song the rung lists paused or put away: none is revived, the rung is not taken as met, and the new row says the lesson waits, with more from it', () => {
    const before = buildSession(onR()).slots;
    expect(before.map((slot) => `${slot.kind} ${slot.item?.id ?? '-'} ${slot.claim?.kind ?? '-'}`)).toEqual([
      'technique ex.r1 asked',
      'review ex.r2 rung',
      'new song.r1 asked',
      'repertoire song.r2 rung',
    ]);
    const mixed = [rowFor('paused', 'song.r1'), rowFor('retired', 'song.r2')];
    for (const projects of [...WITHDRAWN.map((state) => [rowFor(state, 'song.r1'), rowFor(state, 'song.r2')]), mixed]) {
      const label = projects.map((one) => `${one.itemId} ${one.state}`).join(', ');
      const card = buildSession(onR(R_AND_S, { projects })).slots;
      // No revival: neither song on any row.
      expect([...rows(card, 'song.r1'), ...rows(card, 'song.r2')], `${label}: a paused song is back`).toEqual([]);
      // Not taken as met: nothing of the next lesson is offered.
      expect(card.filter((slot) => slot.claim?.kind === 'asked' && slot.claim.next), `${label}: the rung was taken as met`).toEqual([]);
      expect(rows(card, 'song.s1'), label).toEqual([]);
      // Surfaced honestly, once: the new row is the rung's other material, saying the lesson waits on the learner.
      const held = card.filter((slot) => slot.claim?.kind === 'rung' && slot.claim.held === true);
      expect(held.map((slot) => `${slot.kind} ${slot.item?.id ?? '-'}`), label).toEqual(['new ex.r2']);
      expect(held[0]?.reason, label).toMatch(HELD);
      expect(card.filter((slot) => HELD.test(slot.reason)), `${label}: said more than once`).toHaveLength(1);
    }
    // Brought back (`refreshing`), or any other state, and the card is as it was: the learner's own resume undoes it.
    for (const state of KEPT) {
      expect(buildSession(onR(R_AND_S, { projects: [rowFor(state, 'song.r1'), rowFor(state, 'song.r2')] })).slots, state).toEqual(before);
    }
  });

  it('(d) said once: with a third exercise on the rung, the review’s rung step brings it in its own words, not the waiting line again', () => {
    const THREE: Curriculum = {
      ...R_AND_S,
      stages: [
        {
          ...(R_AND_S.stages[0] as Curriculum['stages'][number]),
          units: [
            {
              id: 'u',
              title: 'U',
              track: 'core',
              lessons: [
                { ...(R_AND_S.stages[0]?.units[0]?.lessons[0] as Lesson), exerciseOptions: ['ex.r1', 'ex.r2', 'ex.r3'] },
                R_AND_S.stages[0]?.units[0]?.lessons[1] as Lesson,
              ],
            },
          ],
        },
      ],
    };
    const items = [...R_ITEMS, item('ex.r3', { type: 'exercise', ...measured([]) })];
    const input = onR(THREE, { items, catalog: indexCatalog(items), projects: [rowFor('paused', 'song.r1'), rowFor('paused', 'song.r2')] });
    const card = buildSession(input).slots;
    expect(card.map((slot) => `${slot.kind} ${slot.item?.id ?? '-'} ${slot.claim?.kind ?? '-'}`)).toEqual(['technique ex.r1 asked', 'review ex.r3 rung', 'new ex.r2 rung']);
    expect(card.filter((slot) => HELD.test(slot.reason)).map((slot) => slot.kind)).toEqual(['new']);
    expect(card.find((slot) => slot.kind === 'review')?.reason).toBe('Nothing due for review — more from this lesson');
  });

  it('(d) a warm-up stuck on the rung, and nothing else of it left for the new slot: the warm-up’s row is the one that says the lesson waits', () => {
    // R asks for one exercise it cannot offer (ex.gone has no file) and for a song; both songs paused. The
    // warm-up falls to the rung's other exercise; the new slot then has nothing of R left to bring.
    const STUCK: Curriculum = {
      ...R_AND_S,
      stages: [
        {
          ...(R_AND_S.stages[0] as Curriculum['stages'][number]),
          units: [
            {
              id: 'u',
              title: 'U',
              track: 'core',
              lessons: [
                lesson('R', {
                  exerciseOptions: ['ex.gone', 'ex.r2'],
                  songOptions: ['song.r1', 'song.r2'],
                  requirements: [
                    { kind: 'runs', from: 'exercises', items: ['ex.gone'], count: 1 },
                    { kind: 'runs', from: 'songs', count: 1 },
                  ],
                }),
                R_AND_S.stages[0]?.units[0]?.lessons[1] as Lesson,
              ],
            },
          ],
        },
      ],
    };
    const items = [...R_ITEMS, item('ex.gone', { type: 'exercise', file: null, ...measured([]) })];
    const input = onR(STUCK, { items, catalog: indexCatalog(items), projects: [rowFor('paused', 'song.r1'), rowFor('paused', 'song.r2')] });
    const card = buildSession(input).slots;
    expect([...rows(card, 'song.r1'), ...rows(card, 'song.r2')]).toEqual([]);
    expect(card.filter((slot) => HELD.test(slot.reason)).map((slot) => `${slot.kind} ${slot.item?.id ?? '-'}`)).toEqual(['technique ex.r2']);
  });

  it('(d) one of the two songs paused: the other is asked for, and nothing says the lesson waits', () => {
    const card = buildSession(onR(R_AND_S, { projects: [rowFor('paused', 'song.r1')] })).slots;
    expect(rows(card, 'song.r1')).toEqual([]);
    expect(rows(card, 'song.r2')).toEqual(['new (asked): This lesson asks for it — not counted yet']);
    expect(words(card)).not.toMatch(/paus|put away|waits on/i);
  });

  it('(d) a rung whose only material is the paused pieces — a `runs` ask and a `done` ask: nothing is revived and the next lesson is not offered in its place', () => {
    const only = (requirements: Lesson['requirements'], songs: string[]): Curriculum => ({
      ...R_AND_S,
      stages: [
        {
          ...(R_AND_S.stages[0] as Curriculum['stages'][number]),
          units: [
            {
              id: 'u',
              title: 'U',
              track: 'core',
              lessons: [lesson('R', { songOptions: songs, ...(requirements ? { requirements } : {}) }), lesson('S', { exerciseOptions: ['ex.s1'], songOptions: ['song.s1'] })],
            },
          ],
        },
      ],
    });
    for (const curriculum of [only([{ kind: 'runs', from: 'songs', count: 1 }], ['song.r1', 'song.r2']), only([{ kind: 'done', item: 'song.r1' }], ['song.r1'])]) {
      const ask = curriculum.stages[0]?.units[0]?.lessons[0]?.requirements?.[0]?.kind ?? '';
      const listed = curriculum.stages[0]?.units[0]?.lessons[0]?.songOptions ?? [];
      expect(buildSession(onR(curriculum)).slots.map((slot) => slot.item?.id), ask).toContain('song.r1');
      const card = buildSession(onR(curriculum, { projects: listed.map((id) => rowFor('paused', id)) })).slots;
      expect(card.map((slot) => slot.item?.id).filter((id) => id !== undefined && listed.includes(id)), `${ask}: revived`).toEqual([]);
      expect(rows(card, 'song.s1'), `${ask}: the next lesson took the rung's place`).toEqual([]);
      expect(rows(card, 'ex.s1'), `${ask}: the next lesson took the rung's place`).toEqual([]);
    }
  });

  it('(d) the next lesson’s ask: while the rung waits for its reads, a paused song of the next lesson is passed over for its other', () => {
    const WAITS: Curriculum = {
      ...R_AND_S,
      stages: [
        {
          ...(R_AND_S.stages[0] as Curriculum['stages'][number]),
          units: [
            {
              id: 'u',
              title: 'U',
              track: 'core',
              lessons: [
                lesson('R', { exerciseOptions: ['ex.r1'], requirements: [{ kind: 'reads', skill: 'sight-reading', standard: 'full', share: 0.9, count: 5 }] }),
                lesson('S', { songOptions: ['song.s1', 'song.r2'] }),
              ],
            },
          ],
        },
      ],
    };
    const next = (projects?: ProjectRow[]): SessionSlot | undefined => buildSession(onR(WAITS, projects ? { projects } : {})).slots.find((slot) => slot.kind === 'new');
    expect(next()).toMatchObject({ item: { id: 'song.s1' }, claim: { kind: 'asked', next: true, waitsForReads: true } });
    for (const state of WITHDRAWN) {
      expect(next([rowFor(state, 'song.s1')]), state).toMatchObject({ item: { id: 'song.r2' }, claim: { kind: 'asked', next: true, waitsForReads: true } });
    }
    holds(onR(WAITS), 'song.s1', 'asked');
  });

  // --- (f): each automatic chooser, on its own learner ----------------------------------------------

  it('the repertoire slot’s demand-based choice: a piece the reads are ready for, paused or put away, is not offered — nor on any other row', () => {
    // One rung, 1.5, which the vocabulary says teaches skips; a read yesterday shows reading by interval.
    const R15: Curriculum = {
      version: 1,
      tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
      stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('1.5', { songOptions: ['song.rung'] })] }] }],
    };
    const read: SessionRow = {
      itemId: 'drill.reader',
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      at: daysAgo(1, 9),
      evidenceDefinitions: EVIDENCE_DEFINITIONS,
      evidence: [
        {
          kind: 'measured',
          skill: 'interval-reading',
          standard: 'practice',
          n: 8,
          right: 8,
          at: daysAgo(1, 9),
          observationId: 1,
          context: { itemId: 'drill.reader', firstContact: true, met: [], unattributed: 0, estimated: false },
          byDemand: [],
        } as unknown as MeasuredEvidence,
      ],
    };
    const items = [item('song.rung', measured(['interval.step'])), item('song.skips', measured(['interval.step', 'interval.skip']))];
    const input: BuildInput = {
      curriculum: R15,
      catalog: indexCatalog(items),
      items,
      states: rungState([], R15, VOCABULARY_V0, TODAY),
      rows: [read],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
    };
    expect(buildSession(input).slots.find((slot) => slot.kind === 'repertoire')?.claim).toMatchObject({ kind: 'ready', demand: 'interval.skip' });
    holds(input, 'song.skips', 'ready');
  });

  /**
   * The fallback ladder's automatic steps, on `fallbackOrder.test.ts`'s construction with songs: R asks for
   * subdivision and its one exercise for it cannot be played, so the new slot walks the ladder with the
   * skill (a song of an earlier lesson declaring it, then one carrying eighths), and the review, with
   * nothing due, reaches the song of the rung R builds on.
   */
  const EIGHTHS_AT_E: Vocabulary = {
    ...VOCABULARY_V0,
    demands: VOCABULARY_V0.demands.map((demand) => (demand.id === 'rhythm.eighths' ? { ...demand, taughtAt: ['E'] } : demand)),
  };
  const LADDER: Curriculum = {
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
              lesson('E', { songOptions: ['song.skill', 'song.demand'] }),
              lesson('P', { songOptions: ['song.pre'] }),
              lesson('R', {
                exerciseOptions: ['ex.r1'],
                requirements: [{ kind: 'skill', skill: 'subdivision', state: 'familiar' }],
                prerequisites: ['P'],
              }),
            ],
          },
        ],
      },
    ],
  };
  function ladder(gone: readonly string[] = []): BuildInput {
    const items = [
      item('ex.r1', { type: 'exercise', targetSkills: ['subdivision'], file: null, ...measured(['rhythm.eighths']) }),
      item('song.skill', { targetSkills: ['subdivision'], ...measured(['rhythm.eighths']) }),
      item('song.demand', measured(['rhythm.eighths'])),
      item('song.pre', measured([])),
    ].filter((one) => !gone.includes(one.id));
    return {
      curriculum: LADDER,
      catalog: indexCatalog(items),
      items,
      // E and P behind the placement: reached, not met — what a learner placed at R has.
      states: rungState([], LADDER, VOCABULARY_V0, TODAY),
      rows: [],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 15,
      startAt: 'R',
      today: TODAY,
      skillActivation: EVERY_DECLARED_SKILL,
      vocabulary: EIGHTHS_AT_E,
    };
  }

  it('the fallback ladder’s skill step: a song declaring the skill the rung asks for, paused or put away, is passed over for the next step', () => {
    expect(rows(buildSession(ladder()).slots, 'song.skill')).toEqual([expect.stringMatching(/^new \(skill\): /)]);
    holds(ladder(), 'song.skill', 'skill');
    // The next step takes the row, as it would with the song gone.
    expect(buildSession({ ...ladder(), projects: [rowFor('paused', 'song.skill')] }).slots.find((slot) => slot.kind === 'new')?.claim?.kind).toBe('demand');
  });

  it('the fallback ladder’s demand step: a song carrying the demand, paused or put away, is passed over', () => {
    expect(rows(buildSession(ladder(['song.skill'])).slots, 'song.demand')).toEqual([expect.stringMatching(/^new \(demand\): /)]);
    holds(ladder(['song.skill']), 'song.demand', 'demand');
  });

  it('the fallback ladder’s prerequisite step: the song of the rung this one builds on, paused or put away, is passed over', () => {
    expect(rows(buildSession(ladder()).slots, 'song.pre')).toEqual([expect.stringMatching(/^review \(prerequisite\): /)]);
    holds(ladder(), 'song.pre', 'prerequisite');
  });

  it('the jam slot: a song of a reached jam rung, paused or put away, is not offered', () => {
    // The core path at 2.2 and the blues track beside it: B1 met on a run of its song, B2 the strand's rung.
    const JAMMING: Curriculum = {
      ...THIN,
      tracks: [...THIN.tracks, { id: 'blues-boogie', title: 'Blues', description: '', startsAtStage: 0 }],
      stages: [
        {
          ...(THIN.stages[0] as Curriculum['stages'][number]),
          units: [
            ...(THIN.stages[0] as Curriculum['stages'][number]).units,
            {
              id: 'b',
              title: 'B',
              track: 'blues-boogie',
              lessons: [
                lesson('B1', { songOptions: ['song.jam'] }),
                lesson('B2', { exerciseOptions: ['ex.b2'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              ],
            },
          ],
        },
      ],
    };
    const items = [...THIN_ITEMS, item('song.jam', { tracks: ['blues-boogie'], ...measured([]) }), item('ex.b2', { type: 'exercise', tracks: ['blues-boogie'], ...measured([]) })];
    const runs = [passedOn21(DUE), readYesterday(1), { ...passedOn21(5), id: 102, itemId: 'song.jam', lessonId: 'B1' }];
    const input = thin({
      curriculum: JAMMING,
      items,
      catalog: indexCatalog(items),
      states: rungState(runs, JAMMING, VOCABULARY_V0, TODAY),
      rows: runs,
      learned: [],
      lastPlayed: new Map(runs.map((row) => [row.itemId, row.at])),
      activeTracks: ['core', 'blues-boogie'],
      minutes: 60,
    });
    expect(rows(buildSession(input).slots, 'song.jam')).toEqual(['jam (jam): From Lesson B1']);
    holds(input, 'song.jam', 'jam');
  });
});
