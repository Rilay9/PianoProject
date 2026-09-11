// Which page the PDF viewer's background detector reaches next, once the
// page the reader opened on is already showing (handoff-2026-09-09 §5).
import { describe, expect, it } from 'vitest';
import { backgroundDetectionOrder } from '../../src/pdf/detectionOrder';

describe('backgroundDetectionOrder', () => {
  it('starts at the opening page and fans out both directions', () => {
    expect(backgroundDetectionOrder(5, 2)).toEqual([2, 3, 1, 4, 0]);
  });

  it('visits every page exactly once', () => {
    const order = backgroundDetectionOrder(400, 137);
    expect(order).toHaveLength(400);
    expect(new Set(order).size).toBe(400);
    for (const page of order) expect(page).toBeGreaterThanOrEqual(0);
    for (const page of order) expect(page).toBeLessThan(400);
  });

  it('clamps a starting page outside the document', () => {
    expect(backgroundDetectionOrder(3, 99)).toEqual([2, 1, 0]);
    expect(backgroundDetectionOrder(3, -5)).toEqual([0, 1, 2]);
  });

  it('handles the edges of the document', () => {
    expect(backgroundDetectionOrder(4, 0)).toEqual([0, 1, 2, 3]);
    expect(backgroundDetectionOrder(4, 3)).toEqual([3, 2, 1, 0]);
  });

  it('returns nothing for an empty document', () => {
    expect(backgroundDetectionOrder(0, 0)).toEqual([]);
  });

  it('returns just the one page for a single-page document', () => {
    expect(backgroundDetectionOrder(1, 0)).toEqual([0]);
  });
});
