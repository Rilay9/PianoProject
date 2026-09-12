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
 *     the path that is known to work and it is the fallback.
 *   - `showDirectoryPicker()` is in Chrome for Android from 132 as well, which
 *     allows a *stored* handle and so a folder that does not have to be picked
 *     again. An installed PWA keeps File System Access permissions across
 *     sessions from Chrome 122, so the handle in IndexedDB plus one free
 *     `queryPermission` on each launch should mean no prompt at all — but an
 *     API that exists can still refuse, so every failure falls back to the
 *     picker above and says which failure it was.
 *
 * Hence: the **listing** is stored and the **files** are not. Browsing works
 * with nothing connected, on a plane, a year later. Adding descends one path
 * through the stored handle, which is a handful of round trips whatever the
 * folder's size.
 *
 * **The manifest is the index; the walk is the fallback.** This was the other
 * way round, and that was the fault. `library.json` — written by
 * `tools/content/pdmx/manifest.py`, though nothing here is PDMX-specific —
 * carries a row per score with the path to that score in it, so one 6 MB file
 * read holds the whole listing. The old code walked all 37,261 directory
 * entries to decide what existed and used the manifest only to decorate what
 * it found, which meant the first run was several minutes of enumeration —
 * and Chromium's own intent-to-ship for the API records that opening a very
 * large directory makes the browser unresponsive, so at this size that was not
 * slowness but a documented failure mode. Reading the index instead removes it
 * from the common path entirely.
 *
 * The walk still exists, for exactly two cases: a folder with no manifest, and
 * an owner who asks for a rescan. Both are told what they cost, and the walk
 * itself is now incremental, resumable and cancellable (see `walkLibrary`).
 *
 * What manifest-first gives up is said on the screen rather than hidden: a
 * score dropped into the folder after the manifest was written is not in the
 * listing until a rescan, and a row whose file has since gone is only found
 * out about when it is tapped — at which point that row is taken out of the
 * listing rather than left to fail again.
 */
import {
  openDatabase,
  type FolderIndexRow,
  type FolderLibraryRow,
  type FolderListing,
  type FolderScore,
  type FolderScoreRow,
} from './db';
import { addImport, updateImport, ImportError } from './importStore';
import { walkFolder, type WalkMessage, type WalkRequest } from './folderWalk.worker';

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

/**
 * What the owner can actually *do* about a failure, as a value rather than as
 * a phrase the screen has to pattern-match out of the message.
 *
 *   - `open`  — the folder is known and a handle is held; one tap and an Allow
 *     makes it usable, and nothing is re-read.
 *   - `pick`  — there is no handle, or the one there is no longer points at
 *     anything. The folder has to be chosen again, and that does mean a rescan.
 *   - `rescan` — the folder is open and readable; it is the *listing* that is
 *     out of date. Nothing needs picking and no permission is missing, so
 *     sending the owner to the picker would be the wrong instruction as well
 *     as the expensive one.
 *
 * The screen used to decide which of these it was by running a regular
 * expression over the sentence, which meant a reworded message silently lost
 * its button.
 */
export type FolderCure = 'open' | 'pick' | 'rescan' | null;

export class FolderError extends Error {
  readonly cure: FolderCure;
  /**
   * The path of a listed score the folder turned out not to have.
   *
   * Manifest-first cannot know a file has gone without looking for it, and the
   * only thing that ever looks is `Add`. So the discovery has to go somewhere:
   * the row is dropped from the stored listing, and this is what tells the
   * screen which row to take off the list it is drawing.
   */
  readonly gone: string | null;
  constructor(message: string, cure: FolderCure = null, gone: string | null = null) {
    super(message);
    this.cure = cure;
    this.gone = gone;
  }
}

/** Thrown when the picker was dismissed. Not a failure; nothing to report. */
export class FolderCancelled extends Error {}

/**
 * Why remembering the folder did not work, when there is something to say.
 *
 * `null` is the ordinary case — either the setting is off, or the handle is
 * held and everything is fine. The other four are the ways the feature
 * degrades, and each one degrades differently enough that "pick the folder
 * again" on its own would not tell the owner what to do about it:
 *
 *   - `not-remembered` — the setting is on and the browser handed over no
 *     handle at all (no `showDirectoryPicker`, an old Chrome, a refusal). The
 *     app is exactly as capable as it was with the setting off.
 *   - `not-stored` — a handle was taken, and IndexedDB would not clone it.
 *     Adding works for the rest of this visit, from the in-memory map below,
 *     and there is nothing to reconnect to after the app is closed. This is
 *     the silent one: everything looks like it worked until the next launch.
 *   - `permission` — a handle was stored and `queryPermission` /
 *     `requestPermission` did not come back `granted`. The folder is known;
 *     Chrome will not open it.
 *   - `stale` — a handle was stored and reading through it failed: moved,
 *     renamed, card pulled, permission revoked in Chrome's own settings.
 */
export type FolderRememberNote = 'not-remembered' | 'not-stored' | 'permission' | 'stale' | null;

/**
 * Where a listing came from, which decides what it can be trusted to know.
 *
 *   - `manifest` — the folder's own `library.json`, read in one go. Complete as
 *     of the moment that file was written, and blind to anything since.
 *   - `walk` — the folder was enumerated. Complete as of the moment it was
 *     walked, including files no manifest mentions.
 *   - `partial` — a walk that was cancelled or interrupted. Browsable, and
 *     honest that there is more: `pending` says how much.
 *
 * Re-exported from `db.ts`, which is where the stored row that carries it is
 * described; this is the name the screens have always imported.
 */
export type { FolderListing };

/**
 * A folder the app has a listing for — the folder, not the listing.
 *
 * **The rows are deliberately not in here.** This is what `savedFolders()`
 * hands back on every visit to the browse screen, and it used to carry all
 * 37,261 `FolderScore`s with it: some forty megabytes of structured clone,
 * materialised in full, to draw a screenful and a count. The screen now reads
 * `folderIndex()` for the arrays it filters over and `folderScoresAt()` for
 * the sixty rows it is about to draw, so nothing on the common path loads the
 * listing at all.
 *
 * A *read* — picking a folder, rescanning one — does produce every row, because
 * it just built them, and says so with `FolderReading` below.
 */
export interface FolderLibrary {
  id: string;
  addedAt: string;
  source: string | null;
  /** Listable scores in the folder. The number the screen prints. */
  count: number;
  /** True while the folder is picked and its files can actually be read. */
  connected: boolean;
  /** How this listing was built, and so what it cannot know. */
  listedFrom: FolderListing;
  /**
   * Top-level folders an interrupted walk has still to index.
   *
   * Empty for every finished listing. A phone that kills the app half way
   * through 37,261 files leaves this non-empty, and it is both the sentence
   * the screen says and the instruction the resumed walk takes.
   */
  pending: string[];
  /**
   * True when a handle for this folder is held, so `openFolder` is worth
   * offering.
   *
   * This is the difference between the two cures, and the screen had no way to
   * tell them apart: with a handle the fix is one tap and an Allow and nothing
   * is re-read; without one the folder has to be picked again, and that does
   * mean reading all of it.
   */
  canOpen: boolean;
  /** What to say about remembering this folder, if anything. */
  rememberNote: FolderRememberNote;
}

/**
 * What a read of a folder produces: the folder, and every row it just built.
 *
 * The rows are here because they are already in hand — the manifest was parsed
 * into them a moment ago, or the walk found them — and throwing them away only
 * to read them back would be the same mistake in the other direction.
 */
export interface FolderReading extends FolderLibrary {
  scores: FolderScore[];
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

/**
 * The last thing worth saying about remembering each folder.
 *
 * Session state rather than a stored column, deliberately: every entry is a
 * fact about *this* visit — what the picker did just now, what
 * `queryPermission` answered just now — and a stale one written a month ago
 * would be a sentence on the screen that nothing has checked.
 */
const notes = new Map<string, FolderRememberNote>();

/** What to tell the owner about remembering this folder. `null` when nothing. */
export function folderRememberNote(id: string): FolderRememberNote {
  return notes.get(id) ?? null;
}

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

/**
 * Accents off and lower-cased, so "faure" finds "Fauré".
 *
 * Here rather than on the screen because the *stored* index is folded — both
 * the haystack the search box matches and the `byTitle` index the A-to-Z rail
 * seeks on — and a fold that differed between the writer and the reader would
 * be an index that silently matched nothing.
 */
export function fold(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Everything before A and after Z, which in a folder is mostly numbers. */
export const OTHER_LETTER = '#';

/**
 * Which letter a title files under. `#` for digits, punctuation and the rest.
 *
 * The same rule as `ui/alphaRail.ts`'s own `letterFor`, and it has to stay the
 * same rule: the rail reads the drawn rows with its copy and reads which
 * letters the *listing* has with this one, so a divergence would dim a letter
 * the list has something under. `folderStorage.test.ts` asserts the two agree,
 * row by row, over a listing built the way a scan builds one.
 */
export function letterFor(title: string): string {
  // Accents fold to their base letter, so `Étude` files under E rather than
  // under `#` — which is where it went before, along with every Dvořák.
  const first = title.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : OTHER_LETTER;
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
  /** Files looked at so far — or, while `indexing`, folders finished. */
  done: number;
  /** How many there are to look at, or 0 while that is still being found out. */
  total: number;
  /** The one just looked at, so "is it stuck" has an answer. */
  file: string;
  /** Scores found so far, which is the number the owner actually cares about. */
  found: number;
  /**
   * Which wait this is.
   *
   * Counting and reading are different waits and a single sentence covering
   * both is why a slow import read as a broken one: during `counting` there is
   * no denominator, so a number that climbs is the only honest read-out, and a
   * bar showing 0 % is indistinguishable from a bar that is stuck.
   *
   * `indexing` is the walk once the root has been read. It is the one phase
   * with a real denominator that arrives early — the folders at the top are
   * counted before any of them is entered — so it is the one that can say how
   * far along a walk of 37,261 files is while it is still in its first seconds.
   */
  phase: 'counting' | 'reading' | 'listing' | 'indexing';
}

export interface FolderReadOptions {
  onProgress?: (progress: FolderProgress) => void;
  /** Checked between batches; an aborted signal ends the read with `FolderCancelled`. */
  signal?: AbortSignal;
  /**
   * Walk the folder even though it has a manifest.
   *
   * The manifest is the index, so the walk is not something to do casually. It
   * happens when the owner asks for it by name — because the folder itself has
   * changed — and the button that asks says what it costs.
   */
  rescan?: boolean;
  /** Finish an interrupted walk rather than starting one. */
  resume?: { branches: string[]; scores: FolderScore[] };
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
  // `scheduler.yield` puts the continuation at the *front* of the queue and
  // keeps its priority. `setTimeout(0)` sends it to the back, where anything
  // queued in the meantime goes first, and the delay is clamped to several
  // milliseconds — far more when the page is not visible, which is why an
  // import built on it *stops* when the phone is put down rather than getting
  // slower. The timer stays as the fallback for browsers without it.
  const scheduling = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof scheduling?.yield === 'function') return scheduling.yield();
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
): Promise<FolderReading> {
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
    options.onProgress?.({
      done,
      total: files.length,
      file: path,
      found: byPath.size,
      phase: 'reading',
    });
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
): Promise<FolderReading> {
  checkCancelled(options.signal);
  if (byPath.size === 0) {
    throw new FolderError(
      'That folder has no MusicXML in it. The app reads .mxl, .musicxml and .xml files; a PDF goes through Import instead.',
    );
  }

  const described = manifestFile === null ? null : describedBy(await manifestFile.text());

  const scores: FolderScore[] = [];
  const total = byPath.size;
  let done = 0;
  for (const [path, file] of byPath) {
    scores.push(decorate(path, file.name, described, manifestRoot));
    done += 1;
    options.onProgress?.({ done, total, file: path, found: done, phase: 'listing' });
    if (done % YIELD_EVERY === 0) {
      checkCancelled(options.signal);
      await yieldToUI();
    }
  }
  checkCancelled(options.signal);
  // Sorted once here rather than on every draw: the browse screen re-filters
  // 37,000 rows on each keystroke and a comparison per row per keystroke is
  // the one cost worth paying up front.
  scores.sort(byTitle);

  connected.set(id, byPath);
  return {
    id,
    addedAt: new Date().toISOString(),
    source: described?.source ?? null,
    scores,
    count: scores.length,
    connected: true,
    listedFrom: 'walk',
    pending: [],
    // Filled in by `pickFolder` once it knows whether a handle was kept; a
    // folder read through the file input never has one.
    canOpen: false,
    rememberNote: null,
  };
}

/** One order for every listing, so a partial one merges into a finished one. */
function byTitle(a: FolderScore, b: FolderScore): number {
  return a.title.localeCompare(b.title);
}

/** A parsed manifest, indexed the two ways a path is looked up in it. */
interface Described {
  source: string | null;
  byPath: Map<string, FolderScore>;
  /**
   * By the file's own name as well: the archive's names are content hashes,
   * unique by construction, so a row still finds its file when the folder was
   * flattened, re-sharded, or picked from a level the paths do not expect.
   * Only a name the manifest uses once is trusted this way — `null` marks the
   * ones it uses twice.
   */
  byName: Map<string, FolderScore | null>;
}

function describedBy(text: string): Described {
  return describedFrom(parseManifest(text));
}

function describedFrom(parsed: { scores: FolderScore[]; source: string | null }): Described {
  const byPath = new Map(parsed.scores.map((score) => [score.file, score]));
  const byName = new Map<string, FolderScore | null>();
  for (const score of parsed.scores) {
    const name = score.file.slice(score.file.lastIndexOf('/') + 1);
    byName.set(name, byName.has(name) ? null : score);
  }
  return { source: parsed.source, byPath, byName };
}

/**
 * The row for one file the walk found, described by the manifest when it can be.
 *
 * `file` is overwritten with the path this file is *actually* at, not the
 * manifest's own copy of it — `addFromFolder` descends this field to fetch the
 * bytes, so the two have to agree. (An older build kept the manifest's path
 * here instead, which is exactly the mismatch `addFromFolder`'s filename
 * fallback exists to paper over for a listing stored back then.)
 */
function decorate(
  path: string,
  name: string,
  described: Described | null,
  manifestRoot: string,
): FolderScore {
  if (described === null) return bareScore(path, name);
  const key =
    manifestRoot !== '' && path.startsWith(manifestRoot) ? path.slice(manifestRoot.length) : path;
  const row = described.byPath.get(key) ?? described.byPath.get(path) ?? described.byName.get(name);
  return row ? { ...row, file: path } : bareScore(path, name);
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

/**
 * Folders this page is allowed to read *right now*, by id.
 *
 * The distinction between this and `connected` above is the whole of fault 1.
 * `connected` holds every file of a folder that was walked during this visit —
 * it is what a fresh pick produces, and producing it for the owner's archive
 * means enumerating 37,261 entries. This holds one object per folder and is
 * produced by asking Chrome a question, so it costs nothing and can be had on
 * every launch.
 *
 * Both mean "Add can work". Neither is storage: a handle survives in IndexedDB,
 * the *permission* on it does not, and this map is where the answer to
 * "permission, now" lives for the life of the page.
 */
const opened = new Map<string, DirectoryHandle>();

/** True when a score can be fetched out of this folder without picking it again. */
function folderUsable(id: string): boolean {
  return connected.has(id) || opened.has(id);
}

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

/** One file out of a directory, or null when it is not there. */
async function fileIn(dir: FileSystemDirectoryHandle, name: string): Promise<File | null> {
  try {
    return await (await dir.getFileHandle(name)).getFile();
  } catch {
    return null;
  }
}

/**
 * How many of the root's folders are looked inside for a manifest.
 *
 * The manifest is at the top of the folder that was packed, so the first
 * question — `getFileHandle('library.json')` on the root — answers it for
 * anyone who picked the right folder. The second question exists because the
 * phone's own unzip puts the archive's folder *inside* a folder of the same
 * name (Samsung's Extract does), and the person, told to pick
 * `pianopath-library`, picks the outer one. That case has exactly one child
 * folder. The ceiling is what stops a wrong folder of six hundred directories
 * turning the cheap probe into six hundred round trips.
 */
const MANIFEST_PROBE_DIRS = 24;

/** The folder's own index, if it has one, and where its paths are relative to. */
async function findManifest(
  handle: DirectoryHandle,
): Promise<{ file: File; root: string } | null> {
  const atRoot = await fileIn(handle, MANIFEST_NAME);
  if (atRoot) return { file: atRoot, root: '' };
  let looked = 0;
  try {
    for await (const entry of handle.values()) {
      if (entry.kind !== 'directory') continue;
      looked += 1;
      if (looked > MANIFEST_PROBE_DIRS) break;
      const nested = await fileIn(entry, MANIFEST_NAME);
      if (nested) return { file: nested, root: entry.name + '/' };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * The listing, from the manifest alone.
 *
 * This is the whole of the change. One file read, one parse, and 37,261 rows —
 * against a walk of 37,261 directory entries that Chromium's own intent-to-ship
 * says can make the browser unresponsive. Nothing in the tree is touched: each
 * row already carries the path to its file (`manifest.py` writes
 * `<shard>/<cid>.mxl`), which is exactly what `Add` descends when it wants the
 * bytes, so there is nothing the walk would have found out.
 *
 * The paths are rewritten to be relative to the folder that was *picked* rather
 * than to the manifest, which is the same correction `decorate` makes on the
 * walk path and for the same reason: those two are the only ways `score.file`
 * is ever produced, and `fileAt` descends it from the picked folder.
 */
async function manifestLibrary(
  id: string,
  parsed: { scores: FolderScore[]; source: string | null },
  root: string,
  options: FolderReadOptions,
): Promise<FolderReading> {
  checkCancelled(options.signal);
  const scores: FolderScore[] = [];
  const total = parsed.scores.length;
  for (const row of parsed.scores) {
    const file = root + row.file;
    scores.push(root === '' ? row : { ...row, file });
    const done = scores.length;
    options.onProgress?.({ done, total, file, found: done, phase: 'listing' });
    if (done % YIELD_EVERY === 0) {
      checkCancelled(options.signal);
      await yieldToUI();
    }
  }
  scores.sort(byTitle);
  return {
    id,
    addedAt: new Date().toISOString(),
    source: parsed.source,
    scores,
    count: scores.length,
    connected: true,
    listedFrom: 'manifest',
    pending: [],
    canOpen: false,
    rememberNote: null,
  };
}

/**
 * The walk, in a worker, with the same walk on this thread as the fallback.
 *
 * Everything the worker needs is either serializable or a constant, so the
 * boundary is one message each way plus progress. `FileSystemDirectoryHandle`
 * is transferable in Chromium, which is where this feature exists at all; a
 * browser that refuses to post one, or has no module workers, runs the very
 * same `walkFolder` here — slower, because it is sharing the thread that
 * paints, but identical in what it produces.
 */
async function runWalk(
  handle: DirectoryHandle,
  only: string[] | undefined,
  on: (message: WalkMessage) => void,
  signal: AbortSignal | undefined,
): Promise<void> {
  const request = {
    handle,
    manifestName: MANIFEST_NAME,
    scoreExtensions: [...SCORE_SUFFIXES],
    maxFiles: MAX_FOLDER_FILES,
    ...(only === undefined ? {} : { only }),
  } satisfies WalkRequest;

  const here = async (): Promise<void> => {
    await walkFolder(request, on, {
      stopped: () => signal?.aborted === true,
      breathe: yieldToUI,
    });
    checkCancelled(signal);
  };

  if (typeof Worker !== 'function') return here();
  let worker: Worker;
  try {
    worker = new Worker(new URL('./folderWalk.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return here();
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const stop = (): void => {
        signal?.removeEventListener('abort', onAbort);
        worker.terminate();
      };
      // Cancel is a message now rather than a flag read between blocking hops,
      // so it lands the moment it is pressed instead of at the next check.
      const onAbort = (): void => {
        stop();
        reject(new FolderCancelled());
      };
      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener('abort', onAbort, { once: true });
      worker.onmessage = (event: MessageEvent<WalkMessage>): void => {
        const message = event.data;
        if (message.kind === 'failed') {
          stop();
          reject(new FolderError(message.message));
          return;
        }
        on(message);
        if (message.kind === 'done') {
          stop();
          resolve();
        }
      };
      // A worker that cannot start, or cannot be given the handle, is not a
      // failed import: it is this thread's job after all.
      worker.onerror = (): void => {
        stop();
        void here().then(resolve, reject);
      };
      try {
        worker.postMessage(request);
      } catch {
        stop();
        void here().then(resolve, reject);
      }
    });
  } finally {
    worker.terminate();
  }
}

/**
 * How often a walk in progress is written down, in milliseconds.
 *
 * The reason it is written down at all: the owner's folder is 37,261 files and
 * a phone is free to kill a backgrounded page at any moment. A walk that only
 * existed in memory had to be started again from nothing, having shown nothing,
 * however far it had got — which on the one folder this is built for is the
 * difference between an interruption and a wasted several minutes.
 *
 * Not more often than this, because each save clones the whole listing. Not
 * less, because the gap is what is lost.
 */
const SAVE_EVERY_MS = 4000;

/**
 * The listing, by walking — for a folder with no manifest, and for a rescan.
 *
 * Incremental, resumable and cancellable, which the old walk was none of:
 *
 *   - rows are written to the database as each top-level folder finishes, so
 *     browsing can start on what is already indexed and a phone that kills the
 *     app keeps every one of them;
 *   - what is left is written down beside them, so the next run can be asked
 *     for exactly that and nothing is walked twice;
 *   - cancelling keeps what was found rather than throwing it away, which is
 *     what makes Cancel something other than a way to lose four minutes.
 */
async function walkLibrary(
  id: string,
  handle: DirectoryHandle,
  described: Described | null,
  manifestRoot: string,
  options: FolderReadOptions,
): Promise<FolderReading> {
  const seed = options.resume?.scores ?? [];
  const scores: FolderScore[] = [...seed];
  const have = new Set(scores.map((score) => score.file));
  const remaining = new Set(options.resume?.branches ?? []);
  let branches = 0;
  let branchesDone = 0;
  let deeperManifest: string | null = null;
  // Read through a call rather than directly: the compiler cannot see that the
  // walk's callback ran, so it would hold `deeperManifest` at the `null` it was
  // declared with and narrow the check below to nothing.
  const manifestSeen = (): string | null => deeperManifest;
  // Negative, so the *first* folder finished is written down at once rather
  // than four seconds in. The gap at the start is the one that matters: it is
  // where "I pointed it at the folder and it showed nothing" lives.
  let savedAt = -Infinity;
  // Chained rather than awaited: the message handler is synchronous, and two
  // overlapping writes of the same row would be a race over which snapshot
  // wins. One after another, oldest first.
  let saving: Promise<unknown> = Promise.resolve();

  const snapshot = (listedFrom: FolderListing): FolderReading => ({
    id,
    addedAt: new Date().toISOString(),
    source: described?.source ?? null,
    scores: [...scores].sort(byTitle),
    count: scores.length,
    connected: true,
    listedFrom,
    // Only a partial listing owes anything. A branch the resumed walk never saw
    // — one that was deleted while the app was closed — would otherwise sit in
    // `remaining` for ever and leave a finished listing claiming it had work
    // left to do.
    pending: listedFrom === 'partial' ? [...remaining] : [],
    canOpen: false,
    rememberNote: null,
  });

  /**
   * How far into `scores` the last partial save got.
   *
   * `scores` is in discovery order and only ever grows — the sort happens in
   * `snapshot`, on a copy — so this is a stable pointer at the rows that have
   * already been written down, and a save writes the ones after it and no
   * others. That is the difference between a walk of the archive writing
   * thirty-seven thousand rows once and writing them sixty times over.
   */
  let written = 0;

  const save = (listedFrom: FolderListing): void => {
    savedAt = performance.now();
    const partial = snapshot(listedFrom);
    const fresh = scores.slice(written);
    written = scores.length;
    // Chained onto whatever is already in flight: a partial save is a
    // side effect of a message handler, and two of them overlapping would race
    // over which index wins.
    // Whatever handle is already being kept for this folder, so a phone that
    // kills the app mid-walk still has something for the resumed run to walk
    // *through* — that is the one case where nothing later can put it right.
    saving = saving.then(() => saveProgress(partial, fresh, handles.get(id)));
  };

  const on = (message: WalkMessage): void => {
    switch (message.kind) {
      case 'plan':
        branches = message.branches.length;
        // A resumed run is told which folders to walk; a fresh one owes itself
        // all of them.
        if (options.resume === undefined) {
          for (const name of message.branches) remaining.add(name);
        }
        options.onProgress?.({
          done: 0,
          total: branches,
          file: '',
          found: scores.length,
          phase: branches === 0 ? 'counting' : 'indexing',
        });
        return;
      case 'manifest':
        deeperManifest = message.path;
        return;
      case 'found':
        for (const path of message.paths) {
          if (have.has(path)) continue;
          have.add(path);
          scores.push(decorate(path, path.slice(path.lastIndexOf('/') + 1), described, manifestRoot));
        }
        branchesDone = message.branchesDone;
        options.onProgress?.({
          done: branchesDone,
          total: message.branches,
          file: message.file,
          found: scores.length,
          phase: message.branches === 0 ? 'counting' : 'indexing',
        });
        return;
      case 'branch':
        remaining.delete(message.name);
        branchesDone = message.branchesDone;
        branches = message.branches;
        options.onProgress?.({
          done: branchesDone,
          total: branches,
          file: '',
          found: scores.length,
          phase: 'indexing',
        });
        // Written down at a point the walk can be picked up from — the end of a
        // top-level folder — and no more often than the clock allows.
        if (performance.now() - savedAt >= SAVE_EVERY_MS) save('partial');
        return;
      default:
        return;
    }
  };

  try {
    await runWalk(handle, options.resume?.branches, on, options.signal);
  } catch (cause) {
    // A cancelled walk keeps what it found. The alternative — and what this
    // used to do — is that pressing Cancel after four minutes leaves nothing
    // at all, which makes Cancel a button nobody can afford to press.
    if (cause instanceof FolderCancelled && scores.length > 0) {
      save('partial');
      await saving;
    }
    throw cause;
  }
  await saving;

  // A manifest deeper than the probe looks. Rare — the phone's unzip nests one
  // level and that is probed directly — but a walk has been done anyway, so
  // using what it saw costs one file read and saves a listing of hashes.
  //
  const deeper = manifestSeen();
  if (described === null && deeper !== null) {
    const file = await fileAt(handle, deeper);
    if (file) {
      const late = describedBy(await file.text());
      const root = deeper.slice(0, deeper.length - MANIFEST_NAME.length);
      for (let at = 0; at < scores.length; at += 1) {
        const score = scores[at];
        if (!score) continue;
        scores[at] = decorate(
          score.file,
          score.file.slice(score.file.lastIndexOf('/') + 1),
          late,
          root,
        );
      }
      return { ...snapshot('walk'), source: late.source };
    }
  }

  if (scores.length === 0) {
    throw new FolderError(
      'That folder has no MusicXML in it. The app reads .mxl, .musicxml and .xml files; a PDF goes through Import instead.',
    );
  }
  return snapshot('walk');
}

/**
 * Reads a folder the browser handed over as a handle rather than as files.
 *
 * The manifest is asked for first and the tree is not touched when there is
 * one. That is the reversal: the folder's own index decides what is listed,
 * and the files are consulted one at a time, when one of them is wanted.
 */
export async function readFolderHandle(
  handle: DirectoryHandle,
  options: FolderReadOptions = {},
): Promise<FolderReading> {
  const id = handle.name || 'Scores';
  // The probe is a couple of round trips either way, so it is worth making even
  // when a rescan is going to walk anyway: it is what gives the walked rows
  // their titles without the walk having to find the manifest itself.
  const found = await findManifest(handle);
  checkCancelled(options.signal);
  // Read through it, so it is open for the rest of this visit whatever the
  // remember setting says. `remember` decides whether the handle is *kept*;
  // being able to add from the folder that was just picked is not a reward for
  // a setting.
  opened.set(id, handle);
  const parsed = found === null ? null : parseManifest(await found.file.text());
  checkCancelled(options.signal);
  // An index that describes nothing is not an index. A manifest whose rows all
  // dropped out, or one written for an empty folder, falls through to the walk
  // rather than leaving the owner with a folder the app says is empty.
  if (parsed !== null && parsed.scores.length > 0 && options.rescan !== true && options.resume === undefined) {
    return manifestLibrary(id, parsed, found?.root ?? '', options);
  }
  const described = parsed === null ? null : describedFrom(parsed);
  return walkLibrary(id, handle, described, found?.root ?? '', options);
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
 * The handle for a folder, from this session or from the database.
 *
 * Cached into `handles` on the way past, because the interactive caller below
 * is inside a click and `requestPermission` wants the user activation that
 * click carries. An IndexedDB round trip is short, but it is a round trip
 * standing between the tap and the ask, and there is no reason to pay it twice.
 */
async function storedHandle(id: string): Promise<DirectoryHandle | null> {
  const held = handles.get(id);
  if (held !== undefined) return held as DirectoryHandle;
  const db = await openDatabase();
  const row = await db?.get('folderLibraries', id);
  if (row?.handle === undefined) return null;
  handles.set(id, row.handle);
  return row.handle as DirectoryHandle;
}

/**
 * What happened when the folder was asked to open. Each wants a different
 * sentence and a different button, which is why this is five values and not a
 * boolean.
 */
export type FolderOpenResult =
  /** Usable now — either it already was, or permission was there for the asking. */
  | 'open'
  /** There is no handle to open. The picker is the only way back. */
  | 'no-handle'
  /** A handle, and Chrome will not grant read on it. Asking again can still work. */
  | 'permission'
  /** A handle that no longer points at a readable folder. */
  | 'stale';

/**
 * Touches the folder without walking it.
 *
 * One entry is enough to know a handle still resolves: a folder that was moved,
 * renamed, or is on a card that is out throws on the first `values()` step. The
 * point is that it is O(1) — the old check read every one of the owner's 37,261
 * files to decide whether the folder was there.
 */
async function folderStillThere(handle: DirectoryHandle): Promise<boolean> {
  try {
    // `break` on the first entry, so an empty folder and a folder of 37,261
    // cost the same. An empty one is not a failure here: it may genuinely have
    // been emptied, and `Add` will say so per row with the rescan on offer.
    for await (const entry of handle.values()) {
      void entry;
      break;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Makes a saved folder usable again, **without re-reading it**.
 *
 * This is the transition the screen never had. Re-granting access used to mean
 * `showDirectoryPicker` and a walk of every file in the folder, which for the
 * owner's archive is thirty-seven thousand of them and several minutes — to
 * rebuild a listing that was already sitting in IndexedDB, complete. Nothing
 * about the listing changes when permission comes back; only whether the files
 * behind it can be opened. So this asks that one question and stops.
 *
 * `interactive` is the difference between the launch path and the button path.
 * `queryPermission` is free and needs no gesture, so it runs on every visit and
 * a phone that kept the permission is simply usable with no taps at all — which
 * is what "I thought the whole point was that it had access" was asking for.
 * `requestPermission` shows Chrome's prompt and needs a user gesture, so it only
 * runs from a tap.
 */
export async function openFolder(
  id: string,
  options: { interactive?: boolean } = {},
): Promise<FolderOpenResult> {
  if (folderUsable(id)) return 'open';
  const handle = await storedHandle(id);
  // No handle is not a failure of the feature — it is the ordinary picker
  // path, which has its own sentence — so nothing is recorded here.
  if (!handle) return 'no-handle';
  // Asked separately from the read, because the two fail for different
  // reasons and the owner is told which. `requestPermission` needs a user
  // gesture and throws without one — a phone that has let the activation
  // lapse is a permission problem, not a folder that has gone missing, and
  // "pick it again" is the wrong instruction for it.
  let permission: PermissionState;
  try {
    permission = options.interactive
      ? await readPermission(handle)
      : ((await handle.queryPermission?.({ mode: 'read' })) ?? 'granted');
  } catch {
    permission = 'denied';
  }
  if (permission !== 'granted') {
    // A `prompt` answer to a question nobody has asked yet is not a refusal —
    // it is the ordinary state of a stored handle at launch. Recording it as
    // one would put "Chrome will not open it without permission" on the screen
    // every single launch, before the owner had been offered the prompt.
    if (options.interactive) {
      notes.set(id, 'permission');
      notify();
    }
    return 'permission';
  }
  if (!(await folderStillThere(handle))) {
    // A handle can go stale: the folder was moved, the card was pulled, the
    // permission was revoked in Chrome's settings. The picker still works —
    // but silently falling back to it is what left the owner guessing, so the
    // reason is recorded and the screen says it.
    notes.set(id, 'stale');
    notify();
    return 'stale';
  }
  opened.set(id, handle);
  notes.set(id, null);
  notify();
  return 'open';
}

/**
 * Reconnects a folder from its stored handle, if there is one and it is
 * allowed. `false` means the caller should ask for the folder again — which is
 * the behaviour with no handle at all, and the reason nothing here throws.
 */
export async function reconnectFolder(id: string): Promise<boolean> {
  return (await openFolder(id, { interactive: true })) === 'open';
}

/**
 * One file out of an open folder, by the path the listing stored.
 *
 * Walking down the path is the counterpart to not walking the tree: `Add`
 * wants exactly one of 37,261 files, and the old code got it by opening all of
 * them first. `score.file` is the path relative to the folder that was picked —
 * `buildLibrary` writes the walk's own key into that field precisely so the two
 * agree — so descending it is a handful of round trips whatever the folder's
 * size.
 */
async function fileAt(handle: DirectoryHandle, path: string): Promise<File | null> {
  const parts = path.split('/').filter(Boolean);
  const name = parts.pop();
  if (name === undefined) return null;
  try {
    let dir: FileSystemDirectoryHandle = handle;
    for (const part of parts) dir = await dir.getDirectoryHandle(part);
    return await (await dir.getFileHandle(name)).getFile();
  } catch {
    return null;
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
): Promise<FolderReading> {
  const { remember, ...readOptions } = options;
  // The picker whenever the browser has one — not only when the folder is to be
  // remembered.
  //
  // These were one decision and they are two. `remember` is about whether the
  // handle is *kept*; the picker is about how the folder is *read*. Tying them
  // together meant that with the setting off — which is the default — every
  // import went through the file input instead, and that is a different path in
  // every way that matters: it hands over all 37,261 files at once rather than
  // enumerating them, and it cannot use the worker, so the walk that was moved
  // off the main thread was still on it for the one person this is built for.
  if (directoryPickerAvailable()) {
    const picker = (window as unknown as PickerWindow).showDirectoryPicker;
    try {
      const handle = await picker?.({ mode: 'read' });
      if (handle) {
        // Kept before the read rather than after it. A walk writes down what it
        // has found every few seconds so that an interrupted one can be
        // finished, and a save that did not carry the handle would leave the
        // resumed run with nothing to resume *through* — the one case where
        // this matters is the one where the app was killed, which is exactly
        // when nothing later gets a chance to put it right.
        if (remember === true) handles.set(handle.name || 'Scores', handle);
        const library = await readFolderHandle(handle, readOptions);
        // Whether the handle actually reached the database is the whole
        // difference between "remembered" and "remembered until you close
        // the app", and nothing used to say which of the two had happened.
        //
        // Only asked when the owner asked for it. Reading through the picker is
        // this app's business; keeping a handle to the owner's files is theirs.
        if (remember !== true) {
          await saveFolder(library);
          notes.set(library.id, 'not-remembered');
          return { ...library, rememberNote: 'not-remembered', canOpen: false };
        }
        const stored = await saveFolder(library, handle);
        const note: FolderRememberNote = stored ? null : 'not-stored';
        notes.set(library.id, note);
        return { ...library, rememberNote: note, canOpen: stored };
      }
    } catch (cause) {
      // A dismissed picker is a decision, not a failure: opening a second one
      // behind it would be the app arguing with him.
      if (isAbort(cause)) throw new FolderCancelled();
      if (cause instanceof FolderError || cause instanceof FolderCancelled) throw cause;
    }
  }
  // Here because the browser has no picker, or because the picker did not
  // work. Either way it is the same folder listing through a slower door.
  return pickFolderWithInput(readOptions, remember === true ? 'not-remembered' : null);
}

/**
 * Walks a folder the app already holds a handle for, without the picker.
 *
 * The two reasons to walk are both here. **Rescan** is the owner saying the
 * folder itself has changed — a score added since the manifest was written, or
 * one deleted — and it is the only thing that can find either. **Resume** is an
 * indexing run that was cancelled or killed, picked up from the folders it had
 * not reached, so 37,261 files are never walked twice.
 *
 * Going through the picker for this was the old shape and it was wrong twice
 * over: it asked the owner to find a folder the app can already read, and it
 * threw away the handle's permission to do it.
 */
export async function rescanFolder(
  id: string,
  options: { remember?: boolean; resume?: boolean } & Omit<FolderReadOptions, 'rescan' | 'resume'> = {},
): Promise<FolderReading> {
  const { remember, resume, ...readOptions } = options;
  // The permission first, and separately, because it fails for its own reasons
  // and each of them has its own cure.
  const state = await openFolder(id, { interactive: true });
  const handle = opened.get(id);
  if (state !== 'open' || !handle) {
    throw new FolderError(
      state === 'permission'
        ? `Chrome would not open the ${id} folder. Open it and allow the prompt, then try again.`
        : state === 'stale'
          ? `The ${id} folder could not be read — it may have been moved, renamed, or on a card that is out. Pick the folder again.`
          : `This phone kept no link to ${id}. Pick the folder again to read it.`,
      state === 'permission' ? 'open' : 'pick',
    );
  }
  let carry: FolderReadOptions['resume'];
  if (resume === true) {
    const db = await openDatabase();
    const row = await db?.get('folderLibraries', id);
    const branches = row?.pending ?? [];
    // Nothing left to finish is not a failure and not a reason to walk the
    // whole folder by surprise: the listing is simply already complete.
    if (branches.length > 0) carry = { branches, scores: await allFolderScores(id) };
  }
  const library = await readFolderHandle(handle, {
    ...readOptions,
    ...(carry === undefined ? { rescan: true } : { resume: carry }),
  });
  // Whatever handle policy is already in force stays in force: a rescan is not
  // a moment to start keeping the owner's folder, nor to stop.
  const keep = handles.has(id) ? handles.get(id) : remember === true ? handle : undefined;
  const stored = await saveFolder(library, keep);
  return { ...library, canOpen: stored || handles.has(id), rememberNote: notes.get(id) ?? null };
}

async function pickFolderWithInput(
  options: FolderReadOptions = {},
  note: FolderRememberNote = null,
): Promise<FolderReading> {
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
    notes.set(library.id, note);
    return { ...library, rememberNote: note, canOpen: false };
  } finally {
    input.remove();
  }
}

/* ------------------------------------------------------------------------ *
 * Storage.
 *
 * One record per score, keyed `[folder, file]`, with a compact per-folder
 * index beside it — see `db.ts` for the shapes and why. Three rules run
 * through everything below.
 *
 *   - **One transaction.** IndexedDB's cost is transactions, not bytes: a
 *     thousand inserts one per transaction is a couple of seconds, and the
 *     same thousand in one transaction is under a tenth of that. So a listing
 *     is written in a single `readwrite` over all three stores, and the puts
 *     inside it are queued rather than awaited one at a time.
 *   - **Read by key range, not by cursor.** `getAllKeys` over
 *     `[id, ''] … [id, []]` is one round trip for every path this folder
 *     knows; stepping a cursor is one per row.
 *   - **A one-row change writes one row.** Marking a score gone touches its
 *     own record and the folder's small row, and leaves the index alone —
 *     which is what `FolderLibraryRow.missing` is for.
 * ------------------------------------------------------------------------ */

/** Read and written together, so they cannot disagree after a crash. */
const LISTING_STORES = ['folderLibraries', 'folderScores', 'folderIndexes'] as const;

/**
 * Everything this folder has a record for, listable or marked gone.
 *
 * `[]` as the upper bound rather than `'￿'`: IndexedDB sorts arrays after
 * every string, so this is the only bound that is genuinely above all of them
 * — a path containing an astral character would sit above `'￿'`.
 */
function rangeFor(id: string): IDBKeyRange {
  return IDBKeyRange.bound([id, ''], [id, []]);
}

function toRow(folder: string, score: FolderScore): FolderScoreRow {
  return { ...score, folder, sort: fold(score.title || score.file) };
}

/**
 * How many puts are queued before one is awaited.
 *
 * Not a batch — every put in the loop is part of the same transaction either
 * way, which is where the speed comes from. This only bounds how many pending
 * promises are alive at once, so writing the owner's 37,261 does not also hold
 * 37,261 promise objects.
 */
const QUEUE_DEPTH = 500;

async function putScores(
  put: (row: FolderScoreRow) => Promise<unknown>,
  id: string,
  scores: readonly FolderScore[],
): Promise<void> {
  let queued: Promise<unknown>[] = [];
  for (const score of scores) {
    queued.push(put(toRow(id, score)));
    if (queued.length >= QUEUE_DEPTH) {
      await Promise.all(queued);
      queued = [];
    }
  }
  await Promise.all(queued);
}

/** A dictionary id for a low-cardinality column, growing the dictionary. */
function idFor(names: string[], ids: Map<string, number>, value: string): number {
  const found = ids.get(value);
  if (found !== undefined) return found;
  // 65,535 distinct styles is not a folder, it is a corrupt manifest; past
  // that everything files under the first value rather than the column
  // silently wrapping round to the wrong one.
  if (names.length > 0xffff) return 0;
  const next = names.length;
  names.push(value);
  ids.set(value, next);
  return next;
}

/**
 * The parallel arrays the browse screen filters over, built once per scan.
 *
 * About two megabytes for the owner's 37,261 against the forty-odd the full
 * rows cost, and that ratio is the whole point: this is what opening the
 * screen reads, and the rows are read only for what is about to be drawn.
 */
export function buildFolderIndex(id: string, scores: readonly FolderScore[]): FolderIndexRow {
  const size = scores.length;
  const files = new Array<string>(size);
  const haystacks = new Array<string>(size);
  const letters = new Array<string>(size);
  const levels = new Float64Array(size);
  const styles = new Uint16Array(size);
  const statuses = new Uint16Array(size);
  const rated = new Uint8Array(size);
  const styleNames: string[] = [];
  const styleIds = new Map<string, number>();
  const statusNames: string[] = [];
  const statusIds = new Map<string, number>();
  let unnamed = 0;
  for (let at = 0; at < size; at += 1) {
    const score = scores[at];
    if (!score) continue;
    files[at] = score.file;
    haystacks[at] = fold(`${score.title} ${score.composer}`);
    letters[at] = letterFor(score.title || score.file);
    // `NaN` rather than 0: a score with no level is not a score at level 0,
    // and a level filter must not hide it (see `matchesFilters`).
    levels[at] = score.level ?? Number.NaN;
    styles[at] = idFor(styleNames, styleIds, score.style);
    statuses[at] = idFor(statusNames, statusIds, score.status);
    rated[at] = score.rating >= 4 && score.ratings >= 5 ? 1 : 0;
    if (looksUnnamed(score.title)) unnamed += 1;
  }
  return {
    id,
    files,
    haystacks,
    // One string of `size` characters rather than `size` one-character
    // strings: `letters[i]` reads the same either way and this is a fortieth
    // of the clone.
    letters: letters.join(''),
    levels,
    styleNames,
    styles,
    statusNames,
    statuses,
    rated,
    unnamed,
  };
}

/** The folder's own small row, without the handle, which is written apart. */
function metaOf(library: FolderLibrary, count: number, missing: string[]): FolderLibraryRow {
  return {
    id: library.id,
    addedAt: library.addedAt,
    source: library.source,
    count,
    // Where the listing came from, and what it still owes. Stored rather than
    // worked out again on the next launch, because neither is knowable from the
    // rows: a listing of 37,261 titles looks the same whether it was read out
    // of the manifest in one go or walked, and only this says which — which is
    // what the screen needs to tell the owner what the listing cannot see.
    listedFrom: library.listedFrom,
    ...(library.pending.length === 0 ? {} : { pending: library.pending }),
    ...(missing.length === 0 ? {} : { missing }),
  };
}

/**
 * The handle, in a transaction of its own.
 *
 * Apart from the listing deliberately. A browser that will not
 * structured-clone a `FileSystemDirectoryHandle` throws, and when the handle
 * rode along with the rows that throw aborted the write of the whole listing
 * — so the fallback had to write all of it a second time. Separate, a refused
 * handle costs one small failed put and nothing else.
 */
async function putHandle(id: string, handle: unknown): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const row = await db.get('folderLibraries', id);
    if (!row) return false;
    await db.put('folderLibraries', { ...row, handle });
    return true;
  } catch {
    return false;
  }
}

/** Remembers a handle for this session, whatever the database does with it. */
function holdHandle(id: string, handle: unknown): void {
  handles.set(id, handle);
  // Just came back from the picker, so permission is granted by definition.
  // Recording it here is what lets a folder picked this session be reopened
  // after a reload without another trip through the picker.
  opened.set(id, handle as DirectoryHandle);
}

/**
 * Writes a finished listing — **diffing it**, not replacing it.
 *
 * A rescan used to hand the whole new array to one `put`, which meant every
 * row was rewritten whether or not anything about it had changed, and a row
 * whose file had gone simply vanished along with anything the app had learnt
 * about it. Now: paths that are still there are written with whatever the scan
 * knows (which clears any `missingAt` on them), paths the scan did not see are
 * *marked* rather than deleted, and the index is rebuilt from what is listable.
 *
 * Returns whether the *handle* survived. The listing always does.
 */
async function saveFolder(library: FolderReading, handle?: unknown): Promise<boolean> {
  if (handle !== undefined) holdHandle(library.id, handle);
  const db = await openDatabase();
  if (!db) {
    notify();
    return false;
  }
  const id = library.id;
  const scores = library.scores;
  try {
    const tx = db.transaction(LISTING_STORES, 'readwrite');
    const rows = tx.objectStore('folderScores');
    // One round trip for every path this folder knows — keys only, so it is
    // the paths and not the forty megabytes hanging off them.
    const known = new Set((await rows.getAllKeys(rangeFor(id))).map(([, file]) => file));
    const seen = new Set(scores.map((score) => score.file));
    await putScores((row) => rows.put(row), id, scores);
    const at = new Date().toISOString();
    for (const file of known) {
      if (seen.has(file)) continue;
      const old = await rows.get([id, file]);
      // Marked, not deleted. A rescan run with the card out would otherwise
      // throw the listing away, and a file that comes back should come back as
      // the row it was.
      if (old && old.missingAt === undefined) await rows.put({ ...old, missingAt: at });
    }
    await tx.objectStore('folderIndexes').put(buildFolderIndex(id, scores));
    const folders = tx.objectStore('folderLibraries');
    const existing = await folders.get(id);
    await folders.put({
      ...metaOf(library, scores.length, []),
      // The handle is written apart, so carrying it across is this write's job.
      ...(existing?.handle === undefined ? {} : { handle: existing.handle }),
    });
    await tx.done;
  } catch {
    // Storage refused the listing. The session still works from memory, and
    // saying nothing here is what the app has always done with a failed write.
    notify();
    return false;
  }
  const stored = handle === undefined ? false : await putHandle(id, handle);
  notify();
  return stored;
}

/**
 * Writes down what an unfinished walk has found so far.
 *
 * Only the rows it has not written before, which is the whole difference: a
 * walk of the owner's folder saves every few seconds, and each save used to
 * clone the entire growing listing — a hundred-odd megabytes written over one
 * walk to record thirty-seven thousand rows once. Nothing is marked missing
 * here, because a folder that has not been walked yet is not a folder whose
 * files have gone.
 */
async function saveProgress(
  library: FolderReading,
  fresh: readonly FolderScore[],
  handle?: unknown,
): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    notify();
    return;
  }
  try {
    const tx = db.transaction(LISTING_STORES, 'readwrite');
    const rows = tx.objectStore('folderScores');
    await putScores((row) => rows.put(row), library.id, fresh);
    await tx.objectStore('folderIndexes').put(buildFolderIndex(library.id, library.scores));
    const folders = tx.objectStore('folderLibraries');
    const existing = await folders.get(library.id);
    await folders.put({
      ...metaOf(library, library.scores.length, existing?.missing ?? []),
      ...(existing?.handle === undefined ? {} : { handle: existing.handle }),
    });
    await tx.done;
  } catch {
    // Nothing to do about it, and a partial save that fails must not stop the
    // walk it is a side effect of.
  }
  // Only when it is not already down: the handle is the one thing a walk that
  // is killed cannot rebuild, and writing it every four seconds for the rest
  // of the walk would be a structured clone of a browser object for nothing.
  if (handle !== undefined && !(await hasStoredHandle(library.id))) {
    await putHandle(library.id, handle);
  }
  notify();
}

/**
 * Every saved listing, **most recently picked first**.
 *
 * The order matters because the screen shows one of them. `getAll` hands rows
 * back in key order, and the key is the folder's own name — so a `Download`
 * picked once by mistake sorted ahead of `pianopath-library` and became the
 * folder the app showed on every launch from then on, with the archive
 * invisible and the only Forget button pointed at the wrong one. Whatever the
 * owner reached for last is the one they meant.
 */
export async function savedFolders(): Promise<FolderLibrary[]> {
  const db = await openDatabase();
  // Small rows now — a folder's name, its date and half a dozen fields. This
  // one call used to deserialize every score in every folder the owner had
  // ever picked, which on the archive is some forty megabytes, before the
  // screen had drawn anything at all.
  const rows = (await db?.getAll('folderLibraries')) ?? [];
  // `?? ''` because this decides what the screen shows: a row from some older
  // build with no date must cost the owner its place in the order, not the
  // whole listing and the screen with it.
  rows.sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''));
  // Built field by field rather than spread: a stored row also carries the
  // handle, and a live browser object has no business travelling out of here
  // inside something a screen draws.
  return rows.map((row) => ({
    id: row.id,
    addedAt: row.addedAt,
    source: row.source,
    // `scores?.length` for a row an older build wrote, which still holds the
    // whole listing inline and has not been split yet — the count has to be
    // right before `folderIndex()` gets round to splitting it, or the screen
    // says "0 scores" over a folder it is about to list in full.
    count: row.count ?? row.scores?.length ?? 0,
    connected: folderUsable(row.id),
    // A row written before any of this was walked, because the walk was the
    // only way a listing was ever made.
    listedFrom: row.listedFrom ?? 'walk',
    pending: row.pending ?? [],
    canOpen: opened.has(row.id) || handles.has(row.id) || row.handle !== undefined,
    rememberNote: notes.get(row.id) ?? null,
  }));
}

/**
 * The arrays the browse screen filters over, for one folder.
 *
 * This is what opening the screen reads: about two megabytes for the owner's
 * archive, against the forty the rows cost. `null` when the folder has no
 * listing at all.
 */
export type FolderIndex = Omit<FolderIndexRow, 'id'>;

export async function folderIndex(id: string): Promise<FolderIndex | null> {
  const db = await openDatabase();
  if (!db) return null;
  const stored = (await db.get('folderIndexes', id)) ?? (await adoptLegacyListing(id));
  if (!stored) return null;
  const missing = (await db.get('folderLibraries', id))?.missing ?? [];
  return missing.length === 0 ? stored : withoutFiles(stored, new Set(missing));
}

/**
 * Whether this folder's listing is still the old inline shape.
 *
 * Asked so the screen can say that the first open after an update has work to
 * do. Two small reads and no score records: the index either exists or it does
 * not, and a folder row that still carries `scores` is one that has never been
 * split. Silence during that split is the fault it is there to prevent — a
 * blank list for seconds, indistinguishable from the screen being broken.
 */
export async function needsAdopting(id: string): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  if (await db.get('folderIndexes', id)) return false;
  const row = await db.get('folderLibraries', id);
  return (row?.scores?.length ?? 0) > 0;
}

/**
 * Splits a listing an older build wrote inline, the first time it is opened.
 *
 * The alternative was to do it in the `upgrade` block, and that is worse than
 * it looks: a `versionchange` transaction holds every other connection to the
 * database shut while it runs, and rewriting 37,261 records inside one at
 * start-up is the blocked open `app/boot.ts` is written around — the failure
 * where the shell never mounts and the tab bar never exists. Here it happens
 * on the one screen that wants the listing, once, and everything it writes is
 * the ordinary shape afterwards. It is also the net under an upgrade that was
 * interrupted, and under a test or a tour that seeds the old shape directly.
 */
async function adoptLegacyListing(id: string): Promise<FolderIndexRow | null> {
  const db = await openDatabase();
  const row = await db?.get('folderLibraries', id);
  const scores = row?.scores;
  if (!db || !row || scores === undefined) return null;
  const index = buildFolderIndex(id, scores);
  try {
    const tx = db.transaction(LISTING_STORES, 'readwrite');
    const rows = tx.objectStore('folderScores');
    await putScores((entry) => rows.put(entry), id, scores);
    await tx.objectStore('folderIndexes').put(index);
    // `scores` goes, which is the point: the row is small from here on and
    // `savedFolders()` stops paying for it on every visit.
    const { scores: _dropped, ...rest } = row;
    await tx.objectStore('folderLibraries').put({ ...rest, count: scores.length });
    await tx.done;
  } catch {
    // The split did not stick — a full quota, most likely. The index is still
    // right for this session, and the next visit will try again.
  }
  return index;
}

/** The same index with some rows taken out, for the handful marked missing. */
function withoutFiles(index: FolderIndexRow, drop: ReadonlySet<string>): FolderIndex {
  const keep: number[] = [];
  for (let at = 0; at < index.files.length; at += 1) {
    const file = index.files[at];
    if (file !== undefined && !drop.has(file)) keep.push(at);
  }
  const size = keep.length;
  const levels = new Float64Array(size);
  const styles = new Uint16Array(size);
  const statuses = new Uint16Array(size);
  const rated = new Uint8Array(size);
  const files = new Array<string>(size);
  const haystacks = new Array<string>(size);
  let letters = '';
  for (let out = 0; out < size; out += 1) {
    const at = keep[out] ?? 0;
    files[out] = index.files[at] ?? '';
    haystacks[out] = index.haystacks[at] ?? '';
    letters += index.letters[at] ?? OTHER_LETTER;
    levels[out] = index.levels[at] ?? Number.NaN;
    styles[out] = index.styles[at] ?? 0;
    statuses[out] = index.statuses[at] ?? 0;
    rated[out] = index.rated[at] ?? 0;
  }
  // Rows that are gone cannot make the listing look like an archive whose
  // titles were never read, so the proportion is over what is left. Counting
  // the dropped ones exactly would mean reading their titles back; the tally
  // is only ever compared against a half, and what is dropped is a handful.
  const unnamed = Math.min(index.unnamed, size);
  return {
    files,
    haystacks,
    letters,
    levels,
    styleNames: index.styleNames,
    styles,
    statusNames: index.statusNames,
    statuses,
    rated,
    unnamed,
  };
}

/**
 * The full rows for the page that is about to be drawn, by key.
 *
 * Sixty `get`s in one transaction, which is one transaction's overhead and
 * sixty records — against the thirty-seven thousand that used to be in memory
 * so that sixty of them could be read off.
 */
export async function folderScoresAt(
  id: string,
  files: readonly string[],
): Promise<(FolderScore | undefined)[]> {
  const db = await openDatabase();
  if (!db || files.length === 0) return files.map(() => undefined);
  try {
    const tx = db.transaction('folderScores');
    const store = tx.objectStore('folderScores');
    const found = await Promise.all(files.map((file) => store.get([id, file])));
    await tx.done;
    return found;
  } catch {
    return files.map(() => undefined);
  }
}

/** The stored extras off a row, so what comes out is what went in. */
function fromRow(row: FolderScoreRow): FolderScore {
  const { folder: _folder, sort: _sort, missingAt: _missingAt, ...score } = row;
  return score;
}

/**
 * Every listable row of one folder.
 *
 * **The one reader that loads the whole listing, and the only one that has to.**
 * A walk that was cancelled or killed is resumed from what it had already
 * found, and "already found" is precisely these rows — the resumed run needs
 * them to know what not to walk again and to finish the listing it is half
 * way through. It costs what the old screen used to cost on every single
 * visit; it now happens when the owner taps Continue indexing, which is the
 * one moment the cost is what they asked for.
 */
export async function allFolderScores(id: string): Promise<FolderScore[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const rows = await db.getAll('folderScores', rangeFor(id));
    return rows.filter((row) => row.missingAt === undefined).map(fromRow);
  } catch {
    return [];
  }
}

/**
 * Which files in this folder are filed under each of these folded titles.
 *
 * The `byTitle` index earning its keep. The browse screen has to know which of
 * its rows are already in the library, and an import that arrived by share
 * carries no `origin` — so it is matched by title. That used to mean walking
 * all 37,261 rows on every visit to the screen; it is now one key-range seek
 * per import that needs one, of which there are as many as the owner has
 * imported by hand.
 */
export async function folderFilesByTitle(
  id: string,
  titles: readonly string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const db = await openDatabase();
  if (!db || titles.length === 0) return out;
  try {
    const tx = db.transaction('folderScores');
    const byTitle = tx.objectStore('folderScores').index('byTitle');
    await Promise.all(
      titles.map(async (title) => {
        const keys = await byTitle.getAllKeys(IDBKeyRange.only([id, title]));
        if (keys.length > 0) out.set(title, keys.map(([, file]) => file));
      }),
    );
    await tx.done;
  } catch {
    return out;
  }
  return out;
}

/**
 * How many rows of the listing sort before a letter — the A-to-Z rail's jump.
 *
 * A seek over the `byTitle` index rather than a walk of the listing: a folded
 * title beginning with `s` is exactly a row filed under S, so "where does S
 * start" is a count of the key range below it. `null` when the folder has no
 * index to seek — the caller then falls back to its in-memory arrays, which is
 * also what a filtered list has to do, since the stored order knows nothing
 * about the search box.
 */
export async function folderLetterOffset(id: string, letter: string): Promise<number | null> {
  const db = await openDatabase();
  if (!db) return null;
  // `#` is everything that is not a letter and it is not one range: digits and
  // punctuation sort below `a`, and anything above `z` sorts above it.
  if (letter < 'A' || letter > 'Z') return null;
  try {
    const byTitle = db.transaction('folderScores').objectStore('folderScores').index('byTitle');
    const below = await byTitle.count(IDBKeyRange.bound([id, ''], [id, letter.toLowerCase()], false, true));
    return below;
  } catch {
    return null;
  }
}

export async function forgetFolder(id: string): Promise<void> {
  const db = await openDatabase();
  if (db) {
    try {
      const tx = db.transaction(LISTING_STORES, 'readwrite');
      // The rows go with the folder. Deleting the folder's own row and leaving
      // thirty-seven thousand orphans behind would be the worst of both: the
      // screen shows nothing and the space is still gone.
      await tx.objectStore('folderScores').delete(rangeFor(id));
      await tx.objectStore('folderIndexes').delete(id);
      await tx.objectStore('folderLibraries').delete(id);
      await tx.done;
    } catch {
      // Nothing to do; the maps below are still cleared so the session agrees
      // with what the owner just asked for.
    }
  }
  connected.delete(id);
  handles.delete(id);
  opened.delete(id);
  notes.delete(id);
  notify();
}

/**
 * True when the *database* holds a handle for this folder.
 *
 * Deliberately not "or the session map holds one": the session map is gone
 * the moment the app is closed, and this question is only ever asked about
 * what will still be there on the next launch. The two differ exactly when
 * the clone failed, which is the case worth being able to see.
 */
export async function hasStoredHandle(id: string): Promise<boolean> {
  const db = await openDatabase();
  const row = await db?.get('folderLibraries', id);
  return row?.handle !== undefined;
}

export function isConnected(id: string): boolean {
  return folderUsable(id);
}

/** Test hook: the session's file handles, without going through a picker. */
export function connectForTest(id: string, files: Map<string, File>): void {
  connected.set(id, files);
}

/** Test hook: a new visit — the listing survives, nothing is open. */
export function disconnectForTest(id: string): void {
  connected.delete(id);
  opened.delete(id);
}

/** Test hook: forget a remembered handle without forgetting the folder. */
export function forgetHandleForTest(id: string): void {
  handles.delete(id);
  opened.delete(id);
}

/**
 * Test hook: the write a finished scan performs, without the scan.
 *
 * The real `saveFolder`, not an imitation of it — the diff, the marking and
 * the index are exactly what a rescan does, and a test that wrote the records
 * itself would be checking its own arithmetic.
 */
export function saveFolderForTest(id: string, scores: FolderScore[]): Promise<boolean> {
  return saveFolder({
    id,
    addedAt: new Date().toISOString(),
    source: null,
    scores,
    count: scores.length,
    connected: false,
    listedFrom: 'walk',
    pending: [],
    canOpen: false,
    rememberNote: null,
  });
}

/**
 * Takes one row out of a stored listing.
 *
 * **Two small records, not the listing.** This used to read the whole 37,261
 * rows out of the one record they lived in, copy the array without one of
 * them, and write all of it back — a multi-megabyte write for a one-row change,
 * and the change happens on the path the owner is on most. Now it marks the
 * score's own record and appends its path to the folder's `missing` list,
 * which is what keeps the index — the other big record — out of the way of a
 * single row.
 *
 * Marked rather than deleted, for the same reason a rescan marks: the row is
 * evidence of something the folder used to hold, and if the file comes back
 * the next scan clears the mark and the row is itself again.
 *
 * Returns whether anything was actually taken off the list.
 */
async function dropScore(folderId: string, file: string): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const tx = db.transaction(['folderLibraries', 'folderScores'], 'readwrite');
    const rows = tx.objectStore('folderScores');
    const score = await rows.get([folderId, file]);
    const folders = tx.objectStore('folderLibraries');
    const row = await folders.get(folderId);
    if (!row) return false;
    const missing = row.missing ?? [];
    if (missing.includes(file)) return false;
    // A folder that has not been split yet keeps the old shape honest: the
    // inline array loses the row too, so the count and the listing agree
    // however this folder is read next.
    const scores = row.scores?.filter((entry) => entry.file !== file);
    if (score === undefined && scores === undefined) return false;
    if (score !== undefined && score.missingAt === undefined) {
      await rows.put({ ...score, missingAt: new Date().toISOString() });
    }
    await folders.put({
      ...row,
      ...(scores === undefined ? {} : { scores }),
      count: Math.max(0, (row.count ?? row.scores?.length ?? 0) - 1),
      missing: [...missing, file],
    });
    await tx.done;
  } catch {
    return false;
  }
  notify();
  return true;
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
  // Allow tap or into nothing at all — and it does it without re-reading the
  // folder, which is the difference between an Add that takes a moment and the
  // "Adding…" that never came back.
  if (!folderUsable(folderId)) await openFolder(folderId, { interactive: true });
  const files = connected.get(folderId);
  const handle = opened.get(folderId);
  if (!files && !handle) {
    // Three different reasons, three different things to do about them. The
    // one message for all of them ("Android only lends a folder for one
    // visit") was a lie in two of the three cases, and in both of those it
    // named the wrong cure.
    const note = notes.get(folderId) ?? null;
    if (note === 'permission') {
      throw new FolderError(
        `Chrome would not open the ${folderId} folder — it is remembered, but read permission was not given. Open it and allow the prompt.`,
        'open',
      );
    }
    throw new FolderError(
      note === 'stale'
        ? `The remembered ${folderId} folder could not be read — it may have been moved, renamed, or on a card that is out. Pick the folder again to add from it.`
        : `Pick the ${folderId} folder again to add from it — Android only lends a folder for one visit.`,
      'pick',
    );
  }
  let file = files?.get(score.file);
  if (!file && files) {
    // A listing stored by an older build kept the *manifest's* path in
    // `file` rather than the path the file is actually at — `buildLibrary`
    // above now always writes the actual path, but a row written before that
    // was true is still sitting in IndexedDB, and a fresh pick always
    // rebuilds `files` keyed by actual paths. The filename on its own is
    // still reliable: it is the archive's content hash, unique by
    // construction (`buildLibrary`'s `byName` map above relies on the same
    // fact), so a row with the older shape still finds its file by name.
    const name = score.file.slice(score.file.lastIndexOf('/') + 1);
    const bySameName = [...files.entries()].filter(([path]) => path === name || path.endsWith(`/${name}`));
    if (bySameName.length === 1) file = bySameName[0]?.[1];
  }
  // The folder is open but was never walked, which is the ordinary case now:
  // fetch the one file the owner asked for and nothing else.
  if (!file && handle) file = (await fileAt(handle, score.file)) ?? undefined;
  if (!file) {
    // The one thing manifest-first cannot know until it looks.
    //
    // The listing is the folder's own index, and an index is a statement about
    // the past: a file deleted since it was written is still a row, and the
    // only thing that ever finds out is this. So the discovery is *kept* — the
    // row comes out of the stored listing here and off the screen beside it —
    // rather than being spent on one error message and learnt again on the next
    // tap. The walk is offered as the cure because it is the only thing that
    // can put a whole listing right, but it is not needed for this row: this
    // row is already gone.
    const dropped = await dropScore(folderId, score.file);
    throw new FolderError(
      `${score.title || score.file} is in the listing but not in the folder any more.` +
        (dropped ? ' It has been taken off the list.' : '') +
        ' Rescan the folder if more of it has changed.',
      'rescan',
      score.file,
    );
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
