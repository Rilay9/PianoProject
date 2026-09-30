// @vitest-environment jsdom
/**
 * The shared suspended state and the attempt clock (`screenLifecycle.ts`;
 * backlog X15; convergence CL05).
 *
 * Two primitives the four practice screens now share. `onScreenSuspend` says
 * when: hidden once per hidden span, visible once per return, gone with the
 * screen. `activeClock` is one attempt's practice time: visible time only
 * (Part 20 §4). It is deliberately not the session clock in `sessionRunner.ts`
 * — that is the session's guided time, this a card's duration (the reviewer,
 * `responses/questions-e71ef3ad.md` §CL05: "keep the semantics aligned by
 * tests") — so the last case here runs both over one hidden span.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { newRun, readSessionRun, resetSessionRunForTest, startSessionRun } from '../../src/data/sessionRun';
import { dayKey } from '../../src/data/progressStore';
import { sessionHandle } from '../../src/ui/sessionRunner';
import { activeClock, disposeScreen, onScreenSuspend, pageHidden } from '../../src/ui/screenLifecycle';

let visibility: 'visible' | 'hidden' = 'visible';

function setVisibility(next: 'visible' | 'hidden'): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the attempt clock counts visible time only', () => {
  it('20 s, hidden 5 min, 10 s is 30 s (Part 20 §4)', () => {
    const clock = activeClock();
    vi.advanceTimersByTime(20_000);
    setVisibility('hidden');
    vi.advanceTimersByTime(5 * 60_000);
    setVisibility('visible');
    vi.advanceTimersByTime(10_000);
    expect(clock.elapsedMs()).toBe(30_000);
    clock.dispose();
  });

  it('hidden and shown again and again, it adds up the visible spans and nothing else', () => {
    const clock = activeClock();
    let visible = 0;
    for (const [on, off] of [
      [3_000, 60_000],
      [7_000, 1],
      [11_000, 45 * 60_000],
      [1, 2_000],
    ] as const) {
      vi.advanceTimersByTime(on);
      visible += on;
      setVisibility('hidden');
      vi.advanceTimersByTime(off);
      // Reading it while hidden does not count the hidden time either.
      expect(clock.elapsedMs()).toBe(visible);
      setVisibility('visible');
    }
    vi.advanceTimersByTime(4_000);
    expect(clock.elapsedMs()).toBe(visible + 4_000);
    clock.dispose();
  });

  it('a pagehide after the page went hidden is one hidden span, not two', () => {
    const clock = activeClock();
    vi.advanceTimersByTime(5_000);
    setVisibility('hidden');
    window.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(60_000);
    setVisibility('visible');
    vi.advanceTimersByTime(5_000);
    expect(clock.elapsedMs()).toBe(10_000);
    clock.dispose();
  });

  it('restart is a new attempt; dispose stops it where it was', () => {
    const clock = activeClock();
    vi.advanceTimersByTime(8_000);
    clock.restart();
    vi.advanceTimersByTime(2_000);
    expect(clock.elapsedMs()).toBe(2_000);
    clock.dispose();
    vi.advanceTimersByTime(60_000);
    setVisibility('hidden');
    setVisibility('visible');
    vi.advanceTimersByTime(60_000);
    expect(clock.elapsedMs()).toBe(2_000);
  });

  it('made while hidden, it starts counting when the page is first seen', () => {
    visibility = 'hidden';
    expect(pageHidden()).toBe(true);
    const clock = activeClock();
    vi.advanceTimersByTime(60_000);
    setVisibility('visible');
    vi.advanceTimersByTime(3_000);
    expect(clock.elapsedMs()).toBe(3_000);
    clock.dispose();
  });

  it('goes with the screen it was made for', () => {
    const screen = document.createElement('section');
    const clock = activeClock(screen);
    vi.advanceTimersByTime(4_000);
    disposeScreen(screen);
    vi.advanceTimersByTime(4_000);
    expect(clock.elapsedMs()).toBe(4_000);
  });
});

describe('onScreenSuspend', () => {
  it('hidden once per hidden span, visible once per return, nothing after the screen goes', () => {
    const screen = document.createElement('section');
    const calls: string[] = [];
    onScreenSuspend(screen, { onHidden: () => calls.push('hidden'), onVisible: () => calls.push('visible') });
    setVisibility('hidden');
    window.dispatchEvent(new Event('pagehide'));
    setVisibility('hidden');
    setVisibility('visible');
    setVisibility('visible');
    expect(calls).toEqual(['hidden', 'visible']);
    // A pagehide on its own (the back-forward cache) is a hidden span too, and pageshow its return.
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('pageshow'));
    expect(calls).toEqual(['hidden', 'visible', 'hidden', 'visible']);
    disposeScreen(screen);
    setVisibility('hidden');
    setVisibility('visible');
    expect(calls).toEqual(['hidden', 'visible', 'hidden', 'visible']);
  });

  it('never calls visible while the document still says hidden', () => {
    const screen = document.createElement('section');
    const calls: string[] = [];
    onScreenSuspend(screen, { onHidden: () => calls.push('hidden'), onVisible: () => calls.push('visible') });
    setVisibility('hidden');
    window.dispatchEvent(new Event('pageshow'));
    expect(calls).toEqual(['hidden']);
    setVisibility('visible');
    expect(calls).toEqual(['hidden', 'visible']);
    disposeScreen(screen);
  });
});

describe('the attempt clock and the session clock agree', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetSessionRunForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  it('over one screen’s visible and hidden time, both count the same visible milliseconds', async () => {
    await startSessionRun(
      newRun({
        day: dayKey(new Date()),
        sessionId: 'align0001',
        version: 'v',
        startedAt: new Date().toISOString(),
        activities: [
          { order: 0, token: 'aligna001', slot: { kind: 'new', itemId: 'song.a', title: 'A', minutes: 10 }, route: { target: 'drill', itemId: 'song.a' }, reason: 'r' },
        ],
        outside: [],
      }),
    );
    const stopSession = sessionHandle('aligna001')?.startClock();
    const attempt = activeClock();
    // `sessionClock.test.ts`'s own sequence, then the map's.
    for (const [on, off] of [
      [10_000, 30 * 60_000],
      [5_000, 5 * 60_000],
      [20_000, 1_000],
    ] as const) {
      vi.advanceTimersByTime(on);
      setVisibility('hidden');
      vi.advanceTimersByTime(off);
      setVisibility('visible');
    }
    vi.advanceTimersByTime(10_000);
    stopSession?.();
    const want = 10_000 + 5_000 + 20_000 + 10_000;
    expect(attempt.elapsedMs()).toBe(want);
    await vi.waitFor(async () => {
      const read = await readSessionRun();
      expect(read.kind === 'run' ? read.run.elapsedMs : -1).toBe(want);
    });
    attempt.dispose();
  });
});
