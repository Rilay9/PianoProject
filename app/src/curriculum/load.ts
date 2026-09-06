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
import { allShelfPieces, type ShelfPiece } from '../data/booksStore';
import { getSettings, onSettingsChange } from '../data/settingsStore';
import { applyLevelOverrides, onLevelOverridesChange } from '../data/levelOverrides';

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

/** The file as built, with no imports overlaid. Cached; never handed out directly. */
function fetchCurriculum(): Promise<Curriculum> {
  curriculumPromise ??= fetchJson<Curriculum>('curriculum.json').catch((cause: unknown) => {
    curriculumPromise = null;
    throw cause;
  });
  return curriculumPromise;
}

/**
 * Appends the owner's imports to the rungs he assigned them to (replan §4.3).
 *
 * This is the whole point of `lessonIds`. Without it an imported piece is a
 * Library row that "sits outside the curriculum": it cannot complete a rung,
 * it never appears in a swap, and the session builder cannot pick it. With it
 * the piece is an *option of the rung*, and every reader downstream —
 * `lessonComplete`, `alternativesFor`, `buildSession`, the lesson page — needs
 * no change at all, because they all read `songOptions`.
 *
 * The built curriculum is never mutated: it is cached and shared, and an
 * overlay that wrote into it would accumulate the same import twice on the
 * second call. Only the lessons that gain something are copied.
 */
export function overlayImports(curriculum: Curriculum, imports: CatalogItem[]): Curriculum {
  const byLesson = new Map<string, string[]>();
  for (const item of imports) {
    for (const lessonId of item.lessonIds ?? []) {
      const list = byLesson.get(lessonId);
      if (list) list.push(item.id);
      else byLesson.set(lessonId, [item.id]);
    }
  }
  if (byLesson.size === 0) return curriculum;

  return {
    ...curriculum,
    stages: curriculum.stages.map((stage) => ({
      ...stage,
      units: stage.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => {
          const extra = byLesson.get(lesson.id);
          if (!extra) return lesson;
          // An id already in the list wins: assigning an import to a rung that
          // happens to bundle the same id should not list it twice.
          const existing = new Set(lesson.songOptions);
          const added = extra.filter((id) => !existing.has(id));
          if (added.length === 0) return lesson;
          return { ...lesson, songOptions: [...lesson.songOptions, ...added] };
        }),
      })),
    })),
  };
}

/**
 * Appends registered book pieces to the rungs they answer (replan §5.2).
 *
 * The same mechanism as `overlayImports`, and separate from it because the two
 * lists mean different things: a `songOption` is something the app can open, a
 * `paperOption` is something on a shelf in the room. The lesson page shows
 * them apart for that reason, and `lessonComplete` treats a self-assessed
 * paper pass more carefully than a measured one.
 */
export function overlayShelf(curriculum: Curriculum, pieces: ShelfPiece[]): Curriculum {
  const byLesson = new Map<string, string[]>();
  for (const entry of pieces) {
    for (const lessonId of entry.piece.lessonIds) {
      const list = byLesson.get(lessonId);
      if (list) list.push(entry.itemId);
      else byLesson.set(lessonId, [entry.itemId]);
    }
  }
  if (byLesson.size === 0) return curriculum;

  return {
    ...curriculum,
    stages: curriculum.stages.map((stage) => ({
      ...stage,
      units: stage.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => {
          const extra = byLesson.get(lesson.id);
          if (!extra) return lesson;
          const existing = new Set(lesson.paperOptions ?? []);
          const added = extra.filter((id) => !existing.has(id));
          if (added.length === 0) return lesson;
          return { ...lesson, paperOptions: [...(lesson.paperOptions ?? []), ...added] };
        }),
      })),
    })),
  };
}

export async function loadCurriculum(): Promise<Curriculum> {
  const [curriculum, imported, shelf] = await Promise.all([
    fetchCurriculum(),
    importedCatalogItems(),
    allShelfPieces(),
  ]);
  return overlayShelf(overlayImports(curriculum, imported), shelf);
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
  // docs/04 §7: nine bundled items are public domain in the United States only
  // (A4). The owner is in the US so the default is to show them; the switch is
  // here so the answer changes in one place if that stops being true.
  const showUsOnly = getSettings().showUsOnlyPd;
  // Last, so every downstream reader — search, swaps, the session builder —
  // sees the owner's own number and never the estimate it replaced.
  return applyLevelOverrides(
    [...byId.values()].filter((item) => showUsOnly || item.source?.pd_region !== 'US'),
  );
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

// Re-levelling changes an item's level, and the index is keyed off the items
// it was built from, so the merged index has to be rebuilt for the new number
// to reach the swap sheet and the session builder.
onLevelOverridesChange(() => {
  indexCache = null;
});

// The US-only filter changes what `allItems` returns, so the merged index has
// to be rebuilt when it is toggled — but only then. Settings are written on
// every control change, and dropping a 573-item index on each one would make
// the Settings screen quietly expensive.
let lastShowUsOnlyPd = getSettings().showUsOnlyPd;
onSettingsChange((settings) => {
  if (settings.showUsOnlyPd === lastShowUsOnlyPd) return;
  lastShowUsOnlyPd = settings.showUsOnlyPd;
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
