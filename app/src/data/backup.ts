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
