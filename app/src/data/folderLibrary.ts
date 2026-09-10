/**
 * A folder of scores on the phone, browsable in the app (docs/04 §4b).
 *
 * The owner has 37,261 MusicXML files, 237 MB of them. That is far too much to
 * bundle into a PWA whose whole precache is 13 MB, and there is no
 * reason to bundle it: the files are already on the phone. So the app does not
 * hold the library, it *reads* one, and adding a piece is the ordinary import
 * everything else already understands.
 *
 * Two facts about Android decide the shape:
 *
 *   - `<input type="file" webkitdirectory>` works — Chrome Android 132+ — and
 *     hands over every file in the folder for the life of the page. This is
 *     the path that is known to work and it is the default.
 *   - MDN's compatibility data lists `showDirectoryPicker()` in Chrome for
 *     Android from 132 as well, which would allow a *stored* handle and so a
 *     folder that does not have to be picked again. Nobody has tried it on the
 *     owner's S25, and an API that exists can still refuse to keep a
 *     permission, so it sits behind the `folderHandles` setting — off until he
 *     confirms it — and every failure falls back to the picker above.
 *
 * Hence: the **listing** is stored and the **files** are not. Browsing works
 * with nothing connected, on a plane, a year later. Adding needs the folder
 * picked again, which is one tap and only when something is actually wanted —
 * or no taps at all, if the handle turns out to work.
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

/**
 * Directory handles for this page's lifetime.
 *
 * The handle is also written to the row, because the whole point is to survive
 * a relaunch — but IndexedDB storing a live browser object is a privilege
 * Chrome grants and every other engine may not, and `saveFolder` is not
 * allowed to lose the folder listing because the handle would not clone. So
 * the handle is kept here as well, and this map is what makes the feature work
 * for the rest of the session even where the write failed.
 */
const handles = new Map<string, unknown>();

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
 * How the folder is doing so far, for a screen that wants to say so.
 *
 * `total` is 0 when it is not known yet — the directory-handle walk below
 * finds out how many files there are by finding them, so until it is done
 * "142 of 900" is not a number anyone has; `total: 0` says "still counting"
 * rather than lying with a guess.
 */
export interface FolderProgress {
  /** Files looked at so far. */
  done: number;
  /** How many there are to look at, or 0 while that is still being found out. */
  total: number;
  /** The one just looked at, so "is it stuck" has an answer. */
  file: string;
}

export interface FolderReadOptions {
  onProgress?: (progress: FolderProgress) => void;
  /** Checked between batches; an aborted signal ends the read with `FolderCancelled`. */
  signal?: AbortSignal;
}

/** How many files pass between a check of `signal` and a breath for the UI thread. */
const YIELD_EVERY = 250;

function checkCancelled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new FolderCancelled();
}

/**
 * Hands control back to the browser for a tick.
 *
 * A folder of 37,261 files is real work, and none of the loops below await
 * anything else on the way through it — without this they would run to
 * completion in one uninterrupted turn, and a synchronous turn is a turn in
 * which nothing else paints, however many progress numbers were written
 * along the way. This is what makes "Reading 142 of 900" an honest read-out
 * instead of a number nobody sees until the loop is already done, and it is
 * also the only place `signal` actually gets a chance to be noticed.
 */
function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Builds the listing for a picked folder.
 *
 * A manifest describes the files; the files decide what is listed. A row the
 * manifest has but the folder does not is dropped — it would fail when tapped
 * — and a file the manifest never mentioned is kept under its own name, which
 * is how a folder of the owner's own scores works with no manifest at all.
 */
export async function readFolder(
  files: readonly File[],
  options: FolderReadOptions = {},
): Promise<FolderLibrary> {
  checkCancelled(options.signal);
  if (files.length > MAX_FOLDER_FILES) {
    throw new FolderError(
      `That folder holds ${files.length.toLocaleString()} files. Pick the folder with the scores in it, not the one above it.`,
    );
  }
  const byPath = new Map<string, File>();
  let manifestFile: File | null = null;
  let manifestRoot = '';
  let done = 0;
  for (const file of files) {
    const path = relativePath(file);
    const root = manifestRootOf(path);
    if (root !== null) {
      if (manifestFile === null || root.length < manifestRoot.length) {
        manifestFile = file;
        manifestRoot = root;
      }
    } else if (isScoreFile(path)) {
      byPath.set(path, file);
    }
    done += 1;
    options.onProgress?.({ done, total: files.length, file: path });
    if (done % YIELD_EVERY === 0) {
      checkCancelled(options.signal);
      await yieldToUI();
    }
  }
  checkCancelled(options.signal);
  return buildLibrary(folderNameOf(files), byPath, manifestFile, manifestRoot, options);
}

/**
 * `library.json` -> `''`; `pianopath-library/library.json` ->
 * `pianopath-library/`; anything else -> null.
 *
 * The manifest is looked for anywhere in the tree, not only at the top,
 * because the phone's own unzip puts the archive's folder *inside* a folder
 * of the same name — Samsung's Extract does — and the person, told to pick
 * `pianopath-library`, picks the outer one. That listed 37,261 hashes with
 * every title in a file one level down. The shallowest manifest wins, and its
 * directory is what the rows' paths are relative to.
 */
function manifestRootOf(path: string): string | null {
  if (path === MANIFEST_NAME) return '';
  if (path.endsWith('/' + MANIFEST_NAME)) return path.slice(0, path.length - MANIFEST_NAME.length);
  return null;
}

/**
 * The half of `readFolder` that does not care where the files came from.
 *
 * The picker gives every file a `webkitRelativePath`; a directory handle gives
 * none at all, and the path has to be assembled while walking. Everything
 * after that — the manifest, the bare rows, the sort — is the same, and it is
 * the same code.
 */
async function buildLibrary(
  id: string,
  byPath: Map<string, File>,
  manifestFile: File | null,
  manifestRoot = '',
  options: FolderReadOptions = {},
): Promise<FolderLibrary> {
  checkCancelled(options.signal);
  if (byPath.size === 0) {
    throw new FolderError(
      'That folder has no MusicXML in it. The app reads .mxl, .musicxml and .xml files; a PDF goes through Import instead.',
    );
  }

  let described = new Map<string, FolderScore>();
  // By the file's own name as well: the archive's names are content hashes,
  // unique by construction, so a row still finds its file when the folder
  // was flattened, re-sharded, or picked from a level the paths do not
  // expect. Only a name the manifest uses once is trusted this way.
  const byName = new Map<string, FolderScore | null>();
  let source: string | null = null;
  if (manifestFile) {
    const parsed = parseManifest(await manifestFile.text());
    source = parsed.source;
    described = new Map(parsed.scores.map((score) => [score.file, score]));
    for (const score of parsed.scores) {
      const name = score.file.slice(score.file.lastIndexOf('/') + 1);
      byName.set(name, byName.has(name) ? null : score);
    }
  }

  const scores: FolderScore[] = [];
  const total = byPath.size;
  let done = 0;
  for (const [path, file] of byPath) {
    const key = manifestRoot !== '' && path.startsWith(manifestRoot) ? path.slice(manifestRoot.length) : path;
    const row = described.get(key) ?? described.get(path) ?? byName.get(file.name) ?? null;
    // `file` is overwritten with the path this file is *actually* at, not
    // the manifest's own copy of it — `path` is the `byPath` key, and
    // `addFromFolder` looks a row up in the reconnected `byPath` by this same
    // field, so the two have to agree. (An older build kept the manifest's
    // path here instead, which is exactly the mismatch `addFromFolder`'s
    // filename fallback exists to paper over for a listing stored back then.)
    scores.push(row ? { ...row, file: path } : bareScore(path, file.name));
    done += 1;
    options.onProgress?.({ done, total, file: path });
    if (done % YIELD_EVERY === 0) {
      checkCancelled(options.signal);
      await yieldToUI();
    }
  }
  checkCancelled(options.signal);
  // Sorted once here rather than on every draw: the browse screen re-filters
  // 37,000 rows on each keystroke and a comparison per row per keystroke is
  // the one cost worth paying up front.
  scores.sort((a, b) => a.title.localeCompare(b.title));

  connected.set(id, byPath);
  return { id, addedAt: new Date().toISOString(), source, scores, connected: true };
}

/**
 * The bits of the File System Access API this file uses.
 *
 * Declared rather than imported: `showDirectoryPicker` is not in the
 * TypeScript DOM lib, and `queryPermission`/`requestPermission` are a Chrome
 * extension to the handle that is not in the standard either. Everything here
 * is called through optional chaining, so a browser with half of it behaves
 * like one with none.
 */
interface PermissionCapableHandle {
  queryPermission?: (options: { mode: 'read' }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: 'read' }) => Promise<PermissionState>;
}

type DirectoryHandle = FileSystemDirectoryHandle & PermissionCapableHandle;

interface PickerWindow {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<DirectoryHandle>;
}

/** Whether this browser has the API at all. Chrome for Android has it from 132. */
export function directoryPickerAvailable(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** The picker was dismissed, however the browser chose to say so. */
function isAbort(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError';
}

/**
 * Every score under a directory handle, keyed by its path inside the folder.
 *
 * Iterative rather than recursive: PDMX nests two levels and nothing here
 * should care how deep the owner's own folders go, and a stack that cannot
 * overflow costs nothing.
 */
async function readDirectoryHandle(
  handle: DirectoryHandle,
  options: FolderReadOptions = {},
): Promise<{ byPath: Map<string, File>; manifestFile: File | null; manifestRoot: string }> {
  const byPath = new Map<string, File>();
  let manifestFile: File | null = null;
  let manifestRoot = '';
  const stack: { dir: FileSystemDirectoryHandle; prefix: string }[] = [{ dir: handle, prefix: '' }];
  let seen = 0;
  while (stack.length > 0) {
    const next = stack.pop();
    if (!next) break;
    for await (const entry of next.dir.values()) {
      checkCancelled(options.signal);
      const path = next.prefix + entry.name;
      if (entry.kind === 'directory') {
        stack.push({ dir: entry, prefix: path + '/' });
        continue;
      }
      seen += 1;
      if (seen > MAX_FOLDER_FILES) {
        throw new FolderError(
          `That folder holds more than ${MAX_FOLDER_FILES.toLocaleString()} files. Pick the folder with the scores in it, not the one above it.`,
        );
      }
      if (entry.name === MANIFEST_NAME) {
        if (manifestFile === null || next.prefix.length < manifestRoot.length) {
          manifestFile = await entry.getFile();
          manifestRoot = next.prefix;
        }
        continue;
      }
      if (isScoreFile(path)) byPath.set(path, await entry.getFile());
      // The total is not known until the walk is over — a directory can hold
      // another directory, so "how many files" is not answerable from the
      // top before it is done. `total: 0` is `FolderProgress`'s way of saying
      // "still counting" rather than a number nobody yet has.
      options.onProgress?.({ done: seen, total: 0, file: path });
      if (seen % YIELD_EVERY === 0) await yieldToUI();
    }
  }
  return { byPath, manifestFile, manifestRoot };
}

/** Reads a folder the browser handed over as a handle rather than as files. */
export async function readFolderHandle(
  handle: DirectoryHandle,
  options: FolderReadOptions = {},
): Promise<FolderLibrary> {
  const { byPath, manifestFile, manifestRoot } = await readDirectoryHandle(handle, options);
  return buildLibrary(handle.name || 'Scores', byPath, manifestFile, manifestRoot, options);
}

/**
 * Asks for read permission on a stored handle without assuming the API is
 * there. `granted` when there is nothing to ask.
 */
async function readPermission(handle: DirectoryHandle): Promise<PermissionState> {
  const options = { mode: 'read' } as const;
  const current = (await handle.queryPermission?.(options)) ?? 'granted';
  if (current === 'granted') return current;
  return (await handle.requestPermission?.(options)) ?? 'denied';
}

/**
 * Reconnects a folder from its stored handle, if there is one and it is
 * allowed. `false` means the caller should ask for the folder again — which is
 * the behaviour with no handle at all, and the reason nothing here throws.
 */
export async function reconnectFolder(id: string): Promise<boolean> {
  if (connected.has(id)) return true;
  const db = await openDatabase();
  const row = await db?.get('folderLibraries', id);
  const handle = (handles.get(id) ?? row?.handle) as DirectoryHandle | undefined;
  if (!handle) return false;
  try {
    if ((await readPermission(handle)) !== 'granted') return false;
    const { byPath } = await readDirectoryHandle(handle);
    if (byPath.size === 0) return false;
    connected.set(id, byPath);
    notify();
    return true;
  } catch {
    // A handle can go stale: the folder was moved, the card was pulled, the
    // permission was revoked in Chrome's settings. The picker still works.
    return false;
  }
}

/**
 * Opens Android's folder picker and reads whatever comes back.
 *
 * With `remember` on and the API present it asks for a handle first, which is
 * the version that does not have to be repeated on the next Add. Anything that
 * goes wrong there — no API, an old Chrome, a handle the browser will not keep
 * — drops through to the picker that is known to work, so the fallback is the
 * behaviour the owner already has rather than an error message.
 */
export async function pickFolder(
  options: { remember?: boolean } & FolderReadOptions = {},
): Promise<FolderLibrary> {
  const { remember, ...readOptions } = options;
  if (remember === true && directoryPickerAvailable()) {
    const picker = (window as unknown as PickerWindow).showDirectoryPicker;
    try {
      const handle = await picker?.({ mode: 'read' });
      if (handle) {
        const library = await readFolderHandle(handle, readOptions);
        await saveFolder(library, handle);
        return library;
      }
    } catch (cause) {
      // A dismissed picker is a decision, not a failure: opening a second one
      // behind it would be the app arguing with him.
      if (isAbort(cause)) throw new FolderCancelled();
      if (cause instanceof FolderError || cause instanceof FolderCancelled) throw cause;
    }
  }
  return pickFolderWithInput(readOptions);
}

async function pickFolderWithInput(options: FolderReadOptions = {}): Promise<FolderLibrary> {
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
    const library = await readFolder(files, options);
    await saveFolder(library);
    return library;
  } finally {
    input.remove();
  }
}

async function saveFolder(library: FolderLibrary, handle?: unknown): Promise<void> {
  const db = await openDatabase();
  const row: FolderLibraryRow = {
    id: library.id,
    addedAt: library.addedAt,
    source: library.source,
    scores: library.scores,
  };
  if (handle !== undefined) handles.set(library.id, handle);
  try {
    await db?.put('folderLibraries', { ...row, ...(handle === undefined ? {} : { handle }) });
  } catch {
    // A handle the engine will not clone must not cost the listing, which is
    // the part that has to survive: browsing works with nothing connected.
    await db?.put('folderLibraries', row);
  }
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
  handles.delete(id);
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

/** Test hook: forget a remembered handle without forgetting the folder. */
export function forgetHandleForTest(id: string): void {
  handles.delete(id);
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
  // A stored handle, when there is one, turns "pick the folder again" into an
  // Allow tap or into nothing at all.
  if (!connected.has(folderId)) await reconnectFolder(folderId);
  const files = connected.get(folderId);
  if (!files) {
    throw new FolderError(
      `Pick the ${folderId} folder again to add from it — Android only lends a folder for one visit.`,
    );
  }
  let file = files.get(score.file);
  if (!file) {
    // A listing stored by an older build kept the *manifest's* path in
    // `file` rather than the path the file is actually at — `buildLibrary`
    // above now always writes the actual path, but a row written before that
    // was true is still sitting in IndexedDB, and `reconnectFolder` always
    // rebuilds `files` keyed by actual paths. The filename on its own is
    // still reliable: it is the archive's content hash, unique by
    // construction (`buildLibrary`'s `byName` map above relies on the same
    // fact), so a row with the older shape still finds its file by name.
    const name = score.file.slice(score.file.lastIndexOf('/') + 1);
    const bySameName = [...files.entries()].filter(([path]) => path === name || path.endsWith(`/${name}`));
    if (bySameName.length === 1) file = bySameName[0]?.[1];
  }
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

  // Recorded whatever else changes: this is how the browse list knows the row
  // is already in the library without guessing from its title.
  const patch: Parameters<typeof updateImport>[1] = {
    origin: { folder: folderId, file: score.file },
  };
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

  return (await updateImport(row.id, patch)) ?? row;
}

export { ImportError };
