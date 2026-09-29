/**
 * Contact novelty, from identities, conservatively (D4 item 3 and the adversaries of item 7 that
 * belong to it; the reviewer's answer, `responses/612288e.md`: `met-by-id` is never `unmet`, and the
 * lookup crosses item ids).
 *
 * `contactIn(rows, itemId, material)` returns facts, never a verdict for the store:
 *
 * - `met` where any stored row, under any item id, carries the same material (a file's sha256; a
 *   generator's family, version, seed, recipe and tempo) — a renamed or duplicate id included;
 * - `met-by-id` where no row carries the material and a row that knows none (a legacy row from
 *   before D4, or one whose item had no identity) shares the item id: prior contact proven, the
 *   material unknown — never read as `unmet`;
 * - `unmet` only where no row of either kind exists; `metById: true` beside it where the id was met
 *   under other known material (a new seed, a new generator version).
 *
 * And `contact(itemId, material)` reads the store itself, every stored row, not one item's index.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contact, contactIn, recordRun, resetProgressForTest, type RunResult } from '../../src/data/progressStore';
import type { SessionRow } from '../../src/data/db';
import type { Identity } from '../../src/review/record';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const row = (itemId: string, material?: Identity): SessionRow => ({
  itemId,
  mode: 'tempo',
  tempoPct: 100,
  accuracy: 1,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 1000,
  at: '2026-10-01T12:00:00.000Z',
  ...(material === undefined ? {} : { material }),
});
const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });
const study = (version: number, seed: number | null): Identity => ({
  kind: 'generator',
  family: 'study',
  version,
  seed,
  recipe: { target: 'position-shift', key: 'B-', texture: 'broken', hands: 'both' },
  tempoBpm: 84,
});
const phrase = (version: number, seed: number, hands = 'R'): Identity => ({
  kind: 'generator',
  family: 'sight-reading',
  version,
  seed,
  recipe: { level: 2, bars: 4, hands, fifths: 0, eighths: true, skips: true },
  tempoBpm: 72,
});

describe('contactIn: the facts, by material across every item id, and by id for rows that know none', () => {
  it('met: a row carries the same material under the same id', () => {
    expect(contactIn([row('song.a', file('a'))], 'song.a', file('a'))).toEqual({ contact: 'met', metById: true, metAs: ['song.a'], how: ['played'] });
  });

  it('met through the material index: the same identity under a renamed id (adversaries 3 and 10)', () => {
    expect(contactIn([row('song.old-name', file('a'))], 'song.new-name', file('a'))).toEqual({ contact: 'met', metById: false, metAs: ['song.old-name'], how: ['played'] });
    // A duplicate edition with the same bytes under a third id: met, both ids named.
    expect(contactIn([row('song.old-name', file('a')), row('song.copy', file('a'))], 'song.new-name', file('a')).metAs).toEqual(['song.old-name', 'song.copy']);
  });

  it('met-by-id: only a legacy row shares the id — prior contact proven, the material unknown, never unmet (adversary 8)', () => {
    expect(contactIn([row('song.a')], 'song.a', file('a'))).toEqual({ contact: 'met-by-id', metById: true });
  });

  it('met-by-id: a row whose item had no identity (none) shares the id', () => {
    expect(contactIn([row('drill.x', { kind: 'none', why: 'made when it opens: no file the build keys' })], 'drill.x', file('a')).contact).toBe('met-by-id');
  });

  it('met-by-id wins over a known other material under the same id: the legacy row may have been this one', () => {
    expect(contactIn([row('exercise.s', study(1, 1)), row('exercise.s')], 'exercise.s', study(2, 1)).contact).toBe('met-by-id');
  });

  it('unmet with metById: a regenerated item under a new version, or a new seed, is new material (adversary 4)', () => {
    expect(contactIn([row('exercise.s', study(1, 1))], 'exercise.s', study(2, 1))).toEqual({ contact: 'unmet', metById: true });
    expect(contactIn([row('exercise.s', study(1, 1))], 'exercise.s', study(1, 2))).toEqual({ contact: 'unmet', metById: true });
  });

  it('unmet only where no row of either kind exists', () => {
    expect(contactIn([], 'song.a', file('a'))).toEqual({ contact: 'unmet', metById: false });
    expect(contactIn([row('song.b', file('b')), row('song.c')], 'song.a', file('a'))).toEqual({ contact: 'unmet', metById: false });
  });

  it('a runtime phrase: the same version, seed and recipe is met; a new version of the same seed is not (adversary 11)', () => {
    const rows = [row('drill.reading.sight-reading-2-right', phrase(2, 7))];
    expect(contactIn(rows, 'drill.reading.sight-reading-2-right', phrase(2, 7)).contact).toBe('met');
    expect(contactIn(rows, 'drill.reading.sight-reading-2-right', phrase(1, 7))).toEqual({ contact: 'unmet', metById: true });
    expect(contactIn(rows, 'drill.reading.sight-reading-2-right', phrase(2, 7, 'L')).contact, 'the same seed, the recipe moved').toBe('unmet');
  });

  it('an excerpt of a piece played whole: unmet as material — the whole is other bytes; met only where the cut itself was played (adversary 6)', () => {
    const whole = row('song.minuet', file('p'));
    expect(contactIn([whole], 'excerpt.minuet.b25-32', file('c'))).toEqual({ contact: 'unmet', metById: false });
    expect(contactIn([whole, row('excerpt.minuet.b25-32', file('c'))], 'excerpt.minuet.b25-32', file('c')).contact).toBe('met');
  });

  it('no material to compare (a placeholder, a drill made when it opens): by id alone, and said so; none never meets none', () => {
    const none: Identity = { kind: 'none', why: 'no notation is bundled' };
    expect(contactIn([row('song.other', none)], 'song.placeholder', none)).toEqual({ contact: 'unmet', metById: false, materialUnknown: true });
    expect(contactIn([row('song.placeholder', none)], 'song.placeholder', none)).toEqual({ contact: 'met-by-id', metById: true, materialUnknown: true });
    expect(contactIn([row('song.placeholder')], 'song.placeholder', undefined).contact).toBe('met-by-id');
  });
});

describe('contact: the store’s every row, not one item’s index', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  const run = (itemId: string, material?: Identity): RunResult => ({
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1000,
    passed: true,
    masterEligible: false,
    ...(material === undefined ? {} : { material }),
  });

  it('finds the material under a renamed id, and the legacy row by its id', async () => {
    await recordRun(run('song.old-name', file('a')), new Date(2026, 9, 1, 12));
    await recordRun(run('song.legacy'), new Date(2026, 9, 2, 12));
    expect(await contact('song.new-name', file('a'))).toEqual({ contact: 'met', metById: false, metAs: ['song.old-name'], how: ['played'] });
    expect(await contact('song.legacy', file('z'))).toEqual({ contact: 'met-by-id', metById: true });
    expect(await contact('song.never', file('y'))).toEqual({ contact: 'unmet', metById: false });
  });
});
