// @vitest-environment jsdom
/**
 * The twin search in the shelf's piece sheet (handoff 5j, `ShelfScreen.ts:134-156`).
 *
 * Three faults, one shape: it filtered the whole catalog on every keystroke,
 * un-debounced, building the entire match array before taking six — and it
 * matched titles only, while the row it draws underneath shows the composer.
 * 1,533 catalog items scanned per keypress is the sluggish list this screen
 * keeps being fixed for.
 *
 * `openPieceSheet` is exported and takes its `items` directly, so these drive
 * it without mounting the whole Shelf screen or a database.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openPieceSheet } from '../../src/ui/screens/ShelfScreen';
import type { CatalogItem } from '../../src/curriculum/types';
import type { BookRow } from '../../src/data/booksStore';

function item(over: Partial<CatalogItem> & { id: string; title: string }): CatalogItem {
  return {
    type: 'song',
    level: 3,
    hands: 'both',
    tracks: [],
    concepts: [],
    file: null,
    ...over,
  };
}

const book: BookRow = {
  id: 'book.x',
  title: 'Album',
  kind: 'other',
  pieces: [],
  addedAt: '2026-09-01T00:00:00.000Z',
};

/** A catalog large enough that scanning all of it would be the fault. */
function bigCatalog(size: number): { items: CatalogItem[]; scanned: () => number } {
  const raw: CatalogItem[] = [];
  for (let i = 0; i < size; i += 1) {
    // The first six are the only matches; everything after is a title with
    // nothing in common with the query, the way 1,527 other catalog items are
    // nothing to do with a search for one piece.
    raw.push(
      i < 6
        ? item({ id: `song.match.${String(i)}`, title: `Minuet ${String(i)}`, composer: 'Bach' })
        : item({ id: `song.other.${String(i)}`, title: `Nocturne ${String(i)}`, composer: 'Chopin' }),
    );
  }
  let accesses = 0;
  // A Proxy over the array counts every indexed read a `for...of` makes, so
  // "stopped at six" is something the test can see rather than infer.
  const items = new Proxy(raw, {
    get(target, prop, receiver): unknown {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) accesses += 1;
      return Reflect.get(target, prop, receiver);
    },
  });
  return { items, scanned: () => accesses };
}

function openSheetIn(items: CatalogItem[]): { search: HTMLInputElement; results: HTMLElement } {
  const sheet = openPieceSheet({ book, lessons: [], items, onDone: () => {} });
  const search = sheet.el.querySelector<HTMLInputElement>('#piece-twin-search');
  const results = sheet.el.querySelector<HTMLElement>('#piece-twin-results');
  expect(search).not.toBeNull();
  expect(results).not.toBeNull();
  return { search: search as HTMLInputElement, results: results as HTMLElement };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('the twin search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('does not search on every keystroke — it waits for typing to pause', () => {
    const { items } = bigCatalog(50);
    const { search, results } = openSheetIn(items);

    type(search, 'm');
    type(search, 'mi');
    type(search, 'min');
    // Nothing has run yet: three keystrokes, no debounce elapsed.
    expect(results.children).toHaveLength(0);

    // Less than the debounce delay: still nothing, and only one timer is
    // pending — a naive per-keystroke `setTimeout` with no `clearTimeout`
    // would instead fire three times.
    vi.advanceTimersByTime(50);
    expect(results.children).toHaveLength(0);

    vi.advanceTimersByTime(200);
    expect(results.children.length).toBeGreaterThan(0);
  });

  it('stops scanning once it has six matches, rather than filtering the whole catalog', () => {
    const { items, scanned } = bigCatalog(2000);
    const { search, results } = openSheetIn(items);
    // The sheet's own "what is the current twin" label reads `items` once on
    // open, unrelated to the search box; the baseline is taken after that so
    // only the search's own scanning is being measured.
    const before = scanned();

    type(search, 'minuet');
    vi.advanceTimersByTime(500);

    expect(results.children).toHaveLength(6);
    // The six matches sit at the front of a 2,000-item catalog; stopping
    // early means only a handful of items were read *by the search*.
    // `.filter().slice(6)` would have read all 2,000 of them.
    expect(scanned() - before).toBeLessThan(20);
  });

  it('matches the composer too, since that is what the result row shows', () => {
    const { items } = bigCatalog(20);
    const { search, results } = openSheetIn(items);

    // "Bach" matches none of the titles in this fixture (they are all
    // "Minuet N" / "Nocturne N"), only the composer field the row prints as
    // its subtitle.
    type(search, 'bach');
    vi.advanceTimersByTime(500);

    expect(results.children.length).toBeGreaterThan(0);
    expect(results.textContent).toContain('Bach');
  });

  it('clears the results rather than leaving a stale list for a short query', () => {
    const { items } = bigCatalog(20);
    const { search, results } = openSheetIn(items);

    type(search, 'minuet');
    vi.advanceTimersByTime(500);
    expect(results.children.length).toBeGreaterThan(0);

    type(search, 'm');
    expect(results.children).toHaveLength(0);
  });
});
