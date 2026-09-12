// @vitest-environment jsdom
/**
 * A redraw that fails has to say so, not leave the old screen standing.
 *
 * Every one of these screens guards its *first* load and puts the reason on
 * screen. None of them guarded the redraws that follow an edit: `void refresh()`
 * with no `catch`, seven times in the library and once in progress. A rejected
 * read then went nowhere — the list kept showing what it showed before the
 * edit, with no error and no sign anything had happened, so the screen simply
 * disagreed with the database from then on.
 *
 * It is a reachable state rather than a theoretical one, because content reads
 * now reject rather than hang. The same shape in `ShelfScreen` turned out to be
 * the cause of the intermittent "screen never appeared" failures, and that is
 * the whole reason to close the rest of them.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ROUTER = {
  navigate: vi.fn(),
  navigateScore: vi.fn(),
  navigatePdf: vi.fn(),
  navigateDrill: vi.fn(),
  route: { tab: 'library' },
} as unknown as import('../../src/router').Router;

/** Succeeds once, then fails: a screen that loaded and then lost the source. */
function failingAfterFirst(): { items: () => Promise<unknown[]>; calls: () => number } {
  let calls = 0;
  return {
    items: () => {
      calls += 1;
      if (calls === 1) return Promise.resolve([]);
      return Promise.reject(new Error('catalog.json: 12 bytes and not valid JSON'));
    },
    calls: () => calls,
  };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('a library redraw that fails after the screen is already up', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.replaceChildren();
  });

  it('puts the reason on the screen instead of showing stale rows', async () => {
    const source = failingAfterFirst();
    let redraw: (() => void) | null = null;
    vi.doMock('../../src/curriculum/load', () => ({
      allItems: source.items,
      catalogIndex: () => Promise.resolve(new Map()),
      loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
      findItem: () => Promise.resolve(undefined),
    }));
    vi.doMock('../../src/data/importStore', () => ({
      IMPORT_ACCEPT: '',
      ImportError: class extends Error {},
      addImport: () => Promise.resolve(),
      deleteImport: () => Promise.resolve(),
      getImport: () => Promise.resolve(undefined),
      importSummaries: () => Promise.resolve([]),
      // Captured, so the test can be the thing that asks for a redraw — which
      // is what adding or deleting an import does.
      onImportsChange: (cb: () => void) => {
        redraw = cb;
        return () => undefined;
      },
      // `{ added, errors }`, not an array: the screen destructures it to jump
      // to whatever Android shared into the app while it was closed.
      takeSharedFiles: () => Promise.resolve({ added: [], errors: [] }),
      updateImport: () => Promise.resolve(),
    }));
    vi.doMock('../../src/data/progressStore', () => ({
      allProgress: () => Promise.resolve([]),
    }));

    const { LibraryScreen } = await import('../../src/ui/screens/LibraryScreen');
    const section = LibraryScreen(ROUTER);
    document.body.append(section);
    await settle();

    const status = section.querySelector('#library-status');
    expect(status?.textContent ?? '', 'the first load should have worked').not.toMatch(
      /could not be loaded/i,
    );

    expect(redraw, 'nothing is watching for imports, so no redraw can be asked for').not.toBeNull();
    (redraw as unknown as () => void)();
    await settle();

    expect(source.calls(), 'the redraw never ran').toBeGreaterThan(1);
    expect(status?.textContent ?? '', 'the redraw failed silently').toMatch(/could not be loaded/i);
    expect(status?.classList.contains('status--error')).toBe(true);
  });
});
