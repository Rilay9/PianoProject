// @vitest-environment jsdom
/**
 * A shelf that cannot be loaded has to say so.
 *
 * Library, Progress and Today each catch their first load and put the reason on
 * screen. The shelf did not: `void refresh()` with no `catch`, so a content
 * read that failed rejected into nothing — the redraw never ran and the screen
 * sat empty and silent.
 *
 * That is how a full test run produces `element(s) not found` on this screen
 * while the same file passes alone, and on the owner's phone it is a blank
 * shelf on a bad connection with nothing to explain it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ROUTER = {
  navigate: vi.fn(),
  navigateScore: vi.fn(),
  navigatePdf: vi.fn(),
  navigateDrill: vi.fn(),
  route: { tab: 'library' },
} as unknown as import('../../src/router').Router;

describe('the shelf when its content will not load', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.replaceChildren();
  });

  it('puts the reason on the screen instead of staying blank', async () => {
    vi.doMock('../../src/curriculum/load', () => ({
      catalogIndex: () => Promise.reject(new Error('catalog.json: 12 bytes and not valid JSON')),
      loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
      findItem: () => Promise.resolve(undefined),
      allItems: () => Promise.resolve([]),
    }));
    vi.doMock('../../src/data/booksStore', () => ({
      allBooks: () => Promise.resolve([]),
      allShelfPieces: () => Promise.resolve([]),
    }));
    vi.doMock('../../src/data/importStore', () => ({
      importSummaries: () => Promise.resolve([]),
    }));

    const { ShelfScreen } = await import('../../src/ui/screens/ShelfScreen');
    const section = ShelfScreen(ROUTER);
    document.body.append(section);
    // Let the rejected load settle.
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const status = section.querySelector('#shelf-status');
    expect(status?.textContent ?? '', 'the shelf failed silently').toMatch(/could not be loaded/i);
    expect(status?.classList.contains('status--error')).toBe(true);
  });
});
