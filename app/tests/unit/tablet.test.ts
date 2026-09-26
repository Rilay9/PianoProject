/**
 * The tablet breakpoint (docs/04 §7a).
 *
 * The trap the spec's wording avoids: "≥ 900 px on the **shortest side**". A
 * phone in landscape is 915 × 412 and passes a width-only test while having
 * 412 px of height to put a side panel in.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  TABLET_BARS_PER_WINDOW,
  TABLET_MIN_PX,
  barsPerWindowFor,
  isTablet,
  sidePanelProse,
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

/**
 * The lesson text beside a piece nothing opened from a rung (C4 item 6, U47).
 *
 * Since C1 a run opened from the Library or a door is held to the Settings
 * pair, and the side panel still drew the first rung listing the piece, whole
 * — its *How you'll know you've got it* paragraph quoting that rung's numbers
 * beside a run judged by other ones. The rung's teaching stays; its pass line
 * goes. Opened from the rung (`?from=`, or the rung a Today card named), the
 * run is that rung's and the text is whole.
 */
describe('the side panel says nothing about a pass the run is not held to', () => {
  const LESSONS = resolve('..', 'content', 'lessons');
  const lessons = readdirSync(LESSONS)
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({ name, text: readFileSync(join(LESSONS, name), 'utf8').replace(/\r\n/g, '\n') }));

  it('keeps the whole text for a run a rung opened', () => {
    const text = lessons.find((one) => one.name === '1.5.md')?.text ?? '';
    expect(sidePanelProse(text, true)).toBe(text);
  });

  it('drops the pass paragraph, and only it, for a run no rung opened — in every lesson', () => {
    expect(lessons.length, 'no lessons were read').toBeGreaterThan(80);
    for (const { name, text } of lessons) {
      const shown = sidePanelProse(text, false);
      expect(shown, `${name} still says how you know you have got it`).not.toMatch(/how you'll know you've got it/i);
      // The rest is there: every other paragraph, word for word.
      const paragraphs = text.split(/\n\s*\n/).filter((p) => !/^\*\*How you'll know you've got it\.\*\*/.test(p.trim()));
      for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') continue;
        expect(shown, `${name} lost a paragraph that is not the pass line`).toContain(paragraph.trim());
      }
    }
  });
});
