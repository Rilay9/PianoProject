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

export async function catalogIndex(): Promise<CatalogIndex> {
  if (indexCache) return indexCache;
  indexCache = indexCatalog(await loadCatalog());
  return indexCache;
}

export async function findItem(id: string): Promise<CatalogItem | undefined> {
  return (await catalogIndex()).byId.get(id);
}

/** Test hook. */
export function resetContentCacheForTest(): void {
  catalogPromise = null;
  curriculumPromise = null;
  indexCache = null;
}
