// @vitest-environment jsdom
/**
 * The Shelf, ranked (`04` §0 R1–R3, §4c; the pass the Plan screen had first).
 *
 * Photographed at 342 px this screen had every one of Plan's faults at once.
 *
 *  - **`BOOKS YOU OWN` over a screen titled Shelf**, with a card under it
 *    saying much the same — the same thing announced twice, and the heading
 *    was the half taking the room.
 *  - **A book's name set in the section-label style** — muted, letter-spaced,
 *    uppercase — so a Czerny title ran to three lines of grey capitals and was
 *    the loudest thing on a screen whose subject is the pieces under it.
 *  - **Truncation backwards.** That heading was drawn in full while the piece
 *    rows, the things you actually tap, read `No. 12 — Stud…`.
 *  - **An internal id on screen**: `rung 1.1`, beside a bare `≈ 1.1` that was
 *    the same figure again by coincidence, one meaning a difficulty and the
 *    other a lesson, with nothing to say which.
 *  - **The one filled box was the rarest action on the screen.** `04` §0 R3
 *    lists "register a book" among the things done once per lesson or less;
 *    `Add a book` was a filled box at the top, above every book.
 *
 * And one thing the reorganisation could have broken: a book's fact line
 * counts its pieces, and the shelf redraws one row at a time on purpose.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { addBook, addPiece } from '../../src/data/booksStore';
import type { Router } from '../../src/router';

const { curriculum } = vi.hoisted(() => ({
  curriculum: {
    version: 1,
    tracks: [],
    stages: [
      {
        number: 1,
        title: 'First steps',
        units: [
          {
            id: '1',
            title: 'Right hand',
            track: 'core',
            lessons: [
              { id: '1.1', title: 'Landmark notes', concepts: [], levelBand: [1, 1.5] },
              {
                id: '1.2',
                title: 'Sight-reading and phrasing capstone',
                concepts: [],
                levelBand: [1, 1.5],
              },
            ],
          },
        ],
      },
    ],
  },
}));

vi.mock('../../src/curriculum/load', () => ({
  catalogIndex: () => Promise.resolve({ byId: new Map() }),
  loadCurriculum: () => Promise.resolve(curriculum),
  allItems: () => Promise.resolve([]),
}));

const { ShelfScreen } = await import('../../src/ui/screens/ShelfScreen');

const router = { navigate: vi.fn() } as unknown as Router;

async function seed(lessonId = '1.1'): Promise<{ bookId: string }> {
  const book = await addBook({
    title: 'Czerny, Practical Method for Beginners on the Pianoforte Op. 599',
    author: 'Carl Czerny',
    kind: 'method',
  });
  await addPiece(book.id, {
    title: 'No. 12 — Study in C',
    page: 14,
    lessonIds: [lessonId],
    concepts: [],
    level: 1.1,
    levelSource: 'estimated',
  });
  return { bookId: book.id };
}

async function mount(): Promise<HTMLElement> {
  const section = ShelfScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('[data-piece]')).not.toBeNull();
    // The curriculum has landed, so a rung can be named rather than numbered.
    expect(section.querySelector('[data-piece] .list-row__sub')?.textContent).toContain('for ');
  });
  return section;
}

describe('the Shelf says each thing once', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('does not head the screen with the screen’s own name', async () => {
    await seed();
    const section = await mount();
    const headings = [...section.querySelectorAll('h1, h2')].map((h) =>
      (h.textContent ?? '').trim().toLowerCase(),
    );
    expect(headings).toContain('shelf');
    expect(headings).not.toContain('books you own');
    // The sentence and the folded explanation are both still here — the
    // heading went, not the content.
    expect(section.textContent).toContain('The app has no copy of these.');
    expect(section.querySelector('#shelf-how')).not.toBeNull();
  });

  it('gives a book’s name its own style rather than the section-label one', async () => {
    const { bookId } = await seed();
    const section = await mount();
    const title = section.querySelector(`[data-book="${bookId}"] h2`);
    expect(title?.classList.contains('shelf-book__title')).toBe(true);
    // The kind and the author are on one quiet line with the count, not a
    // badge on the title's line and a paragraph of their own beneath it.
    const facts = section.querySelector(`[data-book="${bookId}"] .shelf-book__facts`);
    expect(facts?.textContent).toBe('method · Carl Czerny · 1 piece');
  });
});

describe('a piece row', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('names the rung instead of printing its id', async () => {
    await seed();
    const section = await mount();
    const row = section.querySelector('[data-piece]');
    expect(row?.querySelector('.list-row__sub')?.textContent).toBe('for Landmark notes');
    expect(row?.textContent).not.toContain('rung 1.1');
  });

  it('writes the level the way every other screen writes one', async () => {
    await seed();
    const section = await mount();
    const meta = section.querySelector('[data-piece] .list-row__metatext')?.textContent ?? '';
    // `≈ L1.1`, not a bare `≈ 1.1` that reads as the rung id again.
    expect(meta).toBe('page 14 · ≈ L1.1');
  });

  it('keeps a long rung name instead of dropping it off the detail line', async () => {
    // `fitDetail` drops whole tokens from the end until the line fits, and a
    // rung's title is long enough to be deleted whole — which is why it is not
    // a token on that line at all. The facts stay short and complete; the rung
    // gets the row's own sentence line, where it is ellipsised, not dropped.
    await seed('1.2');
    const section = await mount();
    const row = section.querySelector('[data-piece]');
    expect(row?.querySelector('.list-row__sub')?.textContent).toBe(
      'for Sight-reading and phrasing capstone',
    );
    expect(row?.querySelector('.list-row__metatext')?.textContent).toBe('page 14 · ≈ L1.1');
  });
});

describe('the Shelf’s weights', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('has no filled box, because its rarest action was wearing it', async () => {
    await seed();
    const section = await mount();
    expect(section.querySelectorAll('.button--primary').length).toBe(0);
    // `04` §0 R3 lists "register a book" among the text actions.
    expect(
      section.querySelector('#shelf-add-book')?.classList.contains('link-button'),
    ).toBe(true);
    // And the one done often keeps its outline.
    const addPieceButton = section.querySelector('[id^="shelf-add-piece-"]');
    expect(addPieceButton?.classList.contains('button--secondary')).toBe(true);
  });

  it('keeps the piece count honest when one row is redrawn on its own', async () => {
    await seed();
    const section = await mount();
    expect(section.querySelector('.shelf-book__facts')?.textContent).toContain('1 piece');

    section.querySelector<HTMLButtonElement>('[id^="shelf-add-piece-"]')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('#piece-title')).not.toBeNull();
    });
    const title = document.querySelector<HTMLInputElement>('#piece-title');
    if (title) title.value = 'No. 24 — Study in G';
    document.querySelector<HTMLButtonElement>('#piece-save')?.click();

    await vi.waitFor(() => {
      expect(section.querySelectorAll('[data-piece]').length).toBe(2);
    });
    // The whole point of the one-row redraw is that it does not rebuild the
    // section, so anything in the heading that counts rows has to be told.
    expect(section.querySelector('.shelf-book__facts')?.textContent).toContain('2 pieces');
  });
});
