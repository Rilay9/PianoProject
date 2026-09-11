/**
 * The backup must never exist as one string.
 *
 * This is the only insurance the owner has: the app is offline-first on one
 * phone, so a year of practice history has no server copy. `exportAll` built
 * the whole file in memory and `JSON.stringify` then made a second copy of it
 * as a single JavaScript string — for forty imported PDFs of 4 MB that is
 * ~160 MB of bytes, ~213 MB once base64 has inflated it, with the rows, the
 * base64 and the final JSON all live at once. A `RangeError` on the one
 * operation that must not fail.
 *
 * So the two things worth pinning down are that the streamed file *says the
 * same thing* as the in-memory one, and that it is genuinely produced a row at
 * a time rather than assembled whole and cut up afterwards.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { exportAll, isBackupFile, streamBackup } from '../../src/data/backup';
import { openDatabase } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const PDF_BYTES = [1, 2, 3, 4, 5];

async function seed(): Promise<void> {
  const db = await openDatabase();
  if (!db) throw new Error('no database');
  await db.put('progress', {
    itemId: 'song.one',
    status: 'passed',
    bestAccuracy: 0.9,
    bestTempoPct: 100,
    attempts: 3,
    lastPracticedAt: '2026-01-01T00:00:00.000Z',
    minutes: 12,
    passedOn: ['2026-01-01'],
  });
  await db.put('settings', { requireTwoSongs: true }, 'settings');
  // A PDF is the row that makes the size a problem: bytes, not text.
  await db.put('imports', {
    id: 'imp-1',
    title: 'A scan',
    kind: 'pdf',
    addedAt: '2026-01-02T00:00:00.000Z',
    data: new Uint8Array(PDF_BYTES).buffer,
    tags: [],
  });
  await db.put('imports', {
    id: 'imp-2',
    title: 'A score',
    kind: 'musicxml',
    addedAt: '2026-01-03T00:00:00.000Z',
    data: '<score-partwise/>',
    tags: [],
  });
}

async function streamed(now: Date): Promise<string> {
  let text = '';
  for await (const chunk of streamBackup(now)) text += chunk;
  return text;
}

describe('streamBackup', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('says exactly what the in-memory backup says', async () => {
    await seed();
    const now = new Date('2026-02-03T04:05:06.000Z');
    const parsed: unknown = JSON.parse(await streamed(now));
    expect(isBackupFile(parsed)).toBe(true);
    // Against the old path's own output, so the rewrite cannot quietly drop a
    // store, a key or a row.
    expect(parsed).toEqual(JSON.parse(JSON.stringify(await exportAll(now))));
    clearFakeIndexedDb();
  });

  it('is valid JSON with nothing in it, which is a new phone', async () => {
    const parsed: unknown = JSON.parse(await streamed(new Date()));
    expect(isBackupFile(parsed)).toBe(true);
    clearFakeIndexedDb();
  });

  it('comes out in pieces, none of them the whole file', async () => {
    await seed();
    const chunks: string[] = [];
    for await (const chunk of streamBackup(new Date())) chunks.push(chunk);
    // Several, and no single one is the file: that is the difference between
    // streaming and stringifying then slicing.
    expect(chunks.length).toBeGreaterThan(5);
    const whole = chunks.join('');
    for (const chunk of chunks) expect(chunk.length).toBeLessThan(whole.length);
    clearFakeIndexedDb();
  });

  it('reports progress against a total it did not read the rows to get', async () => {
    await seed();
    const seen: { rows: number; total: number }[] = [];
    for await (const chunk of streamBackup(new Date(), (p) => {
      seen.push({ rows: p.rows, total: p.total });
    })) {
      expect(typeof chunk).toBe('string');
    }
    expect(seen.length).toBeGreaterThan(0);
    const last = seen[seen.length - 1];
    expect(last?.total).toBe(4);
    expect(last?.rows).toBe(4);
    // Monotonic, or a progress bar goes backwards.
    for (let i = 1; i < seen.length; i += 1) {
      expect(seen[i]?.rows ?? 0).toBeGreaterThanOrEqual(seen[i - 1]?.rows ?? 0);
    }
    clearFakeIndexedDb();
  });

  it('keeps a PDF byte for byte through base64, and leaves text as text', async () => {
    await seed();
    const parsed = JSON.parse(await streamed(new Date())) as {
      stores: { imports: { id: string; data: string; encoding?: string }[] };
    };
    const pdf = parsed.stores.imports.find((row) => row.id === 'imp-1');
    expect(pdf?.encoding).toBe('base64');
    const decoded = atob(pdf?.data ?? '');
    expect([...decoded].map((char) => char.charCodeAt(0))).toEqual(PDF_BYTES);
    // And a MusicXML row is not base64'd for no reason — the file should stay
    // openable in a text editor, which is why it is JSON at all.
    const xml = parsed.stores.imports.find((row) => row.id === 'imp-2');
    expect(xml?.encoding).toBeUndefined();
    expect(xml?.data).toBe('<score-partwise/>');
    clearFakeIndexedDb();
  });
});

describe('an import records how big it is', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('measures text in bytes, not in UTF-16 code units', async () => {
    // The storage report puts its total beside `navigator.storage.estimate()`,
    // which is bytes. `String.length` is code units, so a score full of
    // accented composer names was under-reported against a real measurement —
    // on the one screen the owner opens because storage is tight.
    const { byteSizeOf } = await import('../../src/data/importStore');
    expect(byteSizeOf('abc')).toBe(3);
    // Two code units, three bytes.
    expect('é'.length).toBe(1);
    expect(byteSizeOf('é')).toBe(2);
    expect(byteSizeOf('Dvořák')).toBeGreaterThan('Dvořák'.length);
    // An emoji is one code point, two code units, four bytes.
    expect(byteSizeOf('🎹')).toBe(4);
    expect(byteSizeOf(new Uint8Array([1, 2, 3]).buffer)).toBe(3);
    clearFakeIndexedDb();
  });

  it('fills the size in for a row written before it was recorded', async () => {
    // The archive was imported by an older build, so most rows have no
    // `bytes`. Reading it back must not need the file loaded a second time.
    const db = await openDatabase();
    if (!db) throw new Error('no database');
    await db.put('imports', {
      id: 'old',
      title: 'Written by an older build',
      kind: 'musicxml',
      addedAt: '2026-01-01T00:00:00.000Z',
      data: '<score-partwise/>',
      tags: [],
    });
    const { importSummaries, resetImportCacheForTest } = await import(
      '../../src/data/importStore'
    );
    resetImportCacheForTest();
    const [summary] = await importSummaries();
    expect(summary?.bytes).toBe('<score-partwise/>'.length);
    clearFakeIndexedDb();
  });
});
