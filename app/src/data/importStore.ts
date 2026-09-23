/**
 * The owner's own scores (docs/04 §4, P7 step 3).
 *
 * This is the escape hatch the bundled library needs: anything published after
 * 1930, anything the content pipeline could not fetch, anything he simply
 * bought. An imported file becomes a catalog item like any other — searchable,
 * playable, and (for MusicXML) judgeable in every follow mode — so the rest of
 * the app never has to know where a score came from.
 *
 * Two kinds, and the difference is not cosmetic:
 *   - **MusicXML/MXL** has notes. It is a first-class score.
 *   - **PDF** has pixels. It opens in the PDF viewer (`04` §5b), it can be
 *     followed by the clock or by tapping, and it can never be scored. The
 *     app says so on the card rather than greying out controls.
 *
 * Bad files fail with one sentence (`04` §4). The parser's own message is
 * usually a stack-trace fragment, so it is translated here.
 */
import { openDatabase, type ImportKind, type ImportRow } from './db';
import type { CatalogItem } from '../curriculum/types';
import { isMxl, toMusicXml } from '../score/mxl';
import {
  ConvertError,
  convertMidi,
  titleFromFilename,
  type ConversionReport,
} from '../import/midi/convert';
import { MidiReadError } from '../import/midi/readMidi';

/** docs/00 D19: this is a personal build, but a 100 MB PDF still helps nobody. */
export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;

/**
 * What the file picker offers.
 *
 * `.mid` and `.midi` are here because the owner asked to pick a MIDI file from
 * the app (2026-09-22): nothing runs on a server, so the conversion the command
 * line did (`tools/midi-cleanup/midi_to_musicxml.py`) happens on the device
 * (`src/import/midi/`). What is stored is the MusicXML it writes, so everything
 * downstream — levelling, the Score screen, every follow mode - treats it as
 * the score it now is.
 */
export const IMPORT_ACCEPT = '.musicxml,.mxl,.xml,.mid,.midi,.pdf';

/** Every imported id starts with this, so an id alone says where to look. */
export const IMPORT_ID_PREFIX = 'import.';

export class ImportError extends Error {}

const listeners = new Set<() => void>();

/** The cached summaries, or `null` when they have to be read again. */
let summaries: Promise<ImportSummary[]> | null = null;

/**
 * The ids imported since this page was loaded.
 *
 * The owner added a score from the score folder, opened the Library, and did
 * not find it: it was there, at whatever position its level put it in a list
 * of two thousand ordered by level, which on his phone was several hundred
 * rows and eighteen presses of *Show 60 more* down. He read that as the score
 * needing a rung before it would appear. The Library's own import path had
 * always answered this for itself — importing a score is a thing you do in
 * order to play it, so it switches to newest-first — and the answer was tied
 * to that one button rather than to the fact. It is the fact now: anything
 * added while the app has been open, wherever it was added from, is what the
 * Library shows first the next time it is opened.
 *
 * Deliberately not persisted. "What I just added" is a thing about this
 * visit; a set written to storage would still be reordering the library
 * a week later, and the ordinary answer to "where is the score I added in
 * March" is the search box.
 */
const addedSinceLoad = new Set<string>();

/** What has been imported since the page was loaded, newest visit only. */
export function importsAddedSinceLoad(): ReadonlySet<string> {
  return addedSinceLoad;
}

/** Test hook: start again as a freshly loaded page would. */
export function forgetAddedSinceLoadForTest(): void {
  addedSinceLoad.clear();
}

export function onImportsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Says the imports have changed: drops the summary cache, then tells the app.
 *
 * Exported because `data/backup.ts` writes this store directly on a restore.
 * Before the cache that was a silent bug — a restore put rows in and no screen
 * redrew; with the cache it would have been a worse one, so the two are the
 * same call.
 */
export function importsChanged(): void {
  summaries = null;
  for (const listener of listeners) listener();
}

const notify = importsChanged;

/** `Fur Elise (2).mxl` -> `import.fur-elise-2`, uniquified against what exists. */
export function importIdFor(title: string, taken: ReadonlySet<string>): string {
  const slug =
    title
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'score';
  let id = `${IMPORT_ID_PREFIX}${slug}`;
  let n = 2;
  while (taken.has(id)) {
    id = `${IMPORT_ID_PREFIX}${slug}-${String(n)}`;
    n += 1;
  }
  return id;
}

/**
 * What a file is, by its name — which is not the same as what it is stored as.
 *
 * A `.mid` is converted on the way in and stored as `musicxml`, because that is
 * what it becomes; `midi` names the *door* it came through, and only
 * `addImport` needs to know.
 */
export type ImportFileKind = ImportKind | 'midi';

export function kindForFilename(name: string): ImportFileKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.mid') || lower.endsWith('.midi')) return 'midi';
  if (lower.endsWith('.mxl') || lower.endsWith('.musicxml') || lower.endsWith('.xml')) {
    return 'musicxml';
  }
  return null;
}

/** What the converter decided about one imported MIDI file, and how to say it. */
export interface ConversionNote {
  report: ConversionReport;
  /** The self-check's answer, in a sentence. */
  check: string;
  /** What happened to the hands, in a sentence. */
  hands: string;
  /** True when nothing was lost, nothing added and every bar adds up. */
  passed: boolean;
}

/**
 * The conversion notes for the imports made in this visit, by id.
 *
 * **In memory on purpose.** This is what the assign sheet shows *before the
 * learner agrees to the import* — “here is what the app decided about your
 * file, do you still want it” — which is a fact about this moment and not
 * about the score. Writing it onto the row would mean a database version and a
 * field every other reader of `ImportRow` would have to ignore, for something
 * nothing reads tomorrow.
 */
const conversions = new Map<string, ConversionNote>();

export const conversionFor = (id: string): ConversionNote | undefined => conversions.get(id);

/** Test hook: forget this visit's conversion notes, as a reload would. */
export function forgetConversionsForTest(): void {
  conversions.clear();
}

/** The self-check's answer, in the words the tool itself prints. */
export function checkSentence(report: ConversionReport): string {
  if (report.passed) {
    return (
      `Checked: all ${String(report.notesIn)} notes the reader found are in the score, ` +
      'and every bar adds up.'
    );
  }
  const trouble: string[] = [];
  if (report.lost.length > 0) trouble.push(`${String(report.lost.length)} note(s) lost`);
  if (report.added.length > 0) trouble.push(`${String(report.added.length)} note(s) added`);
  if (report.brokenBars.length > 0) {
    trouble.push(`${String(report.brokenBars.length)} bar(s) that do not add up`);
  }
  if (report.unwritable.length > 0) {
    trouble.push(`${String(report.unwritable.length)} length(s) no note can carry`);
  }
  return (
    `The score was written, but the check found ${trouble.join(', ')}. ` +
    'Read it before trusting it, or convert the file with a different grid on the command line.'
  );
}

/** What happened to the hands, in a sentence. */
export function handsSentence(report: ConversionReport): string {
  const parts: string[] = [];
  if (report.merged > 1) {
    parts.push(
      `The ${String(report.merged)} tracks with notes in them (${report.mergedNames.join(', ')}) ` +
        'were merged into one line first.',
    );
  }
  if (report.hands === 'split into two') {
    const right = report.handMedian.right;
    const left = report.handMedian.left;
    parts.push(
      'The hands were split by the shape of the lines rather than at a fixed middle C' +
        (right !== undefined && left !== undefined
          ? `, and the right hand’s middle note sits ${String(right - left)} semitones above the left’s.`
          : '.'),
    );
    parts.push('A crossing of the hands is where this is most often wrong — check those bars.');
  } else {
    parts.push(`The file’s own parts were kept: ${report.parts.join(', ')}.`);
  }
  return parts.join(' ');
}

/** `%PDF-` — the magic every PDF starts with. */
function isPdf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/**
 * Reads the title out of MusicXML so an import is not called `score-3.mxl`.
 *
 * `<work-title>` first (what the publisher meant), then the first
 * `<credit-words>` (what is printed at the top of the page), then the filename.
 * Regex rather than DOMParser because this also runs in Node tests.
 */
export function titleFromMusicXml(xml: string, fallback: string): string {
  const work = /<work-title>([^<]+)<\/work-title>/i.exec(xml)?.[1]?.trim();
  if (work) return work;
  const credit = /<credit-words[^>]*>([^<]+)<\/credit-words>/i.exec(xml)?.[1]?.trim();
  if (credit) return credit;
  return fallback.replace(/\.[a-z0-9]+$/i, '');
}

export function composerFromMusicXml(xml: string): string | null {
  const creator = /<creator\b[^>]*type="composer"[^>]*>([^<]+)<\/creator>/i.exec(xml)?.[1]?.trim();
  return creator ?? null;
}

/**
 * Every import **with its file in it**.
 *
 * There are two readers left for this and both of them want the bytes: the
 * storage report, which adds them up, and the backup, which writes them out.
 * Everything else — the Library list, the folder's already-added index, the
 * catalog overlay every screen loads — wants a title and a level, and calling
 * this for that reads every score on the phone out of IndexedDB to throw it
 * away again. Use `importSummaries` for those, and `getImport` for the one row
 * that is actually being opened.
 */
export async function allImports(): Promise<ImportRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('imports')) ?? [];
  return rows.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/**
 * How many bytes a stored file really is.
 *
 * `String.length` is UTF-16 code units, not bytes, and the storage report puts
 * its total beside `navigator.storage.estimate()`, which is bytes — so a score
 * full of accented composer names was under-reported against a real
 * measurement. Encoded rather than guessed at.
 */
export function byteSizeOf(data: string | ArrayBuffer): number {
  return typeof data === 'string' ? new TextEncoder().encode(data).length : data.byteLength;
}

/** An import without its file: everything a list, a filter or a badge needs. */
export type ImportSummary = Omit<ImportRow, 'data'>;

/**
 * The imports, newest first, without their contents — and read once.
 *
 * This is the answer to a fault of exactly the shape this app keeps finding:
 * work proportional to the whole collection on a path that only wants a name.
 * `allItems()` is loaded by Today, Plan, Library, Drill, the score screen and
 * the session builder, and each of those used to pull every imported file's
 * bytes out of IndexedDB — a MusicXML score is 50–200 KB, so a hundred pieces
 * added from the folder is 5–20 MB decoded and discarded on every screen the
 * owner opens. A test fixture with two imports in it cannot see that at all.
 *
 * Two halves to the fix. The rows come back stripped, so nothing downstream
 * holds a file it did not ask for; and the result is cached until something
 * writes to the store, so navigating between screens re-reads nothing. The
 * cache is the promise rather than the value, so two screens loading at once
 * share one read instead of racing to start two.
 */
export function importSummaries(): Promise<ImportSummary[]> {
  summaries ??= allImports().then((rows) =>
    rows.map(({ data, ...rest }) => ({
      ...rest,
      // Filled in here for a row written before `bytes` existed. This is the
      // one place the file is in hand anyway, so it costs nothing — and it
      // means the storage report never has to load a file to size it.
      bytes: rest.bytes ?? byteSizeOf(data),
    })),
  );
  return summaries;
}

/** Test hook: forget the cached summaries, as a fresh database would. */
export function resetImportCacheForTest(): void {
  summaries = null;
}

export async function getImport(id: string): Promise<ImportRow | undefined> {
  const db = await openDatabase();
  return db?.get('imports', id);
}

/**
 * Parses and stores one file.
 *
 * Validation happens *before* the write, so a file that cannot be read never
 * becomes a row the learner has to delete by hand.
 */
export async function addImport(file: File, now = new Date()): Promise<ImportRow> {
  const kind = kindForFilename(file.name);
  if (!kind) {
    throw new ImportError(
      `${file.name} is not a score the app can read — import a .musicxml, .mxl, .mid or .pdf file.`,
    );
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError(
      `${file.name} is ${String(Math.round(file.size / 1048576))} MB, over the ${String(
        MAX_IMPORT_BYTES / 1048576,
      )} MB limit for one import.`,
    );
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) throw new ImportError(`${file.name} is empty.`);

  const db = await openDatabase();
  if (!db) {
    throw new ImportError(
      'This browser is not storing data, so an imported score would vanish on reload.',
    );
  }
  const taken = new Set((await db.getAllKeys('imports')).map(String));

  let row: ImportRow;
  let note: ConversionNote | null = null;
  if (kind === 'midi') {
    const title = titleFromFilename(file.name);
    let conversion;
    try {
      conversion = convertMidi(bytes, { title });
    } catch (cause) {
      // The converter's own sentence, which says what was wrong and what to do.
      // Never a silent failure and never a stack-trace fragment (`04` §4).
      throw new ImportError(
        cause instanceof MidiReadError || cause instanceof ConvertError
          ? `${file.name}: ${cause.message}`
          : `${file.name} could not be converted from MIDI.`,
      );
    }
    note = {
      report: conversion.report,
      check: checkSentence(conversion.report),
      hands: handsSentence(conversion.report),
      passed: conversion.report.passed,
    };
    row = {
      id: importIdFor(title, taken),
      kind: 'musicxml',
      title,
      data: conversion.xml,
      bytes: byteSizeOf(conversion.xml),
      tags: [],
      addedAt: now.toISOString(),
    };
  } else if (kind === 'pdf') {
    if (!isPdf(bytes)) {
      throw new ImportError(`${file.name} is named .pdf but does not contain a PDF.`);
    }
    const title = file.name.replace(/\.pdf$/i, '');
    row = {
      id: importIdFor(title, taken),
      kind: 'pdf',
      title,
      data: buffer,
      bytes: byteSizeOf(buffer),
      tags: [],
      addedAt: now.toISOString(),
    };
  } else {
    let xml: string;
    try {
      xml = toMusicXml(bytes);
    } catch {
      throw new ImportError(
        isMxl(bytes)
          ? `${file.name} is a .mxl archive with no MusicXML inside it.`
          : `${file.name} could not be unpacked.`,
      );
    }
    if (!/<score-partwise|<score-timewise/i.test(xml)) {
      throw new ImportError(
        `${file.name} does not look like MusicXML — if it came from a scan, export it from MuseScore first.`,
      );
    }
    const title = titleFromMusicXml(xml, file.name);
    const composer = composerFromMusicXml(xml);
    row = {
      id: importIdFor(title, taken),
      kind: 'musicxml',
      title,
      data: xml,
      bytes: byteSizeOf(xml),
      tags: composer ? [composer] : [],
      addedAt: now.toISOString(),
    };
  }

  await db.put('imports', row);
  if (note) conversions.set(row.id, note);
  addedSinceLoad.add(row.id);
  notify();
  return row;
}

/** Must match `public/share-target.js`. */
const SHARE_CACHE = 'pianopath-shared';

/**
 * Takes anything Android shared into the app while it was closed.
 *
 * The service worker parks shared files in a cache and redirects to the
 * Library; this is the other half. It drains the cache — a file imported twice
 * because the page was reloaded would be a duplicate the owner has to delete.
 */
export async function takeSharedFiles(now = new Date()): Promise<{ added: ImportRow[]; errors: string[] }> {
  const added: ImportRow[] = [];
  const errors: string[] = [];
  if (typeof caches === 'undefined') return { added, errors };
  let cache: Cache;
  try {
    if (!(await caches.has(SHARE_CACHE))) return { added, errors };
    cache = await caches.open(SHARE_CACHE);
  } catch {
    return { added, errors };
  }
  for (const request of await cache.keys()) {
    try {
      const response = await cache.match(request);
      if (!response) continue;
      const name = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? 'shared');
      const blob = await response.blob();
      added.push(await addImport(new File([blob], name), now));
    } catch (cause) {
      errors.push(cause instanceof ImportError ? cause.message : 'A shared file could not be read.');
    } finally {
      await cache.delete(request);
    }
  }
  return { added, errors };
}

export async function updateImport(
  id: string,
  patch: Partial<
    Pick<
      ImportRow,
      'title' | 'tags' | 'level' | 'cuts' | 'lessonIds' | 'concepts' | 'levelSource' | 'origin'
    >
  >,
): Promise<ImportRow | undefined> {
  const db = await openDatabase();
  const row = await db?.get('imports', id);
  if (!db || !row) return undefined;
  const next: ImportRow = { ...row, ...patch };
  await db.put('imports', next);
  notify();
  return next;
}

export async function deleteImport(id: string): Promise<void> {
  const db = await openDatabase();
  await db?.delete('imports', id);
  // A score added and then deleted in one visit must not go on steering the
  // Library's order towards a row that is not there any more.
  addedSinceLoad.delete(id);
  notify();
}

/**
 * The catalog rows for the imports, so Library, search and the session builder
 * can treat them exactly like bundled items.
 *
 * `level` defaults to 5 rather than 0: an unlabelled bought score is far more
 * likely to be beyond the current lesson than below it, and putting it at 0
 * would have the session builder offering Rachmaninoff as a warm-up.
 */
export function importToCatalogItem(row: ImportSummary): CatalogItem {
  return {
    id: row.id,
    type: 'song',
    title: row.title,
    level: row.level ?? 5,
    // An estimate is printed as `≈` and says so; a number the owner typed is
    // not an estimate. An import with no level at all is neither, and the
    // default of 5 is a placeholder rather than a judgement — so it is marked
    // estimated, which is the honest of the two.
    levelSource: row.levelSource ?? 'estimated',
    hands: 'both',
    tracks: ['imported'],
    concepts: row.concepts ?? [],
    file: null,
    tags: row.tags,
    composer: row.tags[0] ?? null,
    imported: true,
    kind: row.kind,
    /** The rungs this piece was assigned to (replan §4.3). */
    lessonIds: row.lessonIds ?? [],
    source: { name: 'Imported by you', license: 'user-imported', url: null },
  };
}

export async function importedCatalogItems(): Promise<CatalogItem[]> {
  // Summaries, not rows: this is the path every screen loads through
  // (`allItems`), and a catalog item has no use for the file's bytes.
  return (await importSummaries()).map(importToCatalogItem);
}
