/**
 * Loading `catalog.json` and `curriculum.json` from the precached content
 * directory (docs/00 D20: they are on the device, so this never touches the
 * network after the first launch).
 *
 * One in-flight promise per file, shared: several screens ask for the catalog
 * at once on a cold start, and three parallel fetches of a 700 KB file on a
 * phone is a visible stall.
 */
import type { CatalogItem, Curriculum } from './types';
import { indexCatalog, type CatalogIndex } from './selectors';
import { importedCatalogItems, onImportsChange } from '../data/importStore';

export function contentUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}content/${path}`;
}

let catalogPromise: Promise<CatalogItem[]> | null = null;
let curriculumPromise: Promise<Curriculum> | null = null;
let indexCache: CatalogIndex | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(contentUrl(path));
  if (!response.ok) throw new Error(`${path}: ${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export function loadCatalog(): Promise<CatalogItem[]> {
  catalogPromise ??= fetchJson<CatalogItem[]>('catalog.json').catch((cause: unknown) => {
    // Allow a retry: a failure here is almost always a first launch that lost
    // the network mid-precache, and it is fixed by trying again.
    catalogPromise = null;
    throw cause;
  });
  return catalogPromise;
}

export function loadCurriculum(): Promise<Curriculum> {
  curriculumPromise ??= fetchJson<Curriculum>('curriculum.json').catch((cause: unknown) => {
    curriculumPromise = null;
    throw cause;
  });
  return curriculumPromise;
}

/**
 * The bundled catalog plus the learner's own imports.
 *
 * Imports are merged in here rather than at each call site so that everything
 * downstream — search, the swap sheet, the session builder, `#/score/<id>` —
 * treats a bought score exactly like a bundled one (docs/04 §4). They come
 * last, so a bundled item always wins an id collision.
 */
export async function allItems(): Promise<CatalogItem[]> {
  const [bundled, imported] = await Promise.all([loadCatalog(), importedCatalogItems()]);
  const byId = new Map(imported.map((item) => [item.id, item]));
  for (const item of bundled) byId.set(item.id, item);
  return [...byId.values()];
}

export async function catalogIndex(): Promise<CatalogIndex> {
  if (indexCache) return indexCache;
  indexCache = indexCatalog(await allItems());
  return indexCache;
}

// An import or a delete invalidates the merged index; the bundled catalog
// itself never changes at runtime, so only the index is dropped.
onImportsChange(() => {
  indexCache = null;
});

export async function findItem(id: string): Promise<CatalogItem | undefined> {
  return (await catalogIndex()).byId.get(id);
}

/** Test hook. */
export function resetContentCacheForTest(): void {
  catalogPromise = null;
  curriculumPromise = null;
  indexCache = null;
}
