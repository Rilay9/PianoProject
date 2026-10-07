// @vitest-environment jsdom
/**
 * The chord chart while the page is hidden (backlog X15; convergence CL05).
 *
 * A chart running when the phone locks used to keep counting — the metronome,
 * the bass and drums and the comp all went on into a pocket, and the chart
 * came back choruses ahead. Stopping it with the screen's own *Stop* and
 * starting it with *Count off ▶* would have been worse the other way: `start()`
 * rewinds to bar 1. Now hidden silences all three and holds the bar; visible
 * counts in again (the count-in the learner set, as *Count off ▶* does) and
 * resumes on the bar that was sounding, from its downbeat.
 *
 * `chordChart.test.ts` hand-fires beats at a metronome that never keeps time,
 * which is right for what it proves and cannot show time passing while hidden.
 * This file's metronome keeps time on the faked clock with the real one's
 * numbering (`BeatScheduler`: count-in bars are 0, −1, …; bar 1 beat 1 is the
 * first downbeat after them; `start()` numbers from there again).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

const { FakeMetronome, metronomes, kits, settings, playChordSpy, pianoStopSpy } = vi.hoisted(() => {
  const made: InstanceType<typeof Fake>[] = [];
  const kitsMade: { disposed: boolean; played: number }[] = [];
  class Fake {
    bpm = 90;
    beatsPerBar = 4;
    countInBars = 1;
    starts = 0;
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
    /**
     * The first beat on the next turn of the clock, as the real one's is: its
     * `start()` schedules bar 1 a tenth of a second ahead and hands it over on
     * the scheduler's next wake, never inside `start()` itself.
     */
    start(): void {
      this.stop();
      this.starts += 1;
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
  return {
    FakeMetronome: Fake,
    metronomes: made,
    kits: kitsMade,
    settings: { countInBars: 0 },
    playChordSpy: vi.fn(),
    pianoStopSpy: vi.fn(),
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
    getPiano: () => Promise.resolve({ playChord: playChordSpy, stop: pianoStopSpy, start: vi.fn() }),
    screenKeyboardSource: { onNote: () => () => undefined, noteOn: vi.fn(), noteOff: vi.fn() },
    webMidiSource: { onNote: () => () => undefined },
  };
});

vi.mock('../../src/audio/Metronome', () => ({ Metronome: FakeMetronome }));

vi.mock('../../src/audio/backingLoop', () => ({
  DrumKit: class {
    private readonly record = { disposed: false, played: 0 };
    constructor() {
      kits.push(this.record);
    }
    setVolume(): void {}
    play(): void {
      this.record.played += 1;
    }
    dispose(): void {
      this.record.disposed = true;
    }
  },
  barSchedule: () => [{ kind: 'kick', atBeat: 0 }],
}));

vi.mock('../../src/data/midiSettings', () => ({
  getMidiSettings: () => ({ metronomeVolume: 0.5, pianoVolume: 0.8, pinnedInputId: null }),
}));

vi.mock('../../src/data/settingsStore', () => ({
  getSettings: () => ({ countInBars: settings.countInBars, metronomeSound: 'wood', requireTwoSongs: false }),
}));

function measure(number: number, root: string): string {
  return `<measure number="${String(number)}"><harmony><root><root-step>${root}</root-step></root><kind>major</kind></harmony></measure>`;
}

const FOUR_BARS = `<score-partwise><part id="P1">${measure(1, 'C')}${measure(2, 'F')}${measure(3, 'G')}${measure(4, 'C')}</part></score-partwise>`;

vi.mock('../../src/data/importStore', () => ({
  getImport: () => Promise.resolve({ data: FOUR_BARS }),
}));

vi.mock('../../src/curriculum/load', () => ({
  contentUrl: (path: string) => path,
  // ♩ = 120: a 4/4 bar is exactly two seconds.
  findItem: () => Promise.resolve({ id: 'demo', title: 'Demo chart', imported: true, file: null, concepts: [], tempoBpm: 120 }),
}));

const { ChordChartScreen } = await import('../../src/ui/screens/ChordChartScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

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

function form(): string {
  return document.querySelector('#chart-form')?.textContent ?? '';
}

function metronome(): InstanceType<typeof FakeMetronome> {
  const last = metronomes[metronomes.length - 1];
  expect(last, 'no metronome was made').toBeDefined();
  return last as InstanceType<typeof FakeMetronome>;
}

/** Mounted with *Comp* and *Bass + drums* on, then *Count off ▶*. */
async function started(): Promise<HTMLElement> {
  const section = ChordChartScreen({ route: {}, navigate: vi.fn(), navigateScore: vi.fn(), navigateLesson: vi.fn() } as unknown as Router, 'demo');
  mounted = section;
  document.body.replaceChildren(section);
  await flush();
  const start = section.querySelector<HTMLButtonElement>('#chart-start');
  expect(start, 'the chart never loaded').not.toBeNull();
  section.querySelector<HTMLButtonElement>('#chart-comp')?.click();
  section.querySelector<HTMLButtonElement>('#chart-backing')?.click();
  start?.click();
  await flush();
  expect(metronome().running).toBe(true);
  return section;
}

beforeEach(() => {
  metronomes.length = 0;
  kits.length = 0;
  settings.countInBars = 0;
  playChordSpy.mockClear();
  pianoStopSpy.mockClear();
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

describe('the chord chart while the page is hidden', () => {
  it('20 s, hidden 5 min, 10 s: the chart reads 30 s into the form', async () => {
    await started();
    await play(20_000);
    // Bar 11 of the run: bar 3, third chorus.
    expect(form()).toBe('Bar 3 of 4 · chorus 3');
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    await play(10_000);
    // Bar 16 of the run: bar 4, fourth chorus.
    expect(form()).toBe('Bar 4 of 4 · chorus 4');
  });

  it('goes silent while hidden and comes back on the bar it left, not ahead and not at bar 1', async () => {
    await started();
    await play(3_000);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
    const compsBefore = playChordSpy.mock.calls.length;
    expect(compsBefore, 'the comp never sounded, so this proves nothing').toBe(2);
    setVisibility('hidden');
    expect(metronome().running, 'the click kept going into a hidden page').toBe(false);
    expect(kits.every((kit) => kit.disposed), 'the bass and drums kept going into a hidden page').toBe(true);
    expect(pianoStopSpy, 'the comp chord was left ringing').toHaveBeenCalled();
    await play(5 * 60_000);
    expect(form(), 'the chart moved while the page was hidden').toBe('Bar 2 of 4 · chorus 1');
    expect(playChordSpy.mock.calls.length, 'the comp sounded into a hidden page').toBe(compsBefore);
    setVisibility('visible');
    await flush();
    expect(form(), 'the chart did not come back on the bar it left').toBe('Bar 2 of 4 · chorus 1');
    expect(metronome().running).toBe(true);
    // Bar 2 again, from its downbeat: its chord comps again, and the drums with it.
    expect(playChordSpy.mock.calls.length).toBe(compsBefore + 1);
    expect(kits.at(-1)?.disposed).toBe(false);
    await play(2_000);
    expect(form()).toBe('Bar 3 of 4 · chorus 1');
  });

  it('hidden and shown again and again, the chart has counted only the visible time', async () => {
    await started();
    // Three visible spans on bar lines, each followed by a different hidden one.
    for (const [visibleMs, hiddenMs] of [
      [6_000, 60_000],
      [4_000, 2 * 60_000],
      [8_000, 10 * 60_000],
    ] as const) {
      await play(visibleMs);
      setVisibility('hidden');
      await play(hiddenMs);
      setVisibility('visible');
      await flush();
    }
    await play(2_000);
    // 20 s visible: bar 11 of the run.
    expect(form()).toBe('Bar 3 of 4 · chorus 3');
    // One metronome, started once by *Count off ▶* and once per return; never two clicking.
    expect(metronomes).toHaveLength(1);
    expect(metronome().starts).toBe(4);
  });

  it('counts in again on return, holding the bar through the count', async () => {
    settings.countInBars = 1;
    await started();
    // One bar of count-in, then bars 1 and 2.
    await play(2_000 + 3_000);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
    const comps = playChordSpy.mock.calls.length;
    setVisibility('hidden');
    await play(60_000);
    setVisibility('visible');
    await flush();
    await play(1_900);
    expect(form(), 'the count-in moved the chart').toBe('Bar 2 of 4 · chorus 1');
    expect(playChordSpy.mock.calls.length, 'the comp came in during the count-in').toBe(comps);
    await play(100);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
    expect(playChordSpy.mock.calls.length).toBe(comps + 1);
    await play(2_000);
    expect(form()).toBe('Bar 3 of 4 · chorus 1');
  });

  it('a count-off whose audio comes up after the page hid waits, then starts from the top', async () => {
    const section = ChordChartScreen({ route: {}, navigate: vi.fn(), navigateScore: vi.fn(), navigateLesson: vi.fn() } as unknown as Router, 'demo');
    mounted = section;
    document.body.replaceChildren(section);
    await flush();
    section.querySelector<HTMLButtonElement>('#chart-start')?.click();
    // Hidden before the audio engine has answered.
    setVisibility('hidden');
    await flush();
    await play(60_000);
    expect(metronome().running, 'the click started into a hidden page').toBe(false);
    expect(form()).toBe('Bar 1 of 4 · chorus 1');
    setVisibility('visible');
    await flush();
    expect(metronome().running).toBe(true);
    await play(2_000);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
  });

  it('Stop, then hidden and shown, starts nothing', async () => {
    const section = await started();
    await play(3_000);
    section.querySelector<HTMLButtonElement>('#chart-stop')?.click();
    setVisibility('hidden');
    setVisibility('visible');
    await flush();
    await play(4_000);
    expect(metronome().running).toBe(false);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
  });
});
