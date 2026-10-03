// @vitest-environment jsdom
/**
 * Time accrues only while a guided activity's screen is on and the page is visible (X1; the protocol's *Time*,
 * the reviewer's required change): hidden time — the phone locked, another app, the tab in the background —
 * accrues nothing, and neither does the time after the screen is gone; the transition shows elapsed from
 * this clock, never wall time since *Start session*. The screen's clock through the runner's handle
 * (`SessionHandle.startClock`), a faked clock and a controlled `visibilityState`, over the real store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { newRun, readSessionRun, resetSessionRunForTest, startSessionRun } from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { CLOCK_FLUSH_MS, sessionHandle } from '../../src/ui/sessionRunner';

let visibility: 'visible' | 'hidden' = 'visible';

beforeEach(() => {
  useFakeIndexedDb();
  resetSessionRunForTest();
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
});
afterEach(() => {
  vi.useRealTimers();
  clearFakeIndexedDb();
});

function setVisibility(next: 'visible' | 'hidden'): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

async function elapsed(): Promise<number> {
  const read = await readSessionRun();
  return read.kind === 'run' ? read.run.elapsedMs : -1;
}

describe('the visible-time clock', () => {
  it('visible time counts; hidden time and time after the screen is gone do not', async () => {
    await startSessionRun(
      newRun({
        day: dayKey(new Date()),
        sessionId: 'clock0001',
        version: 'v',
        startedAt: new Date().toISOString(),
        activities: [{ order: 0, token: 'clocka001', slot: { kind: 'new', itemId: 'song.a', title: 'A', minutes: 10 }, route: { target: 'score', itemId: 'song.a' }, reason: 'r' }],
        outside: [],
      }),
    );
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
    const handle = sessionHandle('clocka001');
    const stop = handle?.startClock();
    // Ten seconds on the screen, then the phone is locked for half an hour.
    vi.advanceTimersByTime(10_000);
    setVisibility('hidden');
    await vi.waitFor(async () => expect(await elapsed()).toBe(10_000));
    vi.advanceTimersByTime(30 * 60_000);
    // Back for five seconds, then the screen goes.
    setVisibility('visible');
    vi.advanceTimersByTime(5_000);
    stop?.();
    await vi.waitFor(async () => expect(await elapsed()).toBe(15_000));
    // After the screen is gone, nothing more.
    vi.advanceTimersByTime(10 * CLOCK_FLUSH_MS);
    expect(await elapsed()).toBe(15_000);
  });

  it('while visible, the clock writes as it goes, so a closed app keeps the time up to its last flush', async () => {
    await startSessionRun(
      newRun({
        day: dayKey(new Date()),
        sessionId: 'clock0002',
        version: 'v',
        startedAt: new Date().toISOString(),
        activities: [{ order: 0, token: 'clockb001', slot: { kind: 'new', itemId: 'song.a', title: 'A', minutes: 10 }, route: { target: 'score', itemId: 'song.a' }, reason: 'r' }],
        outside: [],
      }),
    );
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
    sessionHandle('clockb001')?.startClock();
    vi.advanceTimersByTime(CLOCK_FLUSH_MS);
    await vi.waitFor(async () => expect(await elapsed()).toBe(CLOCK_FLUSH_MS));
  });
});
