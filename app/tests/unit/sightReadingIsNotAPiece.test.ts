/**
 * A generated sight-reading phrase carries no piece semantics (C5, S8).
 *
 * A reading row was recorded like a piece: a first reading at the pass
 * standard marked the row *passed*, a second on another day *mastered*, the
 * review calendar brought it back one, three, seven and twenty-one days later,
 * and Today's repertoire slot offered it as "a piece you know" — for a row whose
 * every open writes a phrase never seen before. Its runs are observations with
 * evidence, read by the reader and by `rungState`; the row keeps its practice
 * (attempts, minutes, when), and the daily read's done-day stays, because that
 * is a habit and not a mastery.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  dailyReadDays,
  dayKey,
  getProgress,
  normaliseGeneratedRows,
  recordRun,
  resetProgressForTest,
  learnedPieces,
  type RunResult,
} from '../../src/data/progressStore';
import { dailySeed } from '../../src/engine/sightReading';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { ProgressRow } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const PHRASE: RunResult = {
  itemId: 'drill.reading.sight-reading-2-right',
  mode: 'tempo',
  tempoPct: 100,
  tempoMeasured: true,
  accuracy: 1,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: true,
  unseen: true,
  recipe: { row: 'drill.reading.sight-reading-2-right' },
};

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
});
afterEach(() => clearFakeIndexedDb());

const isGenerated = (id: string): boolean => id.startsWith('drill.reading.sight-reading');

describe('a reading row is not passed, mastered or put on the calendar', () => {
  it('two first readings at the master standard on two days leave the row practised, not mastered', async () => {
    await recordRun({ ...PHRASE, seed: 11 }, new Date('2026-10-01T10:00:00'));
    const row = await recordRun({ ...PHRASE, seed: 12 }, new Date('2026-10-02T10:00:00'));
    expect(row.status).toBe('started');
    expect(row.passedOn).toEqual([]);
    expect(row.masteredOn ?? []).toEqual([]);
    expect(row.attempts).toBe(2);
    expect(row.minutes).toBeGreaterThan(1);
  });

  it('the daily read still ticks the day: a habit, not a mastery', async () => {
    const now = new Date('2026-10-03T09:00:00');
    await recordRun({ ...PHRASE, seed: dailySeed(dayKey(now)) }, now);
    expect(await dailyReadDays()).toContain(dayKey(now));
  });

  // Revised (C6): the review calendar is retired; what it read is now the pieces learned, and a
  // generated row is still never one, so repertoire retention can never bring a phrase back.
  it('a reading row is never a learned piece, even one an old build marked passed', () => {
    const old: ProgressRow = {
      itemId: 'drill.reading.sight-reading-2-right',
      status: 'passed',
      bestAccuracy: 1,
      bestTempoPct: 100,
      attempts: 1,
      lastPracticedAt: '2026-09-01T10:00:00.000Z',
      minutes: 1,
      passedOn: ['2026-09-01'],
    };
    const piece: ProgressRow = { ...old, itemId: 'song.folk.hot-cross-buns' };
    const learned = learnedPieces([old, piece], isGenerated).map((entry) => entry.itemId);
    expect(learned).toEqual(['song.folk.hot-cross-buns']);
  });

  // Revised (C6): `repertoireOf` listed the mastered pieces for the repertoire slot every session
  // (L17); the pieces learned — passed or mastered — are what repertoire retention reads now. The
  // reading row an old build marked mastered is still not one.
  it('the pieces learned are pieces: a reading row an old build marked mastered is not one', () => {
    const rows = [
      { itemId: 'drill.reading.sight-reading-1', status: 'mastered', lastPracticedAt: '' },
      { itemId: 'song.folk.lightly-row', status: 'mastered', lastPracticedAt: '' },
      { itemId: 'song.folk.old-macdonald', status: 'passed', lastPracticedAt: '' },
    ] as unknown as ProgressRow[];
    expect(learnedPieces(rows, isGenerated).map((entry) => entry.itemId)).toEqual(['song.folk.lightly-row', 'song.folk.old-macdonald']);
  });

  it('a row an old build passed or mastered is put back to practised, once, keeping its practice', async () => {
    const before = await recordRun({ ...PHRASE, seed: 21, unseen: undefined, recipe: undefined }, new Date('2026-10-01T10:00:00'));
    expect(before.status, 'the fixture needs a row the old rule marked').toBe('passed');
    const changed = await normaliseGeneratedRows(isGenerated);
    expect(changed).toEqual(['drill.reading.sight-reading-2-right']);
    const after = await getProgress('drill.reading.sight-reading-2-right');
    expect(after).toMatchObject({ status: 'started', passedOn: [], attempts: 1 });
    expect(after.masteredOn).toBeUndefined();
    expect(await normaliseGeneratedRows(isGenerated)).toEqual([]);
  });
});

describe('“A piece you know” is said only of a piece the learner knows (L18, with S8)', () => {
  const song = (id: string): CatalogItem =>
    ({ id, type: 'song', title: id, level: 1, tracks: ['core'], concepts: [], tags: [], file: `${id}.mxl` }) as unknown as CatalogItem;
  const items = [song('song.a'), song('song.b')];
  // Revised (C6): the songs sit on a rung, because nothing is offered from no rung any more (the
  // level windows are gone); the line is the rung's, and never "a piece you know".
  const curriculum = {
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
              {
                id: '1.1',
                title: 'One',
                concepts: [],
                textFile: 'lessons/1.1.md',
                exerciseOptions: [],
                songOptions: ['song.a', 'song.b'],
                mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
                requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
              },
            ],
          },
        ],
      },
    ],
  } as unknown as Curriculum;
  it('a mastered id that cannot be offered leaves the slot saying what it is, not that you know it', () => {
    const built = buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: { byRung: new Map() },
      // A reading row an old build called mastered: not playable as a piece here.
      learned: [{ itemId: 'drill.reading.sight-reading-1', status: 'mastered', lastPlayed: '2026-09-01T10:00:00.000Z' }],
      activeTracks: [],
      minutes: 30,
    });
    const repertoire = built.slots.find((slot) => slot.kind === 'repertoire');
    expect(repertoire?.item?.id).toMatch(/^song\./);
    expect(repertoire?.reason, 'a song never played was offered as a piece you know').not.toMatch(/^A piece you know/);
  });

  // Added (C6): the other half of L18 — a piece the learner did master is still said to be known.
  it('a mastered piece the repertoire slot offers is "a piece you know"', () => {
    const built = buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: { byRung: new Map() },
      learned: ['song.a', 'song.b'].map((itemId) => ({ itemId, status: 'mastered' as const, lastPlayed: '2026-09-01T10:00:00.000Z' })),
      activeTracks: [],
      minutes: 30,
      today: new Date('2026-09-05T10:00:00'),
    });
    const repertoire = built.slots.find((slot) => slot.kind === 'repertoire');
    expect(repertoire?.item?.id).toMatch(/^song\./);
    expect(repertoire?.reason).toMatch(/^A piece you know — /);
  });
});
