// @vitest-environment node
/**
 * The daily sight-read's run of days (docs/04 §2).
 *
 * The one streak in this app, and the reason it is allowed to exist is that it
 * measures a habit that costs three minutes: `02` Part A §8 is explicit that a
 * missed weekday breaks nothing, which is why the minutes in Today's header
 * are weekly. So the rule here has to be the *kind* one — a day that is not
 * over yet has not been missed — and a real gap has to reset it, or the number
 * means nothing.
 *
 * Every day here is written out as a literal rather than derived from the
 * clock: the whole question is what the function does with a particular
 * arrangement of days, and deriving them with the same arithmetic the function
 * uses would prove only that it agrees with itself.
 */
import { describe, expect, it } from 'vitest';
import { dailyReadStreak, readToday } from '../../src/data/progressStore';

/** Noon, so no test can be moved across a boundary by the runner's clock. */
const TUESDAY = new Date(2026, 8, 15, 12, 0, 0);

describe('days in a row', () => {
  it('counts the run ending today', () => {
    const days = ['2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'];
    expect(dailyReadStreak(days, TUESDAY)).toBe(4);
    expect(readToday(days, TUESDAY)).toBe(true);
  });

  it('keeps the run while today is still unread — the day is not over', () => {
    // Opening the app at breakfast on the fourth morning: three days behind,
    // nothing lost. Telling him the run was broken would be the daily-streak
    // guilt `04` §2 exists to avoid.
    const days = ['2026-09-12', '2026-09-13', '2026-09-14'];
    expect(dailyReadStreak(days, TUESDAY)).toBe(3);
    expect(readToday(days, TUESDAY)).toBe(false);
  });

  it('resets on a gap', () => {
    // Read on the 10th and 11th, then nothing on the 13th or 14th. The run
    // that reaches today is nought, however long the old one was.
    const days = ['2026-09-09', '2026-09-10', '2026-09-11'];
    expect(dailyReadStreak(days, TUESDAY)).toBe(0);
  });

  it('counts only the run that reaches here, not the longest one ever', () => {
    const days = [
      '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
      '2026-09-14', '2026-09-15',
    ];
    expect(dailyReadStreak(days, TUESDAY)).toBe(2);
  });

  it('is nought with nothing recorded, and one on the first day', () => {
    expect(dailyReadStreak([], TUESDAY)).toBe(0);
    expect(dailyReadStreak(['2026-09-15'], TUESDAY)).toBe(1);
  });

  it('counts a run that ended yesterday and no further back', () => {
    const days = ['2026-09-13', '2026-09-14'];
    expect(dailyReadStreak(days, TUESDAY)).toBe(2);
    // One more day of silence and it is gone.
    expect(dailyReadStreak(days, new Date(2026, 8, 16, 12, 0, 0))).toBe(0);
  });

  it('crosses a month boundary, which is where date arithmetic goes wrong', () => {
    const days = ['2026-08-30', '2026-08-31', '2026-09-01'];
    expect(dailyReadStreak(days, new Date(2026, 8, 1, 12, 0, 0))).toBe(3);
  });

  it('does not care what order the days were written down in', () => {
    const days = ['2026-09-15', '2026-09-13', '2026-09-14'];
    expect(dailyReadStreak(days, TUESDAY)).toBe(3);
  });
});
