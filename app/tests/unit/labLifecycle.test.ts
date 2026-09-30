// @vitest-environment jsdom
/**
 * The lab's jam, trading fours, while the page is hidden (backlog X15;
 * convergence CL05).
 *
 * The app plays two bars, the learner answers two, and each answer is judged
 * on two facts: did they come in inside their own bars, and how many notes
 * were in the scale. A phone locked mid-jam used to keep the loop and the
 * trades going: the app's calls sounded into a pocket, and every answer bar
 * that went by unseen came back as *You did not come in*. Now hidden stops the
 * loop and the call and holds the bar; visible counts in and resumes on the
 * bar that was sounding, from its downbeat, and the learner's window is their
 * bars as they heard them — the notes of the interrupted bar are dropped with
 * it, and the window moves with the bars.
 *
 * The real screen, with the metronome, kit and piano replaced by doubles that
 * keep time on the faked clock (see `chordChartLifecycle.test.ts` for the
 * metronome's numbering) and an audio clock that reads the same clock, so a
 * beat's audio time and a key's input time are one timeline. Nothing is heard.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

const { FakeMetronome, metronomes, keys, piano } = vi.hoisted(() => {
  const made: InstanceType<typeof Fake>[] = [];
  class Fake {
    bpm = 90;
    beatsPerBar = 4;
    countInBars = 1;
    private timer: ReturnType<typeof setInterval> | null = null;
    private first: ReturnType<typeof setTimeout> | null = null;
    private index = 0;
    private readonly listeners = new Set<(beat: unknown) => void>();
    constructor() {
      made.push(this);
    }
    get running(): boolean {
      return this.timer !== null;
    }
    onTick(cb: (beat: unknown) => void): () => void {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
    }
    setBpm(bpm: number): void {
      this.bpm = bpm;
    }
    setBeatsPerBar(beats: number): void {
      this.beatsPerBar = beats;
    }
    setCountInBars(bars: number): void {
      this.countInBars = bars;
    }
    setVolume(): void {}
    setSound(): void {}
    start(): void {
      this.stop();
      this.index = 0;
      this.first = setTimeout(() => this.emit(), 0);
      this.timer = setInterval(() => this.emit(), 60_000 / this.bpm);
    }
    stop(): void {
      if (this.first !== null) clearTimeout(this.first);
      if (this.timer !== null) clearInterval(this.timer);
      this.first = null;
      this.timer = null;
    }
    dispose(): void {
      this.stop();
      this.listeners.clear();
    }
    private emit(): void {
      const index = this.index;
      this.index += 1;
      const beat = {
        index,
        timeSec: performance.now() / 1000,
        bar: Math.floor(index / this.beatsPerBar) - this.countInBars + 1,
        beatInBar: (index % this.beatsPerBar) + 1,
        isCountIn: index < this.countInBars * this.beatsPerBar,
        isAccent: index % this.beatsPerBar === 0,
      };
      for (const listener of [...this.listeners]) listener(beat);
    }
  }
  const noteListeners = new Set<(event: unknown) => void>();
  return {
    FakeMetronome: Fake,
    metronomes: made,
    keys: {
      listeners: noteListeners,
      press(midi: number): void {
        for (const listener of [...noteListeners]) listener({ kind: 'noteOn', midi, velocity: 90, tMs: performance.now() });
        for (const listener of [...noteListeners]) listener({ kind: 'noteOff', midi, velocity: 0, tMs: performance.now() });
      },
    },
    piano: {
      start: vi.fn((_note: { midi: number; timeSec?: number }) => () => undefined),
      stop: vi.fn(),
      playChord: vi.fn(),
    },
  };
});

vi.mock('../../src/app/services', () => {
  const context = {
    get currentTime(): number {
      return performance.now() / 1000;
    },
  };
  return {
    audioEngine: { ensureStarted: () => Promise.resolve(context), masterGain: null, contextOrNull: context },
    getPiano: () => Promise.resolve(piano),
    screenKeyboardSource: {
      onNote: (cb: (event: unknown) => void) => {
        keys.listeners.add(cb);
        return () => keys.listeners.delete(cb);
      },
      noteOn: vi.fn(),
      noteOff: vi.fn(),
    },
    webMidiSource: { onNote: () => () => undefined },
  };
});

vi.mock('../../src/audio/Metronome', () => ({ Metronome: FakeMetronome }));

vi.mock('../../src/audio/backingLoop', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/audio/backingLoop')>();
  return {
    ...original,
    DrumKit: class {
      setVolume(): void {}
      play(): void {}
      dispose(): void {}
    },
  };
});

vi.mock('../../src/data/importStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/data/importStore')>()),
  addImport: vi.fn(),
  deleteImport: vi.fn(),
  importSummaries: vi.fn(() => Promise.resolve([])),
  updateImport: vi.fn(),
}));

vi.mock('../../src/data/midiSettings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/data/midiSettings')>()),
  getMidiSettings: () => ({ metronomeVolume: 0.5, pianoVolume: 0.8, pinnedInputId: null }),
}));

vi.mock('../../src/data/settingsStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/settingsStore')>();
  return { ...original, getSettings: () => ({ ...original.getSettings(), countInBars: 0 }) };
});

const { LabScreen } = await import('../../src/ui/screens/LabScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* jsdom has no layout */
};

let visibility: 'visible' | 'hidden' = 'visible';
let mounted: HTMLElement | null = null;

function setVisibility(next: 'visible' | 'hidden'): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

async function flush(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await vi.advanceTimersByTimeAsync(0);
}

async function play(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

function text(id: string): string {
  return document.querySelector(`#${id}`)?.textContent ?? '';
}

/** C, in every key and scale this jam uses. */
const IN_SCALE = 60;

/**
 * Trading two bars each at ♩=120 over the default eight-bar progression: a bar
 * is two seconds, the app has 0–4 s, the learner 4–8 s, the app 8–12 s, and
 * so on. Started at t = 0.
 */
async function trading(): Promise<HTMLElement> {
  const router = {
    route: { tab: 'library', lab: true },
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateLesson: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  } as unknown as Router;
  const section = LabScreen(router);
  mounted = section;
  document.body.replaceChildren(section);
  const bpm = section.querySelector<HTMLInputElement>('#lab-bpm');
  expect(bpm).not.toBeNull();
  (bpm as HTMLInputElement).value = '120';
  bpm?.dispatchEvent(new Event('change'));
  section.querySelector<HTMLButtonElement>('#lab-trade-2')?.click();
  section.querySelector<HTMLButtonElement>('#lab-jam-start')?.click();
  await flush();
  expect(section.dataset.jam).toBe('running');
  expect(text('lab-jam-form')).toBe('Bar 1 of 8 · pass 1');
  return section;
}

/** Answers on the learner's downbeat, a fifth of a second in, from time `atMs`. */
async function answerAt(nowMs: number, atMs: number): Promise<void> {
  await play(atMs - nowMs);
  keys.press(IN_SCALE);
}

beforeEach(() => {
  metronomes.length = 0;
  keys.listeners.clear();
  piano.start.mockClear();
  piano.stop.mockClear();
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date', 'requestAnimationFrame'],
  });
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('trading fours while the page is hidden', () => {
  it('20 s, hidden 5 min, 10 s: the trade clock reads 30 s', async () => {
    await trading();
    await answerAt(0, 4_200);
    await answerAt(4_200, 12_200);
    await play(20_000 - 12_200);
    // Bar 11 of the run: the learner's third trade has just begun.
    expect(text('lab-jam-form')).toBe('Bar 3 of 8 · pass 2');
    expect(text('lab-trade')).toContain('Your turn');
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    keys.press(IN_SCALE);
    await play(10_000);
    // Bar 16 of the run: the learner's fourth trade, after the app's call.
    expect(text('lab-jam-form')).toBe('Bar 8 of 8 · pass 2');
    expect(text('lab-trade')).toContain('Your turn');
    // The third trade was theirs, in on their bars, across the hidden span.
    expect(text('lab-trade-verdict')).toMatch(/^In on your own bars/);
  });

  it('is never charged with bars it did not show, and drops the notes of the bar it cut', async () => {
    await trading();
    await answerAt(0, 4_200);
    await play(8_000 - 4_200);
    expect(text('lab-trade-verdict')).toMatch(/^In on your own bars/);
    // Into the learner's next trade (12–16 s): a note, then hidden a second into it.
    await answerAt(8_000, 12_200);
    await play(13_000 - 12_200);
    setVisibility('hidden');
    piano.start.mockClear();
    await play(5 * 60_000);
    const formWhileHidden = text('lab-jam-form');
    const callsWhileHidden = piano.start.mock.calls.length;
    setVisibility('visible');
    await flush();
    // Nothing new has been judged: the verdict on screen is still the last one earned.
    expect(text('lab-trade-verdict'), 'hidden bars were judged').toMatch(/^In on your own bars/);
    expect(formWhileHidden, 'the jam moved while the page was hidden').toBe('Bar 7 of 8 · pass 1');
    expect(callsWhileHidden, 'the app’s calls sounded into a hidden page').toBe(0);
    expect(text('lab-jam-form')).toBe('Bar 7 of 8 · pass 1');
    // The bar that was cut comes round again; the learner plays in it, and the
    // trade ends two bars of *heard* time after it began.
    await play(200);
    keys.press(IN_SCALE);
    await play(3_900);
    expect(text('lab-trade')).toContain('Listen');
    expect(text('lab-trade-verdict')).toMatch(/^In on your own bars · 1 of 1/);
  });

  it('a jam whose audio comes up after the page hid waits, then starts from the top', async () => {
    const router = {
      route: { tab: 'library', lab: true },
      navigate: vi.fn(),
      navigateScore: vi.fn(),
      navigateLesson: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
    } as unknown as Router;
    const section = LabScreen(router);
    mounted = section;
    document.body.replaceChildren(section);
    section.querySelector<HTMLButtonElement>('#lab-trade-2')?.click();
    section.querySelector<HTMLButtonElement>('#lab-jam-start')?.click();
    // Hidden before the audio engine and the samples have answered.
    setVisibility('hidden');
    piano.start.mockClear();
    await flush();
    await play(60_000);
    expect(metronomes.at(-1)?.running, 'the loop started into a hidden page').toBe(false);
    expect(piano.start, 'the first call sounded into a hidden page').not.toHaveBeenCalled();
    setVisibility('visible');
    await flush();
    expect(metronomes.at(-1)?.running).toBe(true);
    expect(text('lab-jam-form')).toBe('Bar 1 of 8 · pass 1');
    expect(piano.start).toHaveBeenCalled();
  });

  it('a call cut off by hiding goes on from the bar it was in when the page comes back', async () => {
    await trading();
    // The app's third call is bars 9–10 of the run, 16–20 s.
    await play(16_000);
    const call = piano.start.mock.calls
      .map((entry) => entry[0])
      .filter((note) => (note.timeSec ?? 0) >= 16 && (note.timeSec ?? 0) < 20);
    expect(call.length, 'the call has no notes, so this proves nothing').toBeGreaterThan(0);
    const secondBar = call.filter((note) => (note.timeSec ?? 0) >= 18);
    expect(secondBar.length, 'the call has nothing in its second bar').toBeGreaterThan(0);
    // Half a bar into the call's second bar.
    await play(3_000);
    setVisibility('hidden');
    expect(piano.stop, 'the call was left ringing').toHaveBeenCalled();
    piano.start.mockClear();
    await play(60_000);
    expect(piano.start).not.toHaveBeenCalled();
    setVisibility('visible');
    await flush();
    const resumedAt = performance.now() / 1000;
    // The second bar of the call again, from its downbeat, and nothing of the first.
    const again = piano.start.mock.calls.map((entry) => entry[0]);
    expect(again.map((note) => note.midi)).toEqual(secondBar.map((note) => note.midi));
    const shift = resumedAt - 18;
    again.forEach((note, i) => {
      expect(note.timeSec).toBeCloseTo((secondBar[i]?.timeSec ?? 0) + shift, 6);
    });
  });
});
