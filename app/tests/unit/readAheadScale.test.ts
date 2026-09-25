// The read-ahead cap on the sideways fit (`08` §4.1 CHUNK).
//
// The slide holds the bar being played between a quarter and a third of the
// way across the stage — a third when there is room, a quarter when the bar
// is wide. The height chooses the size; this caps it so that the widest bar
// and the first note of the next both fit to the right of the quarter — the
// owner's requirement that the beginning of the next music is always on the
// glass while the current bar is played. Pure arithmetic, so it is checked
// here in the unit it is stated in, and end to end by `score.layout.spec`.
import { describe, expect, it } from 'vitest';
import { MIN_STAFF_PX, NEXT_NOTE_PEEK_STAVES, readAheadScale, SLIDE_TARGET_MIN } from '../../src/score/WindowRenderer';

/** The fit's inset, as `08` §4 states it: the ink stops this short of the edge. */
const INSET = 6;
/** The next note's room, in staves (`NEXT_NOTE_PEEK_STAVES`): the renderer's own number. */
const PEEK_STAVES = NEXT_NOTE_PEEK_STAVES;
/**
 * A staff, as the renderer measures it since T38: its five lines, four staff
 * spaces — 80 px at engraving zoom 2. It was 151 here, the engraver's
 * staff-line box on Twinkle, notes and all, which is what "staff" used to mean.
 */
const STAFF = 80;

describe('readAheadScale', () => {
  it('is no limit at all while nothing has been measured', () => {
    expect(readAheadScale(880, 0, STAFF)).toBe(Infinity);
    expect(readAheadScale(0, 353, STAFF)).toBe(Infinity);
    expect(readAheadScale(880, Number.NaN, STAFF)).toBe(Infinity);
  });

  it('caps the scale so the widest bar and the next note fit right of the leftmost slide target', () => {
    // The room right of the target is what is left of the width after the
    // slide's smallest fraction and the inset; the bar needs itself and the
    // next bar's first note, which is a fixed size on the staff.
    const stage = 880;
    const bar = 353;
    const staff = STAFF;
    const scale = readAheadScale(stage, bar, staff);
    const drawnBar = bar * scale;
    const drawnPeek = staff * PEEK_STAVES * scale;
    const start = stage * SLIDE_TARGET_MIN;
    // The bar itself ends inside the stage, with the next note still on it.
    expect(start + drawnBar).toBeLessThan(stage);
    expect(start + drawnBar + drawnPeek).toBeLessThanOrEqual(stage - INSET + 1e-9);
    // And not smaller than it has to be: a hair more and the note is off the glass.
    expect(start + (drawnBar + drawnPeek) * 1.02).toBeGreaterThan(stage - INSET);
  });

  it('prices the read-ahead as a note, not as a share of the bar', () => {
    // A bar twice as wide needs the same note after it, so the cap falls by
    // less than half: the note does not grow with the bar it follows.
    const narrow = readAheadScale(880, 200, STAFF);
    const wide = readAheadScale(880, 400, STAFF);
    expect(wide).toBeLessThan(narrow);
    expect(wide).toBeGreaterThan(narrow / 2);
  });

  it('asks for a beat of the next bar while the staff is not yet known', () => {
    // Before the probe has measured, the staff is 0 and a quarter of the bar
    // stands in for the note — the rule as first stated, and always a
    // *larger* ask than the note for any bar wider than two staves, so the
    // measurement can only let the sheet grow, never shrink it mid-run.
    const stage = 880;
    const bar = 353;
    const unknown = readAheadScale(stage, bar, 0);
    expect(stage * SLIDE_TARGET_MIN + bar * unknown * 1.25).toBeLessThanOrEqual(stage - INSET + 1e-9);
    expect(unknown).toBeLessThanOrEqual(readAheadScale(stage, bar, STAFF));
  });

  it('is monotonic: a wider bar or a narrower stage means a smaller sheet', () => {
    expect(readAheadScale(880, 353, STAFF)).toBeLessThan(readAheadScale(880, 207, STAFF));
    expect(readAheadScale(740, 353, STAFF)).toBeLessThan(readAheadScale(880, 353, STAFF));
  });

  it('never goes below the readable staff, whatever the bar costs', () => {
    // A bar so wide that fitting it would draw the staff at a fraction of
    // its floor: the floor wins and the bar is slid past instead.
    const staff = STAFF;
    const scale = readAheadScale(880, 20_000, staff);
    expect(staff * scale).toBeCloseTo(MIN_STAFF_PX, 5);
    // The floor is a floor, not a value: a bar that fits above it is unaffected.
    expect(readAheadScale(880, 353, staff)).toBeGreaterThan(MIN_STAFF_PX / staff);
  });

  it('leaves a piece of narrow bars to the height', () => {
    // Twinkle's widest bar sideways: the cap is well above any scale the
    // height of a phone allows, so the height decides, as it always did.
    expect(readAheadScale(880, 207, STAFF)).toBeGreaterThan(2);
  });
});
