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

/** Rows, plus the `scrollIntoView` spy for each, kept out of the DOM object. */
function rowsOf(titles: string[]): {
  rows: { el: HTMLElement; title: string }[];
  wentTo: ReturnType<typeof vi.fn>[];
} {
  const wentTo: ReturnType<typeof vi.fn>[] = [];
  const rows = titles.map((title) => {
    const node = document.createElement('div');
    node.textContent = title;
    const spy = vi.fn();
    node.scrollIntoView = spy;
    wentTo.push(spy);
    document.body.append(node);
    return { el: node, title };
  });
  return { rows, wentTo };
}

describe('the rail', () => {
  it('draws every letter, whatever the list holds', () => {
    // A rail whose letters move about from list to list cannot be learned.
    const rail = createAlphaRail({ rows: () => rowsOf(['Air', 'Bourrée']).rows });
    expect(rail.el.querySelectorAll('.alpha-rail__letter')).toHaveLength(27);
  });

  it('marks the letters with nothing behind them', () => {
    const rail = createAlphaRail({ rows: () => rowsOf(['Air', 'Zortziko']).rows });
    const at = (l: string): HTMLButtonElement | null =>
      rail.el.querySelector(`[data-letter="${l}"]`);
    expect(at('A')?.dataset.empty).toBe('false');
    expect(at('Z')?.dataset.empty).toBe('false');
    expect(at('Q')?.dataset.empty).toBe('true');
    expect(at('Q')?.disabled).toBe(true);
  });

  it('scrolls to the first row under the letter that was tapped', () => {
    const { rows, wentTo } = rowsOf(['Air', 'Bourrée', 'Bagatelle', 'Caprice']);
    const rail = createAlphaRail({ rows: () => rows });
    rail.el.querySelector<HTMLButtonElement>('[data-letter="B"]')?.click();
    // The first one in the list's own order, not the alphabetically first —
    // the list decides its order and the rail follows it.
    expect(wentTo[1]).toHaveBeenCalled();
    expect(wentTo[2]).not.toHaveBeenCalled();
  });

  it('tells a list that can grow when the letter is not drawn yet', () => {
    // The folder shows a page at a time out of 37,000, so a letter can be
    // real and simply not on screen. Silently doing nothing would read as a
    // broken rail.
    const onMissing = vi.fn();
    const rail = createAlphaRail({ rows: () => rowsOf(['Air']).rows, onMissing });
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

/**
 * The rail over a list it can only see a page of.
 *
 * Both long lists draw a window — sixty rows out of 1,533 or out of 37,261 —
 * and since the window *moves* to a letter instead of growing to it, the drawn
 * rows after a jump are all the same letter. A rail that reads its rows and
 * nothing else then reports that the folder has nothing under any other letter,
 * one tap after it obeyed a tap on one of them.
 */
describe('the rail over a windowed list', () => {
  const wholeList = new Set(['A', 'B', 'S', 'Z']);

  it('marks a letter the list has but the page does not as present', () => {
    // The page is the S's, because that is where the last jump went.
    const rail = createAlphaRail({
      rows: () => rowsOf(['Suo Gân', 'Sonata']).rows,
      letters: () => wholeList,
      onMissing: vi.fn(),
    });
    const at = (l: string): HTMLButtonElement | null =>
      rail.el.querySelector(`[data-letter="${l}"]`);
    expect(at('S')?.dataset.empty).toBe('false');
    // A, B and Z are not on this page and every one of them is in the folder.
    expect(at('A')?.dataset.empty).toBe('false');
    expect(at('Z')?.dataset.empty).toBe('false');
    expect(at('A')?.disabled).toBe(false);
  });

  it('takes no tap for a letter the whole list has nothing under', () => {
    // Q is not in the folder at all, so growing or moving the window cannot
    // produce a row. It used to stay lit and swallow the tap in silence.
    const onMissing = vi.fn();
    const rail = createAlphaRail({
      rows: () => rowsOf(['Suo Gân']).rows,
      letters: () => wholeList,
      onMissing,
    });
    const q = rail.el.querySelector<HTMLButtonElement>('[data-letter="Q"]');
    expect(q?.dataset.empty).toBe('true');
    expect(q?.disabled).toBe(true);
    q?.click();
    expect(onMissing).not.toHaveBeenCalled();
  });

  it('still asks the list to move for a letter that is real and not drawn', () => {
    const onMissing = vi.fn();
    const rail = createAlphaRail({
      rows: () => rowsOf(['Suo Gân']).rows,
      letters: () => wholeList,
      onMissing,
    });
    rail.el.querySelector<HTMLButtonElement>('[data-letter="Z"]')?.click();
    expect(onMissing).toHaveBeenCalledWith('Z');
  });
});
