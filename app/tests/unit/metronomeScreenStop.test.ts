// @vitest-environment jsdom
/**
 * What the Metronome screen leaves behind when it stops.
 *
 * The beat dot is deliberately painted *late* — one `setTimeout` per scheduled
 * click, delayed until the click actually sounds, so the flash does not run up
 * to a look-ahead window ahead of the sound (`MetronomeScreen.onBeat`). Those
 * timers were never cleared, so Stop left up to a window's worth of them
 * pending: a dot lit up about 100 ms after the metronome had stopped and stayed
 * lit, and on unmount they went on painting a section no longer in the
 * document.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { MetronomeBeat } from '../../src/audio/Metronome';

/** Ticks the screen subscribed to, so the test can fire a beat itself. */
const ticks: ((beat: MetronomeBeat) => void)[] = [];
const started = { count: 0, stopped: 0, disposed: 0 };

vi.mock('../../src/audio/AudioEngine', () => {
  const context = { currentTime: 0, sampleRate: 48_000 };
  return {
    audioEngine: {
      ensureStarted: () => Promise.resolve(context as unknown as AudioContext),
      get contextOrNull() {
        return context as unknown as AudioContext;
      },
      masterGain: null,
    },
  };
});

vi.mock('../../src/audio/Metronome', () => ({
  Metronome: class {
    constructor() {
      started.count += 1;
    }
    start() {}
    stop() {
      started.stopped += 1;
    }
    dispose() {
      started.disposed += 1;
    }
    setBpm() {}
    setBeatsPerBar() {}
    setSound() {}
    onTick(cb: (beat: MetronomeBeat) => void) {
      ticks.push(cb);
      return () => undefined;
    }
  },
}));

const { MetronomeScreen } = await import('../../src/ui/screens/MetronomeScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const router = { navigate: vi.fn() } as unknown as Router;

/** A beat that sounds 80 ms from now — inside the look-ahead window. */
function beat(beatInBar: number): MetronomeBeat {
  return {
    index: beatInBar - 1,
    timeSec: 0.08,
    bar: 1,
    beatInBar,
    isCountIn: false,
    isAccent: beatInBar === 1,
  };
}

describe('the Metronome screen after Stop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ticks.length = 0;
    started.count = 0;
    started.stopped = 0;
    started.disposed = 0;
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('leaves no dot lit by a click that was already scheduled', async () => {
    const section = MetronomeScreen(router);
    document.body.replaceChildren(section);

    section.querySelector<HTMLButtonElement>('#metronome-start')?.click();
    await vi.waitFor(() => {
      expect(started.count).toBe(1);
    });

    // A click is scheduled; its dot is due in 80 ms.
    for (const tick of ticks) tick(beat(2));
    const dots = () => [...section.querySelectorAll('.beat-dot')];
    expect(dots().filter((d) => d.classList.contains('is-active'))).toHaveLength(0);

    // Stop lands first, while that paint is still pending.
    section.querySelector<HTMLButtonElement>('#metronome-start')?.click();
    expect(section.dataset.running).toBe('false');

    // Time passes. Nothing may light up on a stopped metronome.
    vi.advanceTimersByTime(500);
    expect(dots().filter((d) => d.classList.contains('is-active'))).toHaveLength(0);
  });

  it('paints nothing after the screen is disposed', async () => {
    const section = MetronomeScreen(router);
    document.body.replaceChildren(section);
    section.querySelector<HTMLButtonElement>('#metronome-start')?.click();
    await vi.waitFor(() => {
      expect(started.count).toBe(1);
    });
    for (const tick of ticks) tick(beat(3));

    disposeScreen(section);
    expect(started.stopped).toBe(1);

    vi.advanceTimersByTime(500);
    const active = [...section.querySelectorAll('.beat-dot.is-active')];
    expect(active).toHaveLength(0);
  });

  /** The dot still has to light when the metronome is actually running. */
  it('still lights the dot on a beat while running', async () => {
    const section = MetronomeScreen(router);
    document.body.replaceChildren(section);
    section.querySelector<HTMLButtonElement>('#metronome-start')?.click();
    await vi.waitFor(() => {
      expect(started.count).toBe(1);
    });

    for (const tick of ticks) tick(beat(2));
    vi.advanceTimersByTime(100);
    const active = [...section.querySelectorAll('.beat-dot.is-active')];
    expect(active).toHaveLength(1);
    expect([...section.querySelectorAll('.beat-dot')].indexOf(active[0] as Element)).toBe(1);
  });
});
