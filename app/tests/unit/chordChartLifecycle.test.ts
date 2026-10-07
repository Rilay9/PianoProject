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

const { FakeMetronome, metronomes, kits, settings, playChordSpy, pianoStopSpy, barScheduleSpy, chart } = vi.hoisted(() => {
  const made: InstanceType<typeof Fake>[] = [];
  const kitsMade: { disposed: boolean; played: number }[] = [];
  type Shape = (bar: number) => { beats: number; beatScale?: number };
  class Fake {
    bpm = 90;
    beatsPerBar = 4;
    countInBars = 1;
    starts = 0;
    /** Every `setBeatsPerBar` the chart made, in order (MT1). */
    readonly beatsPerBarCalls: number[] = [];
    /** The beats handed out, as the listeners heard them (MT1). */
    readonly heard: { bar: number; beatInBar: number; isCountIn: boolean; isAccent: boolean; at: number }[] = [];
    /** Count-in beats of the latest start. */
    countInBeats = 0;
    private timer: ReturnType<typeof setInterval> | null = null;
    private first: ReturnType<typeof setTimeout> | null = null;
    private live = false;
    private index = 0;
    private shape: Shape | null = null;
    private bar = 1;
    private beatInBar = 1;
    private beatsHere = 4;
    private scale = 1;
    private readonly listeners = new Set<(beat: unknown) => void>();
    constructor() {
      made.push(this);
    }
    get running(): boolean {
      return this.live;
    }
    /**
     * The real one's per-bar shape (`BeatScheduler`'s `barShape`, MT1): each bar numbered by its own beat count,
     * the count-in in bar 1's, each beat as long as its bar's scale says.
     */
    setBarShape(shape: Shape | null): void {
      this.shape = shape;
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
      this.beatsPerBarCalls.push(beats);
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
      this.live = true;
      if (this.shape) {
        const opening = this.shape(1);
        this.beatsHere = Math.max(1, Math.trunc(opening.beats));
        this.scale = opening.beatScale ?? 1;
        this.countInBeats = this.countInBars * this.beatsHere;
        this.bar = 1 - this.countInBars;
        this.beatInBar = 1;
        this.first = setTimeout(() => this.emitShaped(), 0);
        return;
      }
      this.countInBeats = this.countInBars * this.beatsPerBar;
      this.first = setTimeout(() => this.emit(), 0);
      this.timer = setInterval(() => this.emit(), 60_000 / this.bpm);
    }
    stop(): void {
      if (this.first !== null) clearTimeout(this.first);
      if (this.timer !== null) clearInterval(this.timer);
      this.first = null;
      this.timer = null;
      this.live = false;
    }
    private emitShaped(): void {
      const index = this.index;
      this.index += 1;
      const beat = {
        index,
        timeSec: performance.now() / 1000,
        bar: this.bar,
        beatInBar: this.beatInBar,
        isCountIn: index < this.countInBeats,
        isAccent: this.beatInBar === 1,
      };
      // This beat lasts its own bar's beat; the next bar's shape is read as this one ends.
      this.first = setTimeout(() => this.emitShaped(), (60_000 / this.bpm) * this.scale);
      if (this.beatInBar >= this.beatsHere) {
        this.bar += 1;
        this.beatInBar = 1;
        if (this.bar >= 1 && this.shape) {
          const next = this.shape(this.bar);
          this.beatsHere = Math.max(1, Math.trunc(next.beats));
          this.scale = next.beatScale ?? 1;
        }
      } else this.beatInBar += 1;
      this.heard.push({ bar: beat.bar, beatInBar: beat.beatInBar, isCountIn: beat.isCountIn, isAccent: beat.isAccent, at: beat.timeSec });
      for (const listener of [...this.listeners]) listener(beat);
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
      this.heard.push({ bar: beat.bar, beatInBar: beat.beatInBar, isCountIn: beat.isCountIn, isAccent: beat.isAccent, at: beat.timeSec });
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
    barScheduleSpy: vi.fn((_options: { beatsPerBar: number }) => [{ kind: 'kick', atBeat: 0 }]),
    /** The chart the import store hands the screen, and its catalog tempo (MT1's cases swap both). */
    chart: { xml: '', tempoBpm: 120 },
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
  barSchedule: barScheduleSpy,
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
  getImport: () => Promise.resolve({ data: chart.xml }),
}));

vi.mock('../../src/curriculum/load', () => ({
  contentUrl: (path: string) => path,
  // ♩ = 120: a 4/4 bar is exactly two seconds.
  findItem: () => Promise.resolve({ id: 'demo', title: 'Demo chart', imported: true, file: null, concepts: [], tempoBpm: chart.tempoBpm }),
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
  chart.xml = FOUR_BARS;
  chart.tempoBpm = 120;
  playChordSpy.mockClear();
  pianoStopSpy.mockClear();
  barScheduleSpy.mockClear();
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

/**
 * The chart counts each bar in its written metre (MT1; the reviewer's ruling, `docs/review/responses/
 * ph1-g6a-landing.md` §4). Before MT1 every bar was four quarter clicks: a 3/4 bar a beat late, a 6/8 bar four
 * quarters, the comp held three quarters into the next 3/4 downbeat, and Bass + drums played its 4/4 pattern
 * over any metre. Red cases 2, 3 and 5 of the brief, through the screen with the clock faked.
 */
function metred(bars: [number, number][]): string {
  const roots = ['C', 'F', 'G', 'D'];
  let last = '';
  const body = bars.map(([beats, beatType], i) => {
    const written = `${String(beats)}/${String(beatType)}`;
    const time = written === last ? '' : `<attributes><divisions>2</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time></attributes>`;
    last = written;
    return `<measure number="${String(i + 1)}">${time}<harmony><root><root-step>${roots[i % roots.length] ?? 'C'}</root-step></root><kind>major</kind></harmony><note><pitch><step>C</step><octave>4</octave></pitch><duration>${String((beats * 8) / beatType)}</duration></note></measure>`;
  });
  return `<score-partwise><part id="P1">${body.join('')}</part></score-partwise>`;
}

const four = (metre: [number, number]): [number, number][] => [metre, metre, metre, metre];
/** Mr Lawrence's shape in four bars: 3/4, then 4/4 (the bundled chart changes at bar 17). */
const LAWRENCE: [number, number][] = [[3, 4], [3, 4], [4, 4], [4, 4]];

function beatsOfBar(bar: number): number[] {
  return metronome().heard.filter((b) => !b.isCountIn && b.bar === bar).map((b) => b.beatInBar);
}

describe('the chart counts each bar in its written metre (MT1)', () => {
  it.each([
    ['2/4', [2, 4], 2],
    ['3/4', [3, 4], 3],
    ['4/4', [4, 4], 4],
    ['5/4', [5, 4], 5],
    ['6/8', [6, 8], 2],
    ['12/8', [12, 8], 4],
    ['2/2', [2, 2], 2],
  ] as [string, [number, number], number][])('%s: the metronome counts %j as %i beats (red case 2)', async (_written, metre, beats) => {
    chart.xml = metred(four(metre));
    await started();
    expect(metronome().beatsPerBarCalls.at(-1)).toBe(beats);
    await play(30_000);
    // Every full bar heard has that many beats, the first of them the accent.
    for (const bar of [1, 2, 3]) expect(beatsOfBar(bar), `bar ${String(bar)}`).toEqual(Array.from({ length: beats }, (_, i) => i + 1));
    expect(metronome().heard.filter((b) => !b.isCountIn && b.bar <= 3).filter((b) => b.isAccent).length).toBe(3);
  });

  it('3/4 at ♩ = 120: the bar advances every three beats, 1.5 s (red case 3)', async () => {
    chart.xml = metred(four([3, 4]));
    await started();
    await play(1_400);
    expect(form()).toBe('Bar 1 of 4 · chorus 1');
    await play(200);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
  });

  it('6/8 at ♩ = 120: two dotted-quarter beats of 0.75 s, the bar advancing every 1.5 s (red case 3)', async () => {
    chart.xml = metred(four([6, 8]));
    await started();
    expect(document.querySelector<HTMLInputElement>('#chart-bpm')?.value).toBe('80');
    expect(metronome().bpm).toBe(80);
    await play(1_400);
    expect(form()).toBe('Bar 1 of 4 · chorus 1');
    await play(200);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
    const at = metronome().heard.map((b) => b.at);
    // Beats at 0, 0.75 and 1.5 s heard by 1.6 s.
    expect(at.slice(1).map((t, i) => Math.round((t - (at[i] ?? 0)) * 1000))).toEqual([750, 750]);
  });

  it('across a metre change the new bar’s first beat is the accent and carries the new count; the chorus wraps back to 3/4', async () => {
    chart.xml = metred(LAWRENCE);
    await started();
    await play(2_900);
    expect(form()).toBe('Bar 2 of 4 · chorus 1');
    await play(200);
    expect(form()).toBe('Bar 3 of 4 · chorus 1');
    await play(5_500);
    expect(form()).toBe('Bar 2 of 4 · chorus 2');
    expect([beatsOfBar(1), beatsOfBar(2), beatsOfBar(3), beatsOfBar(4), beatsOfBar(5)]).toEqual([
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3, 4],
      [1, 2, 3, 4],
      [1, 2, 3],
    ]);
    const heard = metronome().heard;
    const start = heard[0]?.at ?? 0;
    expect(heard.filter((b) => b.isAccent).map((b) => Math.round((b.at - start) * 1000))).toEqual([0, 1500, 3000, 5000, 7000, 8500]);
  });

  it('suspended mid-bar 3 (4/4) and resumed: a four-beat count-in, then bar 3 from its downbeat', async () => {
    settings.countInBars = 1;
    chart.xml = metred(LAWRENCE);
    await started();
    // The opening count-in is in bar 1's metre: three beats.
    expect(metronome().countInBeats).toBe(3);
    // Count-in 1.5 s, bar 1 1.5 s, bar 2 1.5 s, then a second into bar 3.
    await play(5_500);
    expect(form()).toBe('Bar 3 of 4 · chorus 1');
    setVisibility('hidden');
    await play(60_000);
    const from = metronome().heard.length;
    setVisibility('visible');
    await flush();
    expect(metronome().countInBeats, 'the resume counted in in the wrong metre').toBe(4);
    await play(3_900);
    expect(form()).toBe('Bar 3 of 4 · chorus 1');
    await play(200);
    expect(form()).toBe('Bar 4 of 4 · chorus 1');
    const after = metronome().heard.slice(from);
    expect(after.filter((b) => b.isCountIn).length).toBe(4);
    expect(after.filter((b) => !b.isCountIn && b.bar === 1).map((b) => b.beatInBar)).toEqual([1, 2, 3, 4]);
  });

  it('the comp holds three quarters of each bar: 4/4 exactly as before, 3/4 ending before the next downbeat (red case 5)', async () => {
    chart.xml = metred(LAWRENCE);
    await started();
    await play(6_900);
    // ♩ = 120, a quarter is 0.5 s: 3/4 holds 2.25 quarters (a 1.5 s bar), 4/4 three quarters as before.
    expect(playChordSpy.mock.calls.slice(0, 4).map((call) => call[1] as number)).toEqual([1.125, 1.125, 1.5, 1.5]);
  });

  it.each([
    ['2/4', [2, 4]],
    ['3/4', [3, 4]],
    ['5/4', [5, 4]],
    ['6/8', [6, 8]],
    ['12/8', [12, 8]],
    ['2/2', [2, 2]],
  ] as [string, [number, number]][])('%s: Bass + drums is refused, and nothing is scheduled with it pressed (red case 5)', async (written, metre) => {
    chart.xml = metred(four(metre));
    const section = await started();
    const chip = section.querySelector<HTMLButtonElement>('#chart-backing');
    expect(chip?.disabled).toBe(true);
    expect(chip?.getAttribute('aria-disabled')).toBe('true');
    expect(chip?.getAttribute('aria-pressed')).toBe('false');
    expect(section.querySelector('#chart-backing-note')?.textContent).toContain(`this chart is in ${written}`);
    await play(10_000);
    expect(barScheduleSpy).not.toHaveBeenCalled();
    expect(kits.every((kit) => kit.played === 0)).toBe(true);
  });

  it('3/4 specifically: the old unsourced “jazz waltz” comment in backingLoop.ts does not authorise chart backing', async () => {
    chart.xml = metred(four([3, 4]));
    await started();
    await play(10_000);
    expect(barScheduleSpy.mock.calls.map((call) => call[0].beatsPerBar)).toEqual([]);
  });

  it('a chart that changes metre refuses it too, and says which metre', async () => {
    chart.xml = metred(LAWRENCE);
    const section = await started();
    expect(section.querySelector<HTMLButtonElement>('#chart-backing')?.disabled).toBe(true);
    expect(section.querySelector('#chart-backing-note')?.textContent).toContain('this chart has bars in 3/4');
    await play(10_000);
    expect(barScheduleSpy).not.toHaveBeenCalled();
  });

  it('4/4, written or unwritten: Bass + drums is offered and plays today’s four-beat bar', async () => {
    for (const xml of [metred(four([4, 4])), FOUR_BARS]) {
      chart.xml = xml;
      barScheduleSpy.mockClear();
      const section = await started();
      expect(section.querySelector<HTMLButtonElement>('#chart-backing')?.disabled).toBe(false);
      expect(section.querySelector('#chart-backing-note')).toBeNull();
      await play(4_100);
      expect(barScheduleSpy.mock.calls.map((call) => call[0].beatsPerBar)).toEqual([4, 4, 4]);
      disposeScreen(mounted);
      mounted = null;
    }
  });
});
