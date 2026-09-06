/**
 * Reordering arithmetic (docs/04 §3).
 *
 * Off-by-one is the whole risk here: moving an item downwards removes it from
 * before the target and moving it upwards does not, so a naive splice pair
 * lands in the wrong place exactly half the time. Track order decides what the
 * session builder recommends next, so getting it wrong changes what the app
 * tells the owner to practise.
 */
import { describe, expect, it } from 'vitest';
import {
  DRAG_THRESHOLD_PX,
  indexAtPoint,
  isDrag,
  moveDown,
  moveItem,
  moveUp,
} from '../../src/ui/reorder';

const LIST = ['a', 'b', 'c', 'd'];

describe('moveItem', () => {
  it('moves an item to the top', () => {
    expect(moveItem(LIST, 2, 0)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('moves an item to the bottom', () => {
    expect(moveItem(LIST, 0, 3)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('moves down by one — the case a naive splice pair gets wrong', () => {
    expect(moveItem(LIST, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('moves up by one', () => {
    expect(moveItem(LIST, 3, 2)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('is a no-op when nothing moves', () => {
    expect(moveItem(LIST, 1, 1)).toEqual(LIST);
  });

  it('clamps a target past either end rather than dropping the item', () => {
    expect(moveItem(LIST, 1, -5)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveItem(LIST, 1, 99)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('never mutates the list it was given', () => {
    const original = [...LIST];
    moveItem(LIST, 0, 3);
    expect(LIST).toEqual(original);
  });

  it('ignores an index that is not in the list', () => {
    expect(moveItem(LIST, 9, 0)).toEqual(LIST);
    expect(moveItem(LIST, -1, 0)).toEqual(LIST);
  });

  it('keeps every item, always', () => {
    for (let from = 0; from < LIST.length; from += 1) {
      for (let to = 0; to < LIST.length; to += 1) {
        const out = moveItem(LIST, from, to);
        expect([...out].sort()).toEqual([...LIST].sort());
        expect(out).toHaveLength(LIST.length);
      }
    }
  });
});

describe('moveUp and moveDown', () => {
  it('step one place', () => {
    expect(moveUp(LIST, 2)).toEqual(['a', 'c', 'b', 'd']);
    expect(moveDown(LIST, 1)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('do nothing at the ends', () => {
    expect(moveUp(LIST, 0)).toEqual(LIST);
    expect(moveDown(LIST, 3)).toEqual(LIST);
  });
});

describe('indexAtPoint', () => {
  const boxes = [
    { left: 0, right: 50, top: 0, bottom: 20 },
    { left: 60, right: 110, top: 0, bottom: 20 },
    { left: 120, right: 170, top: 0, bottom: 20 },
  ];

  it('finds the box the pointer is inside', () => {
    expect(indexAtPoint(boxes, 70, 10)).toBe(1);
    expect(indexAtPoint(boxes, 0, 0)).toBe(0);
  });

  it('falls back to the nearest when the pointer is between or outside', () => {
    // A drag that strays above the row should still do something sensible.
    expect(indexAtPoint(boxes, 130, 200)).toBe(2);
    expect(indexAtPoint(boxes, 55, 10)).toBe(0);
    expect(indexAtPoint(boxes, 1000, 10)).toBe(2);
  });

  it('has nothing to say about an empty row', () => {
    expect(indexAtPoint([], 10, 10)).toBe(null);
  });
});

describe('isDrag', () => {
  it('is false for a tap that wobbles', () => {
    // A chip is a toggle first. Without this every slightly imprecise tap on a
    // phone would reorder the list instead of switching the track on.
    expect(isDrag(1, 1)).toBe(false);
    expect(isDrag(DRAG_THRESHOLD_PX - 1, 0)).toBe(false);
  });

  it('is true once the pointer has really travelled', () => {
    expect(isDrag(DRAG_THRESHOLD_PX, 0)).toBe(true);
    expect(isDrag(0, -DRAG_THRESHOLD_PX)).toBe(true);
  });
});
