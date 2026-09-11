// @vitest-environment jsdom
/**
 * Today's session-length picker remembers which day it belongs to
 * (`docs/handoff-2026-09-09.md` §5j, `TodayScreen.ts:67-76`).
 *
 * `minutes` used to be read once at construction with `new Date()`, but the
 * length chip's click handler re-asked the clock for "is this a weekend"
 * at *click* time. A screen opened Friday night and left open (the tab kept
 * in the background rather than rebuilt) carried the weekday figure in
 * `minutes` across midnight; a tap on a chip after midnight then filed that
 * figure into `weekendSessionMinutes` because the write asked the clock
 * again and got Saturday. The fix freezes one `now` for the screen's whole
 * life and uses it for both the initial read and every write, so the two
 * never disagree about which day the session belongs to.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
  allItems: () => Promise.resolve([]),
}));

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
const { getSettings, updateSettings } = await import('../../src/data/settingsStore');

const router = { navigate: vi.fn() } as unknown as Router;

// 2024-01-05 is a Friday (weekday); 2024-01-06 is a Saturday (weekend).
const FRIDAY_LATE = new Date(2024, 0, 5, 23, 59, 30);
const SATURDAY_EARLY = new Date(2024, 0, 6, 0, 0, 30);

describe("Today's session length across a midnight rollover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FRIDAY_LATE);
    // Distinct, easily-told-apart values so a write landing in the wrong
    // bucket is unmistakable.
    updateSettings({ weekdaySessionMinutes: 15, weekendSessionMinutes: 120 });
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('writes a tap to the day the screen was opened on, not the day the tap lands on', async () => {
    // Opened Friday night: the weekday figure is what is read and shown.
    const section = TodayScreen(router);
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector('#today-length-15')?.getAttribute('aria-pressed')).toBe('true');
    });

    // The tab stays open, unrebuilt, and the clock crosses into Saturday.
    vi.setSystemTime(SATURDAY_EARLY);

    // A tap that changes the length — still, from the screen's point of
    // view, a Friday-night session.
    const chip60 = section.querySelector<HTMLButtonElement>('#today-length-60');
    expect(chip60).toBeTruthy();
    chip60?.click();
    await vi.waitFor(() => {
      expect(chip60?.getAttribute('aria-pressed')).toBe('true');
    });

    // The write belongs to the day the screen opened on (weekday): the
    // weekend figure, untouched all along, must be exactly what it was.
    expect(getSettings().weekendSessionMinutes).toBe(120);
    expect(getSettings().weekdaySessionMinutes).toBe(60);
  });
});
