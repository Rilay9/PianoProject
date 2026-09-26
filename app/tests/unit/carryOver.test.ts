/**
 * The learner's history from before C5, carried over once (C5; the owner's
 * real history is the case).
 *
 * Before C5 a rung was done when enough of its items were marked passed, and
 * the session rows named no rung (before 2026-09-22) or the first rung listing
 * the item (until C1), so those rungs cannot be re-derived from evidence. The
 * carry-over keeps the rungs the old rule had done before the rung it was
 * recommending, on a database made before C5 only, once; it never carries a
 * rung the old rule credited only because a pass there counted for every rung
 * listing the item (L8), and a carried rung is set aside, never met.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { carriedOver } from '../../src/data/carryOver';
import { carryOverOnce, getPlan, resetPlanForTest } from '../../src/data/planStore';
import { forgetCachedProgress, recordRun, resetProgressForTest } from '../../src/data/progressStore';
import { DB_NAME, resetDatabaseForTest } from '../../src/data/db';
import { nextRecommended } from '../../src/curriculum/session';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { Curriculum, Lesson } from '../../src/curriculum/types';
import type { ProgressRow } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l] as const));
const lesson = (id: string): Lesson => byId.get(id) as Lesson;

/**
 * The owner's shape of history: an exercise and a song passed on every core rung
 * from 0.1 to 2.1 (two exercises where the rung asked for two), and the Petzold
 * passed as 3.4's song — which the old rule also credited to 4.4, 4.6 and 4.7.
 * Nothing yet on 2.2.
 */
function ownersHistory(): ProgressRow[] {
  const passed = new Set<string>();
  for (const id of ['0.1', '0.2', '0.3', '0.4', '1.1', '1.2', '1.3', '1.4', '1.5', '2.1']) {
    const rung = lesson(id);
    for (const item of rung.exerciseOptions.slice(0, 2)) passed.add(item);
    for (const item of rung.songOptions.slice(0, 1)) passed.add(item);
  }
  passed.add('song.classical.petzold-minuet-g-bwv-anh114');
  return [...passed].map((itemId) => ({
    itemId,
    status: 'passed',
    bestAccuracy: 1,
    bestTempoPct: 100,
    attempts: 1,
    lastPracticedAt: '2026-09-10T10:00:00.000Z',
    minutes: 1,
    passedOn: ['2026-09-10'],
  }));
}

describe('what the old rule had done, before the rung it recommended', () => {
  it('carries the rungs walked past on the core path, and stops at the rung the old rule was recommending', () => {
    const carried = carriedOver(curriculum, ownersHistory(), ['core']);
    expect(carried).toEqual(['0.1', '0.2', '0.3', '0.4', '1.1', '1.2', '1.3', '1.4', '1.5', '2.1']);
  });

  it('never carries a rung the old rule credited only because a pass there counted for every rung listing the item (L8)', () => {
    const carried = carriedOver(curriculum, ownersHistory(), ['core']);
    for (const id of ['3.4', '4.4', '4.6', '4.7']) expect(carried, id).not.toContain(id);
  });

  it('carries nothing for a learner with no passes', () => {
    expect(carriedOver(curriculum, [], ['core'])).toEqual([]);
  });

  it('a carried rung is set aside, never met: Next up is the first rung the evidence has not met after them', () => {
    const carried = carriedOver(curriculum, ownersHistory(), ['core']);
    const states = rungState([], curriculum, VOCABULARY_V0, new Date('2026-10-01T10:00:00Z'), { carried });
    expect(states.byRung.get('1.1')?.status).not.toBe('met');
    expect(states.byRung.get('1.1')?.carried).toBe(true);
    expect(nextRecommended(curriculum, states, ['core'])?.lesson.id).toBe('2.2');
  });
});

describe('once, and only on a database made before C5', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetPlanForTest();
  });
  afterEach(() => clearFakeIndexedDb());

  /** A database as version 6 left it, with the owner's passes in it. */
  async function oldDatabase(rows: ProgressRow[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 6);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('settings');
        db.createObjectStore('progress', { keyPath: 'itemId' });
        const sessions = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessions.createIndex('byItem', 'itemId');
        sessions.createIndex('byDate', 'at');
        db.createObjectStore('plan', { keyPath: 'id' });
        const tx = request.transaction as IDBTransaction;
        for (const row of rows) tx.objectStore('progress').put(row);
        // Tracks he chose: the core path and classical (nothing from Stage 2 but core).
        tx.objectStore('plan').put({ id: 'current', stage: 0, unitId: '', trackOrder: ['core', 'classical'] });
      };
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(new Error(String(request.error)));
    });
    resetDatabaseForTest();
    forgetCachedProgress();
  }

  it('carries the owner’s history the first time, stores it, and never again', async () => {
    await oldDatabase(ownersHistory());
    const carried = await carryOverOnce(curriculum, new Date('2026-10-01T10:00:00Z'));
    expect(carried).toBe(10);
    expect((await getPlan()).carriedOver?.rungs).toContain('2.1');
    expect(await carryOverOnce(curriculum)).toBe(0);
  });

  it('carries nothing on a database C5 made, whatever is passed in it afterwards', async () => {
    await recordRun(
      {
        itemId: lesson('1.1').songOptions[0] as string,
        mode: 'tempo',
        tempoPct: 100,
        tempoMeasured: true,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 1000,
        passed: true,
        masterEligible: false,
      },
      new Date('2026-10-01T10:00:00Z'),
    );
    expect(await carryOverOnce(curriculum)).toBe(0);
    expect((await getPlan()).carriedOver).toBeUndefined();
  });
});
