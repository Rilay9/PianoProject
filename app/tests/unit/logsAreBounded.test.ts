/**
 * The two in-memory logs stay bounded however long the app runs.
 *
 * The owner asked whether the log grows for ever. Three stores had to answer:
 * `sessions` had no rule at all (`sessionRetention.test.ts` is that answer),
 * and these two had one that nothing exercised. A cap nobody runs against is a
 * comment, not a bound — so these drive each one well past its limit and check
 * the size, the contents and the fact that the newest entry is still the one
 * you get back, which is what the cap is there to protect.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  errorCount,
  loggedErrors,
  recordError,
  resetErrorLogForTest,
} from '../../src/util/errorLog';
import {
  clearRenderTimings,
  getRenderTimings,
  recordRenderTiming,
  renderTimingSummary,
} from '../../src/util/renderTiming';

describe('the error log', () => {
  beforeEach(() => {
    resetErrorLogForTest();
  });

  it('stops at fifty distinct errors, however many arrive', () => {
    for (let i = 0; i < 5_000; i += 1) recordError(`error ${String(i)}`, 'error');
    // The cap is on distinct errors; `errorCount` is how many happened.
    expect(loggedErrors()).toHaveLength(50);
    expect(errorCount()).toBe(50);
  });

  it('keeps counting a repeat after the cap, so a storm is still visible', () => {
    // The cap is on *distinct* errors. One error happening ten thousand times
    // is the interesting case and it must not be lost to the cap.
    recordError('the same one', 'error');
    for (let i = 0; i < 60; i += 1) recordError(`filler ${String(i)}`, 'error');
    for (let i = 0; i < 10_000; i += 1) recordError('the same one', 'error');
    const entry = loggedErrors().find((e) => e.message === 'the same one');
    expect(entry?.count).toBe(10_001);
    // Fifty rows held; the total says ten thousand happened, which is the
    // whole point of counting a repeat rather than dropping it.
    expect(loggedErrors()).toHaveLength(50);
    expect(errorCount()).toBe(10_050);
  });

  it('is empty again after a reset, so one test cannot fill another', () => {
    for (let i = 0; i < 100; i += 1) recordError(`error ${String(i)}`, 'error');
    resetErrorLogForTest();
    expect(loggedErrors()).toHaveLength(0);
    expect(errorCount()).toBe(0);
  });
});

describe('the render timing log', () => {
  beforeEach(() => {
    clearRenderTimings();
  });

  it('keeps the last two hundred and no more', () => {
    for (let i = 0; i < 20_000; i += 1) recordRenderTiming('window.swap', i);
    const rows = getRenderTimings();
    expect(rows).toHaveLength(200);
    // The *last* two hundred: a ring that dropped the newest instead of the
    // oldest would be the same length and useless.
    expect(rows.map((r) => r.ms)).toContain(19_999);
    expect(rows.map((r) => r.ms)).not.toContain(0);
  });

  it('summarises only what it still holds', () => {
    for (let i = 0; i < 1_000; i += 1) recordRenderTiming('osmd.render', 5);
    for (let i = 0; i < 10; i += 1) recordRenderTiming('window.swap', 1);
    const summary = renderTimingSummary();
    const total = summary.reduce((n, row) => n + row.stats.n, 0);
    expect(total).toBe(200);
    // And it is the last two hundred: the ten swaps are all still there and
    // the thousand renders have been cut down to what is left of the ring.
    expect(summary.find((row) => row.label === 'window.swap')?.stats.n).toBe(10);
    expect(summary.find((row) => row.label === 'osmd.render')?.stats.n).toBe(190);
  });
});
