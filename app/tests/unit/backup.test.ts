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
import { base64ToBytes, bytesToBase64, exportAll, importAll, isBackupFile } from '../../src/data/backup';
import { openDatabase, type ProgressRow } from '../../src/data/db';
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
