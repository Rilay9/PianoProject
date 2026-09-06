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

/** docs/00 D19: this is a personal build, but a 100 MB PDF still helps nobody. */
export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;

export const IMPORT_ACCEPT = '.musicxml,.mxl,.xml,.pdf';

/** Every imported id starts with this, so an id alone says where to look. */
export const IMPORT_ID_PREFIX = 'import.';

export class ImportError extends Error {}

const listeners = new Set<() => void>();

export function onImportsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(): void {
  for (const listener of listeners) listener();
}

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

export function kindForFilename(name: string): ImportKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.mxl') || lower.endsWith('.musicxml') || lower.endsWith('.xml')) {
    return 'musicxml';
  }
  return null;
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

export async function allImports(): Promise<ImportRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('imports')) ?? [];
  return rows.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
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
      `${file.name} is not a score the app can read — import a .musicxml, .mxl or .pdf file.`,
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
  if (kind === 'pdf') {
    if (!isPdf(bytes)) {
      throw new ImportError(`${file.name} is named .pdf but does not contain a PDF.`);
    }
    const title = file.name.replace(/\.pdf$/i, '');
    row = {
      id: importIdFor(title, taken),
      kind: 'pdf',
      title,
      data: buffer,
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
      tags: composer ? [composer] : [],
      addedAt: now.toISOString(),
    };
  }

  await db.put('imports', row);
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
    Pick<ImportRow, 'title' | 'tags' | 'level' | 'cuts' | 'lessonIds' | 'concepts' | 'levelSource'>
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
export function importToCatalogItem(row: ImportRow): CatalogItem {
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
  return (await allImports()).map(importToCatalogItem);
}
