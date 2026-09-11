// Keeping the PDF viewer's reading position across a rebuild triggered by
// editing cuts on a page other than the one being read (handoff-2026-09-09
// §5, docs/04 §5b).
import { describe, expect, it } from 'vitest';
import { reindexAfterRebuild, type PlannedSystem } from '../../src/pdf/systemPlan';

function sys(page: number, indexOnPage: number): PlannedSystem {
  return { page, top: 0, bottom: 0.1, indexOnPage };
}

describe('reindexAfterRebuild', () => {
  it('finds the same (page, indexOnPage) after systems earlier in the book shift', () => {
    // Reading page 5, system 1 (absolute index 2, with page 0 contributing
    // one system before it and page 5 two before that one).
    // The reader flips back to page 0 in "Adjust cuts" and adds a system
    // there: page 0 now contributes two systems instead of one, so every
    // system on page 5 shifts one slot to the right.
    const after = [sys(0, 0), sys(0, 1), sys(5, 0), sys(5, 1), sys(5, 2), sys(9, 0)];
    const position = { page: 5, indexOnPage: 1 };
    // A stale flat index (2) would now point at page 5's *first* system
    // instead of its second — the exact silent drift this function exists
    // to prevent.
    const next = reindexAfterRebuild(after, position, 2);
    expect(after[next]).toEqual(sys(5, 1));
  });

  it('falls back to the last system on the page when the exact one was removed', () => {
    const position = { page: 5, indexOnPage: 2 };
    // Page 5 lost its third system (index 2 no longer exists).
    const after = [sys(0, 0), sys(5, 0), sys(5, 1), sys(9, 0)];
    const next = reindexAfterRebuild(after, position, 3);
    expect(after[next]).toEqual(sys(5, 1));
  });

  it('falls back to the plain clamp when the page itself is gone', () => {
    const position = { page: 5, indexOnPage: 0 };
    const after = [sys(0, 0), sys(9, 0)];
    const next = reindexAfterRebuild(after, position, 4);
    expect(next).toBe(1); // clamp(4, [0, length-1]) with length 2
  });

  it('is a no-op when nothing upstream changed', () => {
    const systems = [sys(0, 0), sys(1, 0), sys(1, 1)];
    const position = { page: 1, indexOnPage: 1 };
    expect(reindexAfterRebuild(systems, position, 2)).toBe(2);
  });

  it('uses the plain clamp when there is no prior position', () => {
    const systems = [sys(0, 0), sys(1, 0)];
    expect(reindexAfterRebuild(systems, null, 5)).toBe(1);
  });
});
