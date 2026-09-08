// @vitest-environment jsdom
//
// Detail lines are cut by whole facts, not mid-word (P21d B3).
import { describe, expect, it } from 'vitest';
import { fitDetail } from '../../src/ui/widgets';

describe('fitDetail', () => {
  it('leaves a line that fits alone', () => {
    expect(fitDetail('page 14 · 3 min', 42)).toBe('page 14 · 3 min');
  });

  it('drops whole tokens from the end until it fits', () => {
    // The real shelf row: `page 14 · ≈ 4.1 · rung 4.4` came out as `page 14 · ≈…`,
    // which loses both the duration and the rung and keeps half a symbol.
    expect(fitDetail('page 14 · ≈ 4.1 min · rung 4.4', 20)).toBe('page 14 · ≈ 4.1 min');
    expect(fitDetail('page 14 · ≈ 4.1 min · rung 4.4', 12)).toBe('page 14');
  });

  it('never returns nothing: the first fact survives however long it is', () => {
    // A row with one very long fact is a different problem, and an empty line
    // is worse than a line that overflows its budget.
    expect(fitDetail('a fact far longer than the budget allows', 5)).toBe(
      'a fact far longer than the budget allows',
    );
  });

  it('cuts on the separator, never inside a token', () => {
    const out = fitDetail('Stage 0 · core, practice · 1 to practise', 24);
    expect(out).toBe('Stage 0 · core, practice');
    // Whatever it returns, every token in it is a whole token from the input.
    for (const token of out.split(' · ')) {
      expect('Stage 0 · core, practice · 1 to practise'.split(' · ')).toContain(token);
    }
  });

  it('is stable: fitting an already-fitted line changes nothing', () => {
    const once = fitDetail('page 14 · ≈ 4.1 min · rung 4.4', 20);
    expect(fitDetail(once, 20)).toBe(once);
  });
});
