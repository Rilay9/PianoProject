// @vitest-environment jsdom
/**
 * The score folder screen on a listing the size the owner actually has.
 *
 * Two faults, both of the kind that only appear once there is more than a
 * fixture behind the screen.
 *
 * **The rail described the page instead of the list.** Since a letter *moves*
 * the window rather than growing it, the sixty rows drawn after a jump to S are
 * all S — and the rail, which could only read its rows, then marked the other
 * twenty-six letters empty over a folder that has something under every one of
 * them. It also went on offering a tap on a letter that is nowhere in the
 * listing, and that tap did nothing at all.
 *
 * **The wrong folder was shown, permanently.** `savedFolders()` handed back
 * whatever `getAll` gave, which is key order, and the key is the folder's own
 * name. Pick `Download` once by mistake and it sorts ahead of
 * `pianopath-library`: from then on every launch shows the mistake, the archive
 * is invisible, and the one Forget button is pointed at the folder you want to
 * keep.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type FolderScore } from '../../src/data/db';
import type { Router } from '../../src/router';
import { FolderScreen } from '../../src/ui/screens/FolderScreen';

/** Titles across A, B and S, and deliberately nothing at all under Q. */
const STARTS = ['Air', 'Bourrée', 'Suo Gân'];

function scores(count: number): FolderScore[] {
  const rows: FolderScore[] = [];
  for (let i = 0; i < count; i += 1) {
    rows.push({
      file: `x/${String(i)}.mxl`,
      title: `${STARTS[i % STARTS.length] ?? 'Air'} ${String(i).padStart(4, '0')}`,
      composer: '',
      level: null,
      bars: null,
      status: 'unknown',
      style: '',
      rating: 0,
      ratings: 0,
      views: 0,
      lyrics: false,
      garbled: false,
      museScore: '',
    });
  }
  // The screen lists what the store holds, and the store holds it sorted.
  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

async function saveListing(id: string, addedAt: string, count: number): Promise<void> {
  const db = await openDatabase();
  await db?.put('folderLibraries', { id, addedAt, source: null, scores: scores(count) });
}

const router = { navigate: vi.fn() } as unknown as Router;

/**
 * jsdom has no layout and so no `scrollIntoView`, and the rail calls it
 * unguarded on the row a letter lands on (`ui/alphaRail.ts`).
 *
 * In a browser the method is always there, so this makes jsdom behave like the
 * thing being tested rather than papering over a fault: without it every jump
 * in this file throws inside jsdom's event dispatch, which jsdom reports as an
 * uncaught exception rather than failing the assertion — a noise that has been
 * in this suite for as long as the rail has, and that hides a real throw if one
 * ever turns up here.
 */
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    /* no layout, nothing to scroll */
  };
}

async function mount(): Promise<HTMLElement> {
  const section = FolderScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#folder-list .list-row').length).toBeGreaterThan(0);
  });
  return section;
}

function letter(section: HTMLElement, l: string): HTMLButtonElement {
  const button = section.querySelector<HTMLButtonElement>(`.alpha-rail [data-letter="${l}"]`);
  expect(button).not.toBeNull();
  return button as HTMLButtonElement;
}

describe('the letter rail over a folder of thousands', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('keeps saying what the listing holds after a jump has moved the page', async () => {
    await saveListing('pianopath-library', '2026-09-10T10:00:00.000Z', 600);
    const section = await mount();

    // Before the tap the page is the A's, so A is obviously present.
    expect(letter(section, 'A').dataset.empty).toBe('false');
    letter(section, 'S').click();

    // The rows come out of the database now — the screen holds the index and
    // fetches the page it is about to draw — so a jump lands a turn later.
    await vi.waitFor(() => {
      const first = section.querySelector('#folder-list .list-row .list-row__title');
      expect(first?.textContent?.startsWith('Suo')).toBe(true);
    });
    const titles = [...section.querySelectorAll('#folder-list .list-row')].map(
      (row) => row.querySelector('.list-row__title')?.textContent ?? '',
    );
    expect(titles[0]?.startsWith('Suo')).toBe(true);
    // The window moved rather than grew: one page, not everything down to S.
    expect(titles).toHaveLength(60);

    // And this is the fault: the page is all S, the *folder* still has two
    // hundred pieces under A and as many under B, and the rail has to go on
    // saying so or it is describing a different list from the one it indexes.
    expect(letter(section, 'A').dataset.empty).toBe('false');
    expect(letter(section, 'B').dataset.empty).toBe('false');
    expect(letter(section, 'A').disabled).toBe(false);
  });

  it('does not take a tap on a letter the listing has nothing under', async () => {
    await saveListing('pianopath-library', '2026-09-10T10:00:00.000Z', 600);
    const section = await mount();
    const q = letter(section, 'Q');
    expect(q.dataset.empty).toBe('true');
    expect(q.disabled).toBe(true);
  });

  it('marks a letter empty once a search has filtered it away', async () => {
    await saveListing('pianopath-library', '2026-09-10T10:00:00.000Z', 600);
    const section = await mount();
    const search = section.querySelector<HTMLInputElement>('#folder-search');
    expect(search).not.toBeNull();
    search!.value = 'suo';
    search!.dispatchEvent(new Event('input'));
    await vi.waitFor(() => {
      expect(letter(section, 'A').dataset.empty).toBe('true');
    });
    expect(letter(section, 'S').dataset.empty).toBe('false');
  });
});

describe('more than one folder has been picked', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('shows the one picked last, not the one whose name sorts first', async () => {
    // `Download` was a mistake, picked first; the archive came after it. In key
    // order `Download` wins for ever.
    await saveListing('Download', '2026-09-01T10:00:00.000Z', 120);
    await saveListing('pianopath-library', '2026-09-10T10:00:00.000Z', 600);
    const section = await mount();
    expect(section.querySelector('#folder-count')?.textContent).toContain('600');
    expect(section.textContent).toContain('pianopath-library');
  });

  it('names the listings it is not showing, so they can be got rid of', async () => {
    await saveListing('Download', '2026-09-01T10:00:00.000Z', 120);
    await saveListing('pianopath-library', '2026-09-10T10:00:00.000Z', 600);
    const section = await mount();
    const others = section.querySelector('#folder-others');
    expect(others?.textContent).toContain('Download');
  });
});
