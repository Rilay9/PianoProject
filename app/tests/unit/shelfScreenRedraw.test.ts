// @vitest-environment jsdom
/**
 * Two faults from the same handoff entry (5j), both about what saving one
 * piece does to the rest of the shelf.
 *
 * **Every save rebuilt the whole shelf.** `ShelfScreen.ts:442-465` did
 * `list.replaceChildren(...)` over every book and every piece on every edit,
 * so editing the page number of one piece tore down and rebuilt every other
 * book section too — including the "Edit" button the sheet was about to
 * return focus to, which is what threw the scroll back to the top. The fix
 * redraws only the row a save touched; this file proves that by checking DOM
 * *identity* — an untouched book's section must be the very same node after
 * a save, not a lookalike rebuilt in its place.
 *
 * **Every piece row scanned the whole catalog for its twin.** `:385` asked
 * `items.some((candidate) => candidate.id === piece.itemId)` — an O(1,533)
 * scan repeated for every registered piece — where `catalogIndex()` already
 * keeps a `byId` map for exactly this question. `curriculum/load` is mocked
 * here with `allItems()` wired to fail the test if it is ever called, so a
 * regression back to the array scan (which reads the catalog through
 * `allItems()`, not `catalogIndex()`) shows up directly rather than through a
 * fragile call count.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { addBook, addPiece } from '../../src/data/booksStore';
import type { Router } from '../../src/router';
import { ShelfScreen } from '../../src/ui/screens/ShelfScreen';

// `vi.hoisted` because `vi.mock` below is itself hoisted above ordinary
// top-level `const`s — without it the factory would close over variables
// that do not exist yet, so the fixture catalog lives inside it too.
const { catalogIndexSpy, allItemsSpy, emptyCurriculum } = vi.hoisted(() => ({
  catalogIndexSpy: vi.fn(() =>
    Promise.resolve({
      byId: new Map(
        [
          { id: 'song.twin.a', title: 'Twin A' },
          { id: 'song.twin.b', title: 'Twin B' },
        ].map((i) => [i.id, i]),
      ),
    }),
  ),
  // `08` §13: `allItems()` reads every bundled *and* imported item, is the
  // O(1,533) list the fixed code has no reason to touch for a single piece's
  // twin lookup, and is exactly what the un-fixed code used to scan with
  // `.some()`. Failing loudly here is the regression guard for fix #2.
  allItemsSpy: vi.fn(
    (): Promise<never> =>
      Promise.reject(
        new Error('ShelfScreen should read the catalog through catalogIndex(), not allItems()'),
      ),
  ),
  emptyCurriculum: { version: 1, tracks: [], stages: [] },
}));

vi.mock('../../src/curriculum/load', () => ({
  catalogIndex: catalogIndexSpy,
  loadCurriculum: vi.fn(() => Promise.resolve(emptyCurriculum)),
  allItems: allItemsSpy,
}));

const router = { navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = ShelfScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('[data-piece]').length).toBeGreaterThan(0);
  });
  return section;
}

function editButtonFor(section: HTMLElement, pieceKey: string): HTMLButtonElement {
  const row = section.querySelector(`[data-piece="${pieceKey}"]`);
  expect(row).not.toBeNull();
  const btn = [...(row as HTMLElement).querySelectorAll('button')].find(
    (b) => b.textContent === 'Edit',
  );
  expect(btn).toBeDefined();
  return btn as HTMLButtonElement;
}

async function saveWithNewPage(page: string): Promise<void> {
  const pageInput = document.querySelector<HTMLInputElement>('#piece-page');
  expect(pageInput).not.toBeNull();
  pageInput!.value = page;
  pageInput!.dispatchEvent(new Event('input'));
  const saveBtn = document.querySelector<HTMLButtonElement>('#piece-save');
  expect(saveBtn).not.toBeNull();
  saveBtn!.click();
  await vi.waitFor(() => {
    expect(document.querySelector('#piece-sheet')).toBeNull();
  });
}

describe('saving one piece on the shelf', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    catalogIndexSpy.mockClear();
    allItemsSpy.mockClear();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('redraws only the edited row, leaving the rest of the shelf untouched', async () => {
    const bookA = await addBook({ title: 'Album A', kind: 'other' });
    const bookB = await addBook({ title: 'Album B', kind: 'other' });
    const pieceA1 = await addPiece(bookA.id, { title: 'A1', lessonIds: [], concepts: [] });
    await addPiece(bookA.id, { title: 'A2', lessonIds: [], concepts: [] });
    await addPiece(bookB.id, { title: 'B1', lessonIds: [], concepts: [] });

    const section = await mount();
    const bookBSection = section.querySelector(`[data-book="${bookB.id}"]`);
    const siblingRow = section.querySelector(`[data-piece="${bookA.id}/a2"]`);
    expect(bookBSection).not.toBeNull();
    expect(siblingRow).not.toBeNull();

    editButtonFor(section, `${bookA.id}/${pieceA1?.id ?? ''}`).click();
    await saveWithNewPage('42');

    // The untouched book's whole section is the very same DOM node: it was
    // never torn down, which is what a full `list.replaceChildren(...)` did.
    expect(section.querySelector(`[data-book="${bookB.id}"]`)).toBe(bookBSection);
    // Likewise the sibling piece inside the *edited* book.
    expect(section.querySelector(`[data-piece="${bookA.id}/a2"]`)).toBe(siblingRow);

    // And the edited row really did change.
    const editedRow = section.querySelector(`[data-piece="${bookA.id}/${pieceA1?.id ?? ''}"]`);
    expect(editedRow?.textContent).toContain('page 42');
  });

  it('looks up a piece’s twin in the catalog index instead of scanning the catalog', async () => {
    const book = await addBook({ title: 'Album', kind: 'other' });
    const piece = await addPiece(book.id, {
      title: 'One',
      lessonIds: [],
      concepts: [],
      itemId: 'song.twin.a',
    });
    const section = await mount();
    expect(catalogIndexSpy).toHaveBeenCalled();

    editButtonFor(section, `${book.id}/${piece?.id ?? ''}`).click();
    await saveWithNewPage('7');

    expect(
      section.querySelector(`[data-piece="${book.id}/${piece?.id ?? ''}"]`)?.textContent,
    ).toContain('has a twin');
    // The guard: if the twin check had regressed to `items.some(...)` fed by
    // `allItems()`, the mock above throws and this assertion is never
    // reached — `refresh()` rejects instead.
    expect(allItemsSpy).not.toHaveBeenCalled();
  });
});
