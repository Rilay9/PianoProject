// The PDF viewer's rendered-page cache must never evict a page it is
// currently showing, even when more pages are wanted at once than its
// target size (handoff-2026-09-09 §5, docs/04 §5b).
import { describe, expect, it } from 'vitest';
import { BoundedPageCache } from '../../src/pdf/pageCache';

describe('BoundedPageCache', () => {
  it('evicts the oldest entry once past its target size', () => {
    const cache = new BoundedPageCache<string>(2);
    cache.set(1, 'a');
    cache.set(2, 'b');
    cache.set(3, 'c');
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
    expect(cache.size).toBe(2);
  });

  it('never evicts a page in `keep`, even past the target size', () => {
    // This is the read-ahead scenario: the current page (1) plus three
    // follow pages are all wanted for one draw, in a cache sized for 3. The
    // naive insertion-order eviction deletes page 1 — the one on screen —
    // the moment the fourth page is inserted.
    const cache = new BoundedPageCache<string>(3);
    const keep = [1, 2, 3, 4];
    cache.set(1, 'page1', keep);
    cache.set(2, 'page2', keep);
    cache.set(3, 'page3', keep);
    cache.set(4, 'page4', keep);
    expect(cache.has(1)).toBe(true);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
    expect(cache.has(4)).toBe(true);
    // The cache is allowed to grow past its target rather than drop a page
    // still in use.
    expect(cache.size).toBe(4);
  });

  it('resumes normal eviction once a page leaves the keep set', () => {
    const cache = new BoundedPageCache<string>(2);
    cache.set(1, 'a', [1, 2]);
    cache.set(2, 'b', [1, 2]);
    // The reader has moved on: page 1 is no longer protected, and inserting
    // a new page should now evict it.
    cache.set(3, 'c', [2, 3]);
    expect(cache.has(1)).toBe(false);
    expect(cache.has(2)).toBe(true);
    expect(cache.has(3)).toBe(true);
  });

  it('clears everything', () => {
    const cache = new BoundedPageCache<string>(2);
    cache.set(1, 'a');
    cache.clear();
    expect(cache.has(1)).toBe(false);
    expect(cache.size).toBe(0);
  });
});
