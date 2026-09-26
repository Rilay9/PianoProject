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
 */
import { describe, expect, it } from 'vitest';
import {
  buildSession,
  REPERTOIRE_WINDOW_DAYS,
  type BuildInput,
  type SessionSlot,
} from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import * as progressStore from '../../src/data/progressStore';
import { learnedPieces, type LearnedPiece } from '../../src/data/progressStore';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { RETENTION_DAYS } from '../../src/evidence/ladder';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

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
