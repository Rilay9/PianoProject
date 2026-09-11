/**
 * Export and import everything (docs/01 §4.5, docs/04 §6).
 *
 * This is the only insurance the learner has. The app is offline-first and
 * installed as an APK on one phone (`00` D19/D20), so there is no server copy
 * of a year of practice history — a backup file is it. That shapes two
 * decisions here:
 *
 *   - **Imports are included.** They are the largest thing in the file by far
 *     (a PDF is megabytes), and they are also the one thing that cannot be
 *     re-downloaded, because they came off the owner's own disk.
 *   - **Import is additive by default.** Restoring onto a phone that has
 *     practised since the export should not throw that practice away, so rows
 *     are merged and the better of two progress rows wins.
 *
 * Binary (PDF bytes) is base64 in the JSON. That inflates it by a third, and
 * the alternative — a zip — would mean owning a container format for a file
 * nothing else reads. One dependency-free file that a text editor can open is
 * worth the third.
 */
import { openDatabase, STORE_NAMES, type ImportRow, type ProgressRow, type StoreName } from './db';
import { importsChanged } from './importStore';
import { forgetCachedProgress } from './progressStore';
import { forgetCachedPlan } from './planStore';
import { forgetCachedSkills } from './skillsStore';

export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'pianopath';
  version: number;
  exportedAt: string;
  stores: Record<string, unknown[]>;
  /** Keys for the stores that have no in-value key (`settings`, `micCalibration`). */
  keys: Record<string, string[]>;
}

/** Stores whose key is separate from the value, so it has to be written out. */
const OUT_OF_LINE: StoreName[] = ['settings', 'micCalibration'];

export function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = '';
  // Chunked: `String.fromCharCode(...millionBytes)` blows the argument limit.
  for (let i = 0; i < view.length; i += 8192) {
    binary += String.fromCharCode(...view.subarray(i, i + 8192));
  }
  return btoa(binary);
}

export function base64ToBytes(text: string): ArrayBuffer {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** An `ImportRow` on its way into JSON: PDF bytes become base64. */
interface SerialisedImport extends Omit<ImportRow, 'data'> {
  data: string;
  encoding?: 'base64';
}

function serialiseImport(row: ImportRow): SerialisedImport {
  return typeof row.data === 'string'
    ? { ...row, data: row.data }
    : { ...row, data: bytesToBase64(row.data), encoding: 'base64' };
}

function deserialiseImport(raw: SerialisedImport): ImportRow {
  return { ...raw, data: raw.encoding === 'base64' ? base64ToBytes(raw.data) : raw.data };
}

export async function exportAll(now = new Date()): Promise<BackupFile> {
  const db = await openDatabase();
  const file: BackupFile = {
    app: 'pianopath',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    stores: {},
    keys: {},
  };
  if (!db) return file;
  for (const store of STORE_NAMES) {
    const values = await db.getAll(store);
    file.stores[store] =
      store === 'imports' ? (values as ImportRow[]).map(serialiseImport) : values;
    if (OUT_OF_LINE.includes(store)) {
      file.keys[store] = (await db.getAllKeys(store)).map(String);
    }
  }
  return file;
}

/**
 * How far the backup has got, for a screen that has to say something.
 *
 * A backup of an owner with forty imported PDFs is a minute of work. Saying
 * nothing for a minute, on the one operation whose whole purpose is protecting
 * what exists nowhere else, is the worst place in the app to be silent.
 */
export interface BackupProgress {
  store: StoreName;
  /** Rows written so far, across every store. */
  rows: number;
  /** Rows there are to write, across every store. */
  total: number;
}

/**
 * The backup as a stream of JSON text, one row at a time.
 *
 * `exportAll` builds the whole thing in memory and `JSON.stringify` then makes
 * a second copy of it as one JavaScript string. For this owner that is not a
 * detail: forty imported PDFs of 4 MB is ~160 MB of bytes, ~213 MB once base64
 * has inflated it by a third, and the rows, the per-file base64 and the final
 * JSON are all live at once. The result is a `RangeError` or a WebView kill on
 * the one operation that must never fail.
 *
 * So the JSON is written by hand, in order, and each row is serialised,
 * yielded and dropped. Peak memory is the largest single row rather than the
 * sum of all of them. Written by hand rather than with a JSON library because
 * the shape is fixed and known — `app`, `version`, `exportedAt`, `stores`,
 * `keys` — and a streaming JSON writer for five known fields is more code than
 * the five known fields.
 *
 * The output is byte-identical in meaning to `exportAll` + `JSON.stringify`,
 * which is what `backupStreaming.test.ts` asserts by parsing it back and
 * comparing against the in-memory form.
 */
export async function* streamBackup(
  now = new Date(),
  onProgress?: (progress: BackupProgress) => void,
): AsyncGenerator<string> {
  const db = await openDatabase();
  yield `{"app":"pianopath","version":${String(BACKUP_VERSION)},"exportedAt":${JSON.stringify(now.toISOString())}`;
  if (!db) {
    yield ',"stores":{},"keys":{}}';
    return;
  }

  // Counted first, so progress has a denominator. `count()` does not read the
  // rows, which is the whole point — the alternative is loading everything to
  // find out how much there is to load.
  let total = 0;
  for (const store of STORE_NAMES) total += await db.count(store);

  let rows = 0;
  yield ',"stores":{';
  let firstStore = true;
  for (const store of STORE_NAMES) {
    yield `${firstStore ? '' : ','}${JSON.stringify(store)}:[`;
    firstStore = false;
    // A cursor, not `getAll`: `getAll('imports')` is every PDF in memory at
    // once, which is the fault this function exists to remove.
    let cursor = await db.transaction(store).store.openCursor();
    let firstRow = true;
    while (cursor) {
      const value: unknown =
        store === 'imports' ? serialiseImport(cursor.value as ImportRow) : cursor.value;
      yield `${firstRow ? '' : ','}${JSON.stringify(value)}`;
      firstRow = false;
      rows += 1;
      onProgress?.({ store, rows, total });
      cursor = await cursor.continue();
    }
    yield ']';
  }
  yield '},"keys":{';
  let firstKey = true;
  for (const store of OUT_OF_LINE) {
    const keys = (await db.getAllKeys(store)).map(String);
    yield `${firstKey ? '' : ','}${JSON.stringify(store)}:${JSON.stringify(keys)}`;
    firstKey = false;
  }
  yield '}}';
}

/**
 * Writes the backup wherever the device will take it, without ever holding it
 * whole.
 *
 * The picker path is the good one: a `FileSystemWritableFileStream` takes the
 * chunks as they come, so the file is only ever on disk. The other two need a
 * `Blob`, and a `Blob` built from an array of chunks is still far better than
 * one built from a single joined string — the parts are not copied into one
 * buffer by JavaScript, and there is never a moment where the whole backup and
 * a second copy of it both exist.
 */
export async function writeBackup(
  now = new Date(),
  onProgress?: (progress: BackupProgress) => void,
): Promise<'file' | 'share' | 'download'> {
  const name = backupFilename(now);
  const picker = (window as { showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle> })
    .showSaveFilePicker;
  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: name,
        types: [{ description: 'PianoPath backup', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      try {
        for await (const chunk of streamBackup(now, onProgress)) await writable.write(chunk);
      } finally {
        await writable.close();
      }
      return 'file';
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return 'file';
      // Anything else falls through: the learner must still end up with a file.
    }
  }

  const chunks: string[] = [];
  for await (const chunk of streamBackup(now, onProgress)) chunks.push(chunk);
  const blob = new Blob(chunks, { type: 'application/json' });
  const shareFile = new File([blob], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (data: unknown) => boolean };
  if (typeof navigator.share === 'function' && nav.canShare?.({ files: [shareFile] })) {
    await navigator.share({ files: [shareFile], title: name });
    return 'share';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  return 'download';
}

export interface ImportReport {
  /** Rows written, per store. */
  written: Record<string, number>;
  /** Progress rows kept because the device's copy was further along. */
  keptLocal: number;
}

/** The device's row wins when it has more practice in it than the backup's. */
function betterProgress(mine: ProgressRow, theirs: ProgressRow): ProgressRow {
  const rank = (row: ProgressRow): number =>
    ['new', 'started', 'passed', 'mastered'].indexOf(row.status);
  if (rank(mine) !== rank(theirs)) return rank(mine) > rank(theirs) ? mine : theirs;
  return mine.attempts >= theirs.attempts ? mine : theirs;
}

export function isBackupFile(raw: unknown): raw is BackupFile {
  if (typeof raw !== 'object' || raw === null) return false;
  const v = raw as Partial<BackupFile>;
  return v.app === 'pianopath' && typeof v.version === 'number' && typeof v.stores === 'object';
}

/**
 * Restores a backup.
 *
 * `replace` wipes each store first — for moving to a new phone, where the
 * device's own rows are noise. The default merges, which is what "I restored
 * last week's backup by mistake" needs.
 */
export async function importAll(
  raw: unknown,
  options: { replace?: boolean } = {},
): Promise<ImportReport> {
  if (!isBackupFile(raw)) throw new Error('That is not a PianoPath backup file.');
  if (raw.version > BACKUP_VERSION) {
    throw new Error(
      `That backup was written by a newer version of the app (v${String(raw.version)}). Update first.`,
    );
  }
  const db = await openDatabase();
  const report: ImportReport = { written: {}, keptLocal: 0 };
  if (!db) throw new Error('This browser is not storing data, so there is nothing to restore into.');

  for (const store of STORE_NAMES) {
    const rows = raw.stores[store];
    if (!Array.isArray(rows)) continue;
    if (options.replace) await db.clear(store);
    let written = 0;

    for (const [index, row] of rows.entries()) {
      if (store === 'progress' && !options.replace) {
        const incoming = row as ProgressRow;
        const mine = await db.get('progress', incoming.itemId);
        if (mine) {
          const winner = betterProgress(mine, incoming);
          if (winner === mine) {
            report.keptLocal += 1;
            continue;
          }
        }
        await db.put('progress', incoming);
      } else if (store === 'imports') {
        await db.put('imports', deserialiseImport(row as SerialisedImport));
      } else if (store === 'sessions') {
        // Autoincrement keys collide across devices, so a merged session gets
        // a fresh one rather than overwriting a run that already happened.
        const session = { ...(row as Record<string, unknown>) };
        if (!options.replace) delete session.id;
        await db.put('sessions', session as never);
      } else if (OUT_OF_LINE.includes(store)) {
        const key = raw.keys?.[store]?.[index];
        if (key === undefined) continue;
        await db.put(store as 'settings', row, key);
      } else {
        await db.put(store as 'plan', row as never);
      }
      written += 1;
    }
    report.written[store] = written;
  }
  // Every store above keeps a write-through copy in memory, and this function
  // has just gone behind all of them. Left alone they do not merely show stale
  // numbers: the next run reads the cached streak row, adds today's minutes to
  // it and writes it back, which **deletes the restored history** — the one
  // thing in this app with no second copy. Same shape for the plan and the
  // skills; the imports also have to say so, or no screen redraws.
  forgetCachedProgress();
  forgetCachedPlan();
  forgetCachedSkills();
  if (Array.isArray(raw.stores.imports)) importsChanged();
  return report;
}

export function backupFilename(now = new Date()): string {
  return `pianopath-backup-${now.toISOString().slice(0, 10)}.json`;
}

/**
 * Hands the file to the platform.
 *
 * Tries the File System Access API first (a real "save as" the learner can put
 * on the SD card), then the Android share sheet, then a download link. On the
 * phone this is the APK's WebView, where the first two are the ones that give
 * a file you can find again.
 */
export async function saveBackupFile(file: BackupFile, now = new Date()): Promise<'file' | 'share' | 'download'> {
  const text = JSON.stringify(file);
  const name = backupFilename(now);

  const picker = (window as { showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle> })
    .showSaveFilePicker;
  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: name,
        types: [{ description: 'PianoPath backup', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return 'file';
    } catch (cause) {
      // A cancelled picker is not a failure worth falling through loudly for,
      // but any other error should still leave the learner with a file.
      if (cause instanceof DOMException && cause.name === 'AbortError') return 'file';
    }
  }

  const blob = new Blob([text], { type: 'application/json' });
  const shareFile = new File([blob], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (data: unknown) => boolean };
  if (typeof navigator.share === 'function' && nav.canShare?.({ files: [shareFile] })) {
    await navigator.share({ files: [shareFile], title: name });
    return 'share';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  return 'download';
}
