// @vitest-environment jsdom
/**
 * Which letter a title files under, and what the rail does with a list.
 *
 * The whole value of an index is that a person can predict where something is.
 * `Étude` under `#` and `Ave Maria` under A would be two different filing
 * systems in one rail, which is worse than no rail.
 */
import { describe, expect, it, vi } from 'vitest';
import { createAlphaRail, letterFor } from '../../src/ui/alphaRail';

describe('letterFor', () => {
  it('files a plain title under its first letter', () => {
    expect(letterFor('Minuet in G')).toBe('M');
    expect(letterFor('minuet in g')).toBe('M');
  });

  it('folds an accent to the letter underneath it', () => {
    // The archive is full of these and every one of them was landing in `#`.
    expect(letterFor('Étude')).toBe('E');
    expect(letterFor('Über allen Gipfeln')).toBe('U');
    expect(letterFor('Ännchen von Tharau')).toBe('A');
  });

  it('puts numbers, punctuation and everything else together', () => {
    expect(letterFor('12 Variations')).toBe('#');
    expect(letterFor('"Moonlight"')).toBe('#');
    expect(letterFor('日本の歌')).toBe('#');
    expect(letterFor('')).toBe('#');
    expect(letterFor('   ')).toBe('#');
  });

  it('ignores space before the title, which a CSV leaves behind', () => {
    expect(letterFor('  Prelude')).toBe('P');
  });
});

function rowsOf(titles: string[]): { el: HTMLElement; title: string }[] {
  return titles.map((title) => {
    const node = document.createElement('div');
    node.textContent = title;
    node.scrollIntoView = vi.fn();
    document.body.append(node);
    return { el: node, title };
  });
}

describe('the rail', () => {
  it('draws every letter, whatever the list holds', () => {
    // A rail whose letters move about from list to list cannot be learned.
    const rail = createAlphaRail({ rows: () => rowsOf(['Air', 'Bourrée']) });
    expect(rail.el.querySelectorAll('.alpha-rail__letter')).toHaveLength(27);
  });

  it('marks the letters with nothing behind them', () => {
    const rail = createAlphaRail({ rows: () => rowsOf(['Air', 'Zortziko']) });
    const at = (l: string): HTMLButtonElement | null =>
      rail.el.querySelector(`[data-letter="${l}"]`);
    expect(at('A')?.dataset.empty).toBe('false');
    expect(at('Z')?.dataset.empty).toBe('false');
    expect(at('Q')?.dataset.empty).toBe('true');
    expect(at('Q')?.disabled).toBe(true);
  });

  it('scrolls to the first row under the letter that was tapped', () => {
    const rows = rowsOf(['Air', 'Bourrée', 'Bagatelle', 'Caprice']);
    const rail = createAlphaRail({ rows: () => rows });
    rail.el.querySelector<HTMLButtonElement>('[data-letter="B"]')?.click();
    // The first one in the list's own order, not the alphabetically first —
    // the list decides its order and the rail follows it.
    expect(rows[1]?.el.scrollIntoView).toHaveBeenCalled();
    expect(rows[2]?.el.scrollIntoView).not.toHaveBeenCalled();
  });

  it('tells a list that can grow when the letter is not drawn yet', () => {
    // The folder shows a page at a time out of 37,000, so a letter can be
    // real and simply not on screen. Silently doing nothing would read as a
    // broken rail.
    const onMissing = vi.fn();
    const rail = createAlphaRail({ rows: () => rowsOf(['Air']), onMissing });
    rail.el.querySelector<HTMLButtonElement>('[data-letter="Q"]')?.click();
    expect(onMissing).toHaveBeenCalledWith('Q');
    // And it stays tappable, because there may be something behind it.
    expect(rail.el.querySelector<HTMLButtonElement>('[data-letter="Q"]')?.disabled).toBe(false);
  });

  it('hides itself over an empty list', () => {
    const rail = createAlphaRail({ rows: () => [] });
    expect(rail.el.hidden).toBe(true);
  });
});
