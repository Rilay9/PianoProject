/**
 * The tablet breakpoint (docs/04 §7a).
 *
 * The trap the spec's wording avoids: "≥ 900 px on the **shortest side**". A
 * phone in landscape is 915 × 412 and passes a width-only test while having
 * 412 px of height to put a side panel in.
 */
import { describe, expect, it } from 'vitest';
import {
  TABLET_BARS_PER_WINDOW,
  TABLET_MIN_PX,
  barsPerWindowFor,
  isTablet,
} from '../../src/ui/tablet';

describe('isTablet', () => {
  it('is true for a tablet in either orientation', () => {
    expect(isTablet(1024, 1366)).toBe(true);
    expect(isTablet(1366, 1024)).toBe(true);
    expect(isTablet(TABLET_MIN_PX, TABLET_MIN_PX)).toBe(true);
  });

  it('is false for a phone, including in landscape', () => {
    expect(isTablet(412, 915)).toBe(false);
    // The one that a width-only check gets wrong.
    expect(isTablet(915, 412)).toBe(false);
  });

  it('is false one pixel short on either side', () => {
    expect(isTablet(TABLET_MIN_PX - 1, 2000)).toBe(false);
    expect(isTablet(2000, TABLET_MIN_PX - 1)).toBe(false);
  });
});

describe('barsPerWindowFor', () => {
  it('leaves the phone alone', () => {
    expect(barsPerWindowFor(2, { tablet: false })).toBe(2);
    expect(barsPerWindowFor(2)).toBe(2);
  });

  it('opens a tablet at four bars when the setting was never touched', () => {
    expect(barsPerWindowFor(2, { tablet: true, storedIsDefault: true })).toBe(
      TABLET_BARS_PER_WINDOW,
    );
  });

  it('never overrides a number the owner chose', () => {
    // The tablet figure is a default for a screen with room for it, not an
    // opinion about what he wants.
    expect(barsPerWindowFor(6, { tablet: true, storedIsDefault: false })).toBe(6);
    expect(barsPerWindowFor(1, { tablet: true, storedIsDefault: false })).toBe(1);
  });
});
