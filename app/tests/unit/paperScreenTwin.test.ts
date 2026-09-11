// @vitest-environment jsdom
/**
 * A shelf piece's twin (`itemId`) can point at an import that has since been
 * deleted from the Library — that is the whole reason `ShelfScreen`'s own
 * piece row was fixed to check `catalogById.has(piece.itemId)` before
 * offering "With the score" (handoff-2026-09-09 §5i #4/#5j). `PaperScreen`
 * has the identical button under a different label — "Practise with the
 * score" — and offered it unconditionally: the same fault, unfixed, one
 * screen over. This drives the real screen (not the button-building logic in
 * isolation) so the regression is caught however the check is wired.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { addBook, addPiece } from '../../src/data/booksStore';
import type { Router } from '../../src/router';
import type { CatalogItem } from '../../src/curriculum/types';
import type { InputNoteEvent } from '../../src/midi/types';

const { findItemSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((id: string): Promise<CatalogItem | undefined> =>
    Promise.resolve(id === 'import.alive' ? ({ id } as CatalogItem) : undefined),
  ),
}));

vi.mock('../../src/curriculum/load', () => ({
  findItem: findItemSpy,
}));

vi.mock('../../src/app/services', () => ({
  audioEngine: { ensureStarted: () => Promise.resolve({}), masterGain: null },
  webMidiSource: {
    onNote: (_cb: (event: InputNoteEvent) => void) => () => undefined,
  },
}));

vi.mock('../../src/ui/KeyboardStrip', () => {
  class FakeKeyboardStrip {
    readonly el = document.createElement('div');
    scrollToMiddleC(): void {
      // jsdom has no layout, and the real strip calls `Element.scrollTo`.
    }
    setState(): void {
      // Nothing pressed in this test.
    }
    destroy(): void {
      // Nothing subscribed.
    }
  }
  return { KeyboardStrip: FakeKeyboardStrip };
});

const router = { navigate: vi.fn(), navigateScore: vi.fn() } as unknown as Router;

async function mountPaper(bookId: string, pieceId: string): Promise<HTMLElement> {
  const { PaperScreen } = await import('../../src/ui/screens/PaperScreen');
  const section = PaperScreen(router, bookId, pieceId);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#paper-where')?.textContent).not.toBe('');
  });
  return section;
}

beforeEach(() => {
  useFakeIndexedDb();
  findItemSpy.mockClear();
});

afterEach(() => {
  clearFakeIndexedDb();
  document.body.replaceChildren();
});

describe('PaperScreen: the "Practise with the score" button', () => {
  it('is hidden when the twin id no longer resolves to anything', async () => {
    const book = await addBook({ title: 'Method Book' });
    const piece = await addPiece(book.id, {
      title: 'Study No. 1',
      lessonIds: [],
      concepts: [],
      itemId: 'import.deleted',
    });
    expect(piece).toBeDefined();

    const section = await mountPaper(book.id, piece!.id);
    expect(section.querySelector('#paper-with-score')).toBeNull();
  });

  it('is shown when the twin still exists in the catalog', async () => {
    const book = await addBook({ title: 'Method Book' });
    const piece = await addPiece(book.id, {
      title: 'Study No. 2',
      lessonIds: [],
      concepts: [],
      itemId: 'import.alive',
    });
    expect(piece).toBeDefined();

    const section = await mountPaper(book.id, piece!.id);
    expect(section.querySelector('#paper-with-score')).not.toBeNull();
  });
});
