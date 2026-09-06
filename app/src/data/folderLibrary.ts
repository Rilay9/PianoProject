/**
 * A folder of scores on the phone, browsable in the app (docs/04 §4b).
 *
 * The owner has 37,261 MusicXML files — half a gigabyte of them. That is far
 * too much to bundle into a PWA whose whole precache is 13 MB, and there is no
 * reason to bundle it: the files are already on the phone. So the app does not
 * hold the library, it *reads* one, and adding a piece is the ordinary import
 * everything else already understands.
 *
 * Two facts about Android decide the shape, and both were checked rather than
 * assumed:
 *
 *   - `showDirectoryPicker()` does not exist on Chrome for Android. There is
 *     no persistent folder permission to be had, so nothing can be re-read on
 *     a later launch.
 *   - `<input type="file" webkitdirectory>` does work — Chrome Android 132+ —
 *     and hands over every file in the folder for the life of the page.
 *
 * Hence: the **listing** is stored and the **files** are not. Browsing works
 * with nothing connected, on a plane, a year later. Adding needs the folder
 * picked again, which is one tap and only when something is actually wanted.
 *
 * The metadata comes from a `library.json` sitting in the folder — written by
 * `tools/content/pdmx/manifest.py`, though nothing here is PDMX-specific. A
 * folder without one still works: the title is read out of each file the first
 * time it is opened, which is what the import path does anyway.
 */
import { openDatabase, type FolderLibraryRow, type FolderScore } from './db';
import { addImport, updateImport, ImportError } from './importStore';

/** The file a folder uses to describe itself. */
export const MANIFEST_NAME = 'library.json';

/** Bumped by the writer when a field changes meaning. */
export const MANIFEST_VERSION = 1;

const MANIFEST_KIND = 'pianopath-score-folder';

/** What counts as a score worth listing. PDFs are imported, not browsed. */
const SCORE_SUFFIXES = ['.mxl', '.musicxml', '.xml'];

/**
 * A folder past this many files is refused rather than half-read.
 *
 * The real library is 37,261. The ceiling exists so that pointing at
 * `/sdcard` by mistake fails with a sentence instead of locking the phone up
 * building a listing of forty thousand photographs.
 */
export const MAX_FOLDER_FILES = 100_000;

export class FolderError extends Error {}

/** Thrown when the picker was dismissed. Not a failure; nothing to report. */
export class FolderCancelled extends Error {}

export interface FolderLibrary {
  id: string;
  addedAt: string;
  source: string | null;
  scores: FolderScore[];
  /** True while the folder is picked and its files can actually be read. */
  connected: boolean;
}

/**
 * The files of a folder picked during this visit, by relative path.
 *
 * Memory, not storage, and deliberately: a `File` is a reference, not the
 * bytes, so 37,000 of them cost almost nothing — and none of them survives a
 * reload however they are stored.
 */
const connected = new Map<string, Map<string, File>>();

const listeners = new Set<() => void>();

export function onFolderLibrariesChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function isScoreFile(name: string): boolean {
  const lower = name.toLowerCase();
  return SCORE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

/**
 * `Library/bb/Qm….mxl` -> `bb/Qm….mxl`.
 *
 * `webkitRelativePath` always starts with the picked folder's own name, and
 * the manifest is written relative to the folder rather than to whatever the
 * folder happened to be called when it was copied across.
 */
export function relativePath(file: File): string {
  const path = file.webkitRelativePath || file.name;
  const cut = path.indexOf('/');
  return cut === -1 ? path : path.slice(cut + 1);
}

/** The picked folder's name, which is the only identity Android offers. */
export function folderNameOf(files: readonly File[]): string {
  for (const file of files) {
    const path = file.webkitRelativePath;
    if (path?.includes('/')) return path.slice(0, path.indexOf('/'));
  }
  return 'Scores';
}

/** A filename with no metadata behind it, made readable. */
export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, '');
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || name;
}

interface ManifestShape {
  kind?: unknown;
  version?: unknown;
  fields?: unknown;
  scores?: unknown;
  source?: { name?: unknown } | null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Turns a manifest's rows into `FolderScore`s, by name rather than by position.
 *
 * The rows are flat arrays — 37,261 objects with thirteen repeated keys is
 * 13 MB instead of 6 — so the `fields` header is what says which column is
 * which. Reading it by name means a future writer can add a column without
 * this having to be changed in step.
 */
export function parseManifest(text: string): { scores: FolderScore[]; source: string | null } {
  let raw: ManifestShape;
  try {
    raw = JSON.parse(text) as ManifestShape;
  } catch {
    throw new FolderError(`${MANIFEST_NAME} in that folder is not valid JSON.`);
  }
  if (raw.kind !== MANIFEST_KIND) {
    throw new FolderError(`${MANIFEST_NAME} in that folder is not a score-folder manifest.`);
  }
  if (raw.version !== MANIFEST_VERSION) {
    throw new FolderError(
      `${MANIFEST_NAME} is version ${String(raw.version)}; this app reads version ${String(
        MANIFEST_VERSION,
      )}. Regenerate it.`,
    );
  }
  const fields = Array.isArray(raw.fields) ? raw.fields.map(String) : [];
  const at = (row: unknown[], name: string): unknown => {
    const index = fields.indexOf(name);
    return index === -1 ? undefined : row[index];
  };
  const scores: FolderScore[] = [];
  for (const entry of Array.isArray(raw.scores) ? raw.scores : []) {
    if (!Array.isArray(entry)) continue;
    const file = asString(at(entry, 'file'));
    if (!file) continue;
    scores.push({
      file,
      title: asString(at(entry, 'title')),
      composer: asString(at(entry, 'composer')),
      level: asNumber(at(entry, 'level')),
      bars: asNumber(at(entry, 'bars')),
      status: asString(at(entry, 'status')) || 'unknown',
      style: asString(at(entry, 'style')),
      rating: asNumber(at(entry, 'rating')) ?? 0,
      ratings: asNumber(at(entry, 'ratings')) ?? 0,
      views: asNumber(at(entry, 'views')) ?? 0,
      lyrics: Boolean(at(entry, 'lyrics')),
      garbled: Boolean(at(entry, 'garbled')),
      museScore: asString(at(entry, 'museScore')),
    });
  }
  const source = raw.source && typeof raw.source.name === 'string' ? raw.source.name : null;
  return { scores, source };
}

/**
 * True when a score's own title says nothing — the placeholder MuseScore and
 * friends leave behind, or the CID the file is named after.
 */
export function looksUnnamed(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return true;
  // Whole-string, not a prefix: "Untitled Ballad" and "Scores of Kilkenny"
  // are titles, and a rule that ate them would rename real pieces.
  if (/^(untitled|score|new score|no title)$/i.test(trimmed)) return true;
  // `Qm…` base58: the filename, which is what the importer falls back to.
  return /^Qm[1-9A-HJ-NP-Za-km-z]{20,}$/.test(trimmed);
}

/** The row for a file the manifest says nothing about. */
function bareScore(path: string, name: string): FolderScore {
  return {
    file: path,
    title: titleFromFilename(name),
    composer: '',
    level: null,
    bars: null,
    status: 'unknown',
    style: '',
    rating: 0,
    ratings: 0,
    views: 0,
    lyrics: false,
    garbled: false,
    museScore: '',
  };
}

/**
 * Builds the listing for a picked folder.
 *
 * A manifest describes the files; the files decide what is listed. A row the
 * manifest has but the folder does not is dropped — it would fail when tapped
 * — and a file the manifest never mentioned is kept under its own name, which
 * is how a folder of the owner's own scores works with no manifest at all.
 */
export async function readFolder(files: readonly File[]): Promise<FolderLibrary> {
  if (files.length > MAX_FOLDER_FILES) {
    throw new FolderError(
      `That folder holds ${files.length.toLocaleString()} files. Pick the folder with the scores in it, not the one above it.`,
    );
  }
  const byPath = new Map<string, File>();
  let manifestFile: File | null = null;
  for (const file of files) {
    const path = relativePath(file);
    if (path === MANIFEST_NAME) {
      manifestFile = file;
      continue;
    }
    if (isScoreFile(path)) byPath.set(path, file);
  }
  if (byPath.size === 0) {
    throw new FolderError(
      'That folder has no MusicXML in it. The app reads .mxl, .musicxml and .xml files; a PDF goes through Import instead.',
    );
  }

  let described = new Map<string, FolderScore>();
  let source: string | null = null;
  if (manifestFile) {
    const parsed = parseManifest(await manifestFile.text());
    source = parsed.source;
    described = new Map(parsed.scores.map((score) => [score.file, score]));
  }

  const scores: FolderScore[] = [];
  for (const [path, file] of byPath) {
    scores.push(described.get(path) ?? bareScore(path, file.name));
  }
  // Sorted once here rather than on every draw: the browse screen re-filters
  // 37,000 rows on each keystroke and a comparison per row per keystroke is
  // the one cost worth paying up front.
  scores.sort((a, b) => a.title.localeCompare(b.title));

  const id = folderNameOf(files);
  connected.set(id, byPath);
  return { id, addedAt: new Date().toISOString(), source, scores, connected: true };
}

/** Opens Android's folder picker and reads whatever comes back. */
export async function pickFolder(): Promise<FolderLibrary> {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  // Not in the TypeScript DOM lib — it predates the standardisation and is
  // still spelled with the vendor prefix in every browser that has it.
  (input as unknown as Record<string, unknown>).webkitdirectory = true;
  input.style.display = 'none';
  document.body.appendChild(input);
  try {
    const files = await new Promise<File[]>((resolve) => {
      // `cancel` is not universal, so a picker dismissed without a choice
      // simply resolves empty and the caller says nothing happened.
      input.addEventListener('cancel', () => {
        resolve([]);
      });
      input.addEventListener('change', () => {
        resolve([...(input.files ?? [])]);
      });
      input.click();
    });
    if (files.length === 0) throw new FolderCancelled();
    const library = await readFolder(files);
    await saveFolder(library);
    return library;
  } finally {
    input.remove();
  }
}

async function saveFolder(library: FolderLibrary): Promise<void> {
  const db = await openDatabase();
  const row: FolderLibraryRow = {
    id: library.id,
    addedAt: library.addedAt,
    source: library.source,
    scores: library.scores,
  };
  await db?.put('folderLibraries', row);
  notify();
}

export async function savedFolders(): Promise<FolderLibrary[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('folderLibraries')) ?? [];
  return rows.map((row) => ({ ...row, connected: connected.has(row.id) }));
}

export async function forgetFolder(id: string): Promise<void> {
  const db = await openDatabase();
  await db?.delete('folderLibraries', id);
  connected.delete(id);
  notify();
}

export function isConnected(id: string): boolean {
  return connected.has(id);
}

/** Test hook: the session's file handles, without going through a picker. */
export function connectForTest(id: string, files: Map<string, File>): void {
  connected.set(id, files);
}

export function disconnectForTest(id: string): void {
  connected.delete(id);
}

/**
 * Copies one score out of the folder and into the library, as an import.
 *
 * This is the whole point of the screen, and it is deliberately the *existing*
 * import: once a piece is added it is a catalog item like any other — it has a
 * level, it can be put in a session, it is in the backup, and it works with
 * the folder long gone. Browsing is borrowed; adding is keeping.
 */
export async function addFromFolder(folderId: string, score: FolderScore) {
  const files = connected.get(folderId);
  if (!files) {
    throw new FolderError(
      `Pick the ${folderId} folder again to add from it — Android only lends a folder for one visit.`,
    );
  }
  const file = files.get(score.file);
  if (!file) {
    throw new FolderError(`${score.title} is listed but is not in the folder any more.`);
  }
  // A CID makes a hopeless filename to be greeted by in the library, so the
  // manifest's title goes on the file before the importer reads it — though
  // the importer prefers the score's own `<work-title>` when it has one, and
  // that is the right preference: the manifest's titles came through a CSV
  // that mangled 236 of them, while the file inside was never touched.
  const named = new File([file], `${score.title || file.name}.mxl`, { type: file.type });
  const row = await addImport(named);

  const patch: Parameters<typeof updateImport>[1] = {};
  // The one case where the manifest wins: the browse list showed a title, the
  // score turned out to have none of its own, and being called `Untitled` in
  // the library is worse than being called what it was called on the shelf.
  if (score.title && !score.garbled && row.title !== score.title && looksUnnamed(row.title)) {
    patch.title = score.title;
  }
  // The manifest's level is an estimate, and an estimate is still much better
  // than the import default of 5 — which exists precisely because an import
  // usually arrives with nothing at all.
  if (score.level !== null) patch.level = Math.round(score.level * 10) / 10;
  // A composer the manifest knows and the file did not is worth keeping: it is
  // what the Library screen groups and searches by.
  if (score.composer && row.tags.length === 0) patch.tags = [score.composer];

  if (Object.keys(patch).length === 0) return row;
  return (await updateImport(row.id, patch)) ?? row;
}

export { ImportError };
