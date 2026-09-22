// @vitest-environment jsdom
/**
 * "I have this on paper" filed into whichever book sorted first (handoff 5j,
 * `LessonScreen.ts:289-300`).
 *
 * `addFromPaper` took `books[0]` off an alphabetically sorted list with no
 * picker anywhere in the flow. With one book that is always right — the
 * fixture, and the auto-created "My book" — so the fix keeps that path one
 * tap; with more than one book registered, every piece added from a lesson
 * page went silently into the first one, and the only way to notice was to
 * open the Shelf. These drive the real button in the real screen (not a
 * reimplementation of the decision) against a database with one book, then
 * two.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { addBook, addPiece, allShelfPieces } from '../../src/data/booksStore';
import type { Router } from '../../src/router';
import type { CatalogItem, Lesson } from '../../src/curriculum/types';

const { loadCurriculumSpy, allItemsSpy, fetchMarkdownSpy, LESSON } = vi.hoisted(() => {
  const lesson: Lesson = {
    id: '2.1',
    title: 'Hands together',
    concepts: [],
    textFile: 'lessons/2.1.md',
    exerciseOptions: [],
    songOptions: [],
    optionsExempt: true,
    mastery: { exercisesRequired: 0, songsRequired: 0, minAccuracy: 0.9, minTempoPct: 0.8 },
  };
  const curriculum = {
    version: 1,
    tracks: [],
    stages: [{ number: 2, title: 'Two', units: [{ id: '2.1', track: 'core', lessons: [lesson] }] }],
  };
  return {
    LESSON: lesson,
    loadCurriculumSpy: vi.fn(() => Promise.resolve(curriculum)),
    allItemsSpy: vi.fn((): Promise<CatalogItem[]> => Promise.resolve([])),
    fetchMarkdownSpy: vi.fn(
      (): Promise<string> => Promise.reject(new Error('no lesson text in this fixture')),
    ),
  };
});

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: loadCurriculumSpy,
  allItems: allItemsSpy,
  fetchMarkdown: fetchMarkdownSpy,
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');

const router = { navigate: vi.fn(), navigateScore: vi.fn(), navigatePaper: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = LessonScreen(router, LESSON.id);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(document.querySelector('#lesson-have-paper')).not.toBeNull();
  });
  return section;
}

function haveThisOnPaper(): HTMLButtonElement {
  const btn = document.querySelector<HTMLButtonElement>('#lesson-have-paper');
  expect(btn).not.toBeNull();
  return btn as HTMLButtonElement;
}

describe('"I have this on paper"', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('stays one tap when only one book is registered', async () => {
    const only = await addBook({ title: 'Only Book', kind: 'method' });
    await mount();

    haveThisOnPaper().click();

    // Straight to the piece sheet — no picker in between.
    await vi.waitFor(() => {
      expect(document.querySelector('#piece-sheet')).not.toBeNull();
    });
    expect(document.querySelector('#lesson-paper-book-picker')).toBeNull();
    const sheetHeading = document.querySelector('#piece-sheet h2');
    expect(sheetHeading?.textContent).toContain(only.title);
  });

  it('offers a picker when more than one book is registered, and files into the one chosen', async () => {
    // Alphabetically, "Album" sorts before "Zebra Method" — `books[0]` used to
    // mean "Album" always won regardless of which book the piece is actually
    // in.
    await addBook({ title: 'Album', kind: 'other' });
    const zebra = await addBook({ title: 'Zebra Method', kind: 'method' });
    await mount();

    haveThisOnPaper().click();

    await vi.waitFor(() => {
      expect(document.querySelector('#lesson-paper-book-picker')).not.toBeNull();
    });
    const picker = document.querySelector('#lesson-paper-book-picker');
    expect(picker).not.toBeNull();
    expect(picker?.textContent).toContain('Album');
    expect(picker?.textContent).toContain('Zebra Method');
    // Not yet filed anywhere: the picker is a choice, not a commitment.
    expect(document.querySelector('#piece-sheet')).toBeNull();

    const zebraRow = [...(picker as HTMLElement).querySelectorAll('.list-row')].find((row) =>
      row.textContent?.includes('Zebra Method'),
    );
    expect(zebraRow).toBeDefined();
    (zebraRow as HTMLElement).click();

    // The picker is gone, replaced by the piece sheet for the book picked —
    // not `books[0]`.
    expect(document.querySelector('#lesson-paper-book-picker')).toBeNull();
    const sheetHeading = document.querySelector('#piece-sheet h2');
    expect(sheetHeading?.textContent).toContain('Zebra Method');

    const titleInput = document.querySelector<HTMLInputElement>('#piece-title');
    expect(titleInput).not.toBeNull();
    titleInput!.value = 'No. 3';
    titleInput!.dispatchEvent(new Event('input'));
    document.querySelector<HTMLButtonElement>('#piece-save')?.click();

    await vi.waitFor(async () => {
      const shelf = await allShelfPieces();
      expect(shelf).toHaveLength(1);
    });
    const [entry] = await allShelfPieces();
    expect(entry?.book.id).toBe(zebra.id);
    expect(entry?.piece.title).toBe('No. 3');
  });
});

/**
 * A shelf piece's *With the score* is a door on the lesson page too (T17-2).
 *
 * It opens the Score screen on the piece's catalog twin, and it was the one
 * door that nearly kept the old Back — `00` §2.15, a change has more than
 * one consumer: the four obvious ones (the option rows, the duet, the blind
 * and the ladder buttons) were done in one pass and this one was three
 * hundred lines away in the shelf block.
 */
describe('the rung rides out of every door on this page', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('carries the rung out of a shelf piece’s "With the score"', async () => {
    const TWIN = 'song.folk.twinkle.rh';
    // A twin the catalog actually has: the button is only drawn when the id on
    // the piece is still in the library, so a fixture with no item would draw
    // no button and the test would pass by drawing nothing.
    allItemsSpy.mockResolvedValue([
      { id: TWIN, type: 'song', title: 'Twinkle', level: 1, tracks: ['core'], concepts: [] },
    ] as unknown as CatalogItem[]);
    const book = await addBook({ title: 'Only Book', kind: 'method' });
    await addPiece(book.id, {
      title: 'Twinkle',
      lessonIds: [LESSON.id],
      itemId: TWIN,
    } as never);

    const section = LessonScreen(router, LESSON.id);
    document.body.replaceChildren(section);
    const withScore = await vi.waitFor(() => {
      const nodes = [...document.querySelectorAll('button')].filter(
        (node) => node.textContent === 'With the score',
      );
      expect(nodes).toHaveLength(1);
      return nodes[0] as HTMLButtonElement;
    });

    withScore.click();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(router.navigateScore).toHaveBeenCalledWith(TWIN, { from: LESSON.id });
  });
});
