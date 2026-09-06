/**
 * Export and restore (docs/04 §6).
 *
 * The app keeps a year of practice history on one phone with no server copy,
 * so this file is the whole backup story. The tests that matter are the ones
 * about *not losing things*: a PDF's bytes surviving base64, a merge not
 * overwriting progress made since the export, and a newer file refusing to
 * load rather than being half-read.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  bytesToBase64,
  exportAll,
  importAll,
  isBackupFile,
  type BackupFile,
} from '../../src/data/backup';
import { STORE_NAMES, openDatabase, type ProgressRow } from '../../src/data/db';
import { useFakeIndexedDb } from './helpers/idb';

beforeEach(() => {
  useFakeIndexedDb();
});

function progress(itemId: string, patch: Partial<ProgressRow> = {}): ProgressRow {
  return {
    itemId,
    status: 'started',
    bestAccuracy: 0.5,
    bestTempoPct: 70,
    attempts: 1,
    lastPracticedAt: '2026-09-01T10:00:00.000Z',
    minutes: 4,
    passedOn: [],
    ...patch,
  };
}

describe('base64', () => {
  it('round-trips bytes, including a length past the chunk size', () => {
    const bytes = new Uint8Array(20_000);
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = i % 256;
    const back = new Uint8Array(base64ToBytes(bytesToBase64(bytes.buffer)));
    expect(back).toEqual(bytes);
  });
});

describe('exportAll', () => {
  it('writes every store, with the keys of the out-of-line ones', async () => {
    const db = await openDatabase();
    await db?.put('settings', '{"zoom":1.5}', 'pianopath.settings');
    await db?.put('progress', progress('song.a'));

    const file = await exportAll(new Date('2026-09-05T12:00:00Z'));
    expect(file.app).toBe('pianopath');
    expect(file.exportedAt).toBe('2026-09-05T12:00:00.000Z');
    expect(file.stores.progress).toHaveLength(1);
    expect(file.keys.settings).toEqual(['pianopath.settings']);
  });

  it('base64s a PDF import so the JSON stays valid', async () => {
    const db = await openDatabase();
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0xff, 0x00]);
    await db?.put('imports', {
      id: 'import.x',
      kind: 'pdf',
      title: 'X',
      data: bytes.buffer,
      tags: [],
      addedAt: '2026-09-01T00:00:00.000Z',
    });

    const file = await exportAll();
    const row = (file.stores.imports as { data: string; encoding?: string }[])[0];
    expect(row?.encoding).toBe('base64');
    expect(typeof row?.data).toBe('string');
    // The whole point: it survives JSON.
    expect(() => JSON.parse(JSON.stringify(file)) as unknown).not.toThrow();
  });
});

describe('importAll', () => {
  it('restores a full round-trip, PDF bytes included', async () => {
    const db = await openDatabase();
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0xde, 0xad]);
    await db?.put('imports', {
      id: 'import.x',
      kind: 'pdf',
      title: 'X',
      data: bytes.buffer,
      tags: ['a'],
      addedAt: '2026-09-01T00:00:00.000Z',
    });
    await db?.put('progress', progress('song.a', { status: 'passed', attempts: 3 }));
    await db?.put('settings', '{"zoom":1.5}', 'pianopath.settings');
    const file = JSON.parse(JSON.stringify(await exportAll())) as unknown;

    // A fresh device.
    useFakeIndexedDb();
    const report = await importAll(file);
    expect(report.written.progress).toBe(1);

    const fresh = await openDatabase();
    const restoredImport = await fresh?.get('imports', 'import.x');
    expect(new Uint8Array(restoredImport?.data as ArrayBuffer)).toEqual(bytes);
    expect((await fresh?.get('progress', 'song.a'))?.status).toBe('passed');
    expect(await fresh?.get('settings', 'pianopath.settings')).toBe('{"zoom":1.5}');
  });

  it('carries the rungs an import was assigned to (replan §4.3)', async () => {
    // The assignment is the only thing that makes an imported piece an option
    // of a rung. A backup that dropped it would restore the file and quietly
    // lose which lesson it belonged to, which is the whole feature.
    const db = await openDatabase();
    await db?.put('imports', {
      id: 'import.assigned',
      kind: 'musicxml',
      title: 'Assigned',
      data: '<score-partwise/>',
      tags: ['Beethoven'],
      addedAt: '2026-09-06T00:00:00.000Z',
      level: 2.5,
      levelSource: 'judged',
      lessonIds: ['2.1', '3.4'],
      concepts: ['hands-together', 'held-LH'],
      origin: { folder: 'pianopath-library', file: 'ab/Qm123.mxl' },
    });
    const file = JSON.parse(JSON.stringify(await exportAll())) as unknown;

    useFakeIndexedDb();
    await importAll(file);

    const fresh = await openDatabase();
    const restored = await fresh?.get('imports', 'import.assigned');
    expect(restored?.lessonIds).toEqual(['2.1', '3.4']);
    expect(restored?.concepts).toEqual(['hands-together', 'held-LH']);
    expect(restored?.levelSource).toBe('judged');
    expect(restored?.level).toBe(2.5);
    // Without the origin the folder screen would offer the same file again on
    // a restored phone, and greying out its namesakes instead (review C4).
    expect(restored?.origin).toEqual({ folder: 'pianopath-library', file: 'ab/Qm123.mxl' });
  });

  it('merges rather than overwriting practice done since the export', async () => {
    const db = await openDatabase();
    await db?.put('progress', progress('song.a', { status: 'mastered', attempts: 9 }));
    await db?.put('progress', progress('song.b', { status: 'new', attempts: 0 }));

    const report = await importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: '2026-08-01T00:00:00.000Z',
      keys: {},
      stores: {
        progress: [
          progress('song.a', { status: 'started', attempts: 1 }),
          progress('song.b', { status: 'passed', attempts: 4 }),
          progress('song.c'),
        ],
      },
    });

    expect((await db?.get('progress', 'song.a'))?.status).toBe('mastered');
    expect((await db?.get('progress', 'song.b'))?.status).toBe('passed');
    expect((await db?.get('progress', 'song.c'))?.itemId).toBe('song.c');
    expect(report.keptLocal).toBe(1);
  });

  it('replace mode wipes first, for moving to a new phone', async () => {
    const db = await openDatabase();
    await db?.put('progress', progress('song.old', { status: 'mastered' }));
    await importAll(
      {
        app: 'pianopath',
        version: 1,
        exportedAt: '',
        keys: {},
        stores: { progress: [progress('song.new')] },
      },
      { replace: true },
    );
    expect(await db?.get('progress', 'song.old')).toBeUndefined();
    expect(await db?.get('progress', 'song.new')).toBeDefined();
  });

  it('gives every merged session a fresh key so no run is overwritten', async () => {
    const db = await openDatabase();
    await db?.add('sessions', {
      itemId: 'song.a',
      mode: 'wait',
      tempoPct: 100,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      at: '2026-09-04T00:00:00.000Z',
    });
    await importAll({
      app: 'pianopath',
      version: 1,
      exportedAt: '',
      keys: {},
      stores: {
        sessions: [
          {
            id: 1,
            itemId: 'song.z',
            mode: 'tempo',
            tempoPct: 80,
            accuracy: 0.8,
            accuracyEstimated: true,
            wrongNotes: 2,
            missed: 1,
            durationMs: 30_000,
            at: '2026-08-01T00:00:00.000Z',
          },
        ],
      },
    });
    const all = await db?.getAll('sessions');
    expect(all).toHaveLength(2);
    expect(all?.map((s) => s.itemId).sort()).toEqual(['song.a', 'song.z']);
  });

  it('refuses a file from a newer version rather than half-reading it', async () => {
    await expect(
      importAll({ app: 'pianopath', version: 99, exportedAt: '', keys: {}, stores: {} }),
    ).rejects.toThrow(/newer version/);
  });

  it('refuses anything that is not a backup', async () => {
    expect(isBackupFile({ app: 'other' })).toBe(false);
    await expect(importAll({ hello: 'world' })).rejects.toThrow(/not a PianoPath backup/);
  });
});

describe('a backup of a phone that has been used (P19 §C3)', () => {
  /** One row in every store the backup covers, plus the one it does not. */
  async function fillEveryStore(): Promise<void> {
    const db = await openDatabase();
    await db?.put('settings', '{"zoom":1.5,"folderHandles":true}', 'pianopath.settings');
    await db?.put('progress', progress('song.a', { status: 'mastered', attempts: 9 }));
    await db?.add('sessions', {
      itemId: 'song.a',
      at: '2026-09-01T00:00:00.000Z',
      accuracy: 0.94,
      mode: 'wait',
    } as never);
    await db?.put('imports', {
      id: 'import.everything',
      kind: 'musicxml',
      title: 'Everything',
      data: '<score-partwise/>',
      tags: ['Someone'],
      addedAt: '2026-09-01T00:00:00.000Z',
      level: 4.5,
      levelSource: 'judged',
      lessonIds: ['2.1'],
      concepts: ['legato'],
      origin: { folder: 'Mine', file: 'a/one.mxl' },
    });
    await db?.put('plan', { id: 'current', stage: 3, unitId: '3.1', trackOrder: ['core', 'jazz'] });
    await db?.put('streak', {
      id: 'streak',
      minutesByDay: { '2026-09-01': 45 },
      weeklyGoalMinutes: 150,
    });
    await db?.put('micCalibration', { latencyMs: 42, noiseFloor: 0.01 } as never, 'device-1');
    await db?.put('skills', { conceptId: 'scale', state: 'known' } as never);
    await db?.put('levelOverrides', { itemId: 'song.a', level: 6.1 } as never);
    await db?.put('books', {
      id: 'book.mine',
      title: 'My book',
      pieces: [{ id: 'p1', title: 'Study', page: 14, lessonIds: ['4.4'] }],
    } as never);
    // The one store the backup leaves out on purpose: 6 MB of listing that is
    // rebuilt by picking the folder again.
    await db?.put('folderLibraries', {
      id: 'Mine',
      addedAt: '2026-09-01',
      source: 'PDMX',
      scores: [],
    } as never);
  }

  it('round-trips every store it covers, and leaves out the one it does not', async () => {
    await fillEveryStore();
    const file = JSON.parse(JSON.stringify(await exportAll())) as BackupFile;

    // Every store in STORE_NAMES is present in the file and has the row.
    for (const store of STORE_NAMES) {
      expect(file.stores[store], `${store} is missing from the backup`).toBeDefined();
      expect((file.stores[store] as unknown[]).length, `${store} is empty`).toBeGreaterThan(0);
    }
    expect(Object.keys(file.stores)).not.toContain('folderLibraries');

    useFakeIndexedDb();
    const report = await importAll(file);
    expect(Object.keys(report.written).sort()).toEqual([...STORE_NAMES].sort());

    const fresh = await openDatabase();
    expect((await fresh?.get('progress', 'song.a'))?.attempts).toBe(9);
    expect((await fresh?.get('imports', 'import.everything'))?.origin).toEqual({
      folder: 'Mine',
      file: 'a/one.mxl',
    });
    expect((await fresh?.get('plan', 'current'))?.trackOrder).toEqual(['core', 'jazz']);
    expect((await fresh?.get('books', 'book.mine'))?.pieces[0]?.page).toBe(14);
    expect(await fresh?.get('settings', 'pianopath.settings')).toContain('folderHandles');
    expect((await fresh?.getAll('sessions'))?.length).toBe(1);
    expect((await fresh?.get('skills', 'scale'))?.state).toBe('known');
    expect((await fresh?.get('levelOverrides', 'song.a'))?.level).toBe(6.1);
    expect((await fresh?.get('micCalibration', 'device-1')) as { latencyMs: number } | undefined).toEqual({
      latencyMs: 42,
      noiseFloor: 0.01,
    });

    // And the folder listing did not come back, which is the design.
    expect(await fresh?.get('folderLibraries', 'Mine')).toBeUndefined();
  });
});
