// @vitest-environment jsdom
/**
 * The chord chart's beat handler (`docs/handoff-2026-09-09.md`, this round).
 *
 * `onBeat` decided "a new bar started" by comparing the bar index it derived
 * from `beat.bar` against the one already drawn. That comparison is false on
 * the very first beat of *every* run — bar 1 beat 1 derives to index 0, which
 * is what `bar` is initialised to — so the first bar of every chord-chart
 * performance played with no comp, no fresh match and no backing loop; only
 * bar 2 onwards ever comped. A one-bar chart (a vamp, a single held chord)
 * never recovers from that at all: the derived index is 0 on *every* beat, so
 * nothing after the initial draw ever ran again and the chorus counter never
 * moved no matter how many times the loop went round.
 *
 * `barAt` now derives the chorus from `beat.bar` directly instead of
 * incrementing on a "wrapped to 0" guess, and a `barStarted` flag makes sure
 * the very first beat is never mistaken for "nothing changed".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import { toMusicXml } from '../../src/score/mxl';

const { playChordSpy, pianoStartSpy, pianoStopSpy, cancels, metronomeState, clock, keys, kitPlays } = vi.hoisted(() => {
  /** Each scheduled piano note's own stop (PH2: a strike not yet sounded is cancelled through it). */
  const made: ReturnType<typeof vi.fn>[] = [];
  return {
    playChordSpy: vi.fn(),
    cancels: made,
    pianoStartSpy: vi.fn((_note: { midi: number; timeSec?: number; durationSec?: number; velocity?: number }) => {
      const cancel = vi.fn();
      made.push(cancel);
      return cancel;
    }),
    pianoStopSpy: vi.fn(),
    metronomeState: { listeners: [] as ((beat: unknown) => void)[] },
    /**
     * The audio clock (PH2): `currentTime` is set by each test. `withBacking` hands it to the bass and drums as
     * well (`audioEngine.contextOrNull`); off, the backing has no context and schedules nothing, as before PH2.
     */
    clock: { currentTime: 0, withBacking: false },
    keys: { listeners: [] as ((event: { kind: 'noteOn' | 'noteOff'; midi: number }) => void)[] },
    /** What the bass and drums were told to play, with its audio-clock time. */
    kitPlays: [] as { kind: string; midi?: number; atBeat: number; when: number }[],
  };
});

vi.mock('../../src/app/services', () => ({
  audioEngine: {
    ensureStarted: () => Promise.resolve(clock),
    masterGain: null,
    get contextOrNull() {
      return clock.withBacking ? clock : null;
    },
  },
  getPiano: () => Promise.resolve({ playChord: playChordSpy, start: pianoStartSpy, stop: pianoStopSpy }),
  screenKeyboardSource: {
    onNote: (listener: (event: { kind: 'noteOn' | 'noteOff'; midi: number }) => void) => {
      keys.listeners.push(listener);
      return () => {
        keys.listeners = keys.listeners.filter((l) => l !== listener);
      };
    },
    noteOn: vi.fn(),
    noteOff: vi.fn(),
  },
  webMidiSource: { onNote: () => () => undefined },
}));

vi.mock('../../src/audio/Metronome', () => ({
  Metronome: class {
    onTick(cb: (beat: unknown) => void): () => void {
      metronomeState.listeners.push(cb);
      return () => {
        metronomeState.listeners = metronomeState.listeners.filter((l) => l !== cb);
      };
    }
    setBpm(): void {}
    setBeatsPerBar(): void {}
    setBarShape(): void {}
    setCountInBars(): void {}
    setVolume(): void {}
    setSound(): void {}
    start(): void {}
    stop(): void {}
    dispose(): void {}
  },
}));

// The real `barSchedule` (PH2 asks it for each harmony's bass), a kit that records what it is told to play.
vi.mock('../../src/audio/backingLoop', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/audio/backingLoop')>()),
  DrumKit: class {
    setVolume(): void {}
    play(event: { kind: string; midi?: number; atBeat: number }, when: number): void {
      kitPlays.push({ ...event, when });
    }
    dispose(): void {}
  },
}));

vi.mock('../../src/data/midiSettings', () => ({
  getMidiSettings: () => ({ metronomeVolume: 0.5, pianoVolume: 0.8, pinnedInputId: null }),
}));

vi.mock('../../src/data/settingsStore', () => ({
  getSettings: () => ({ countInBars: 0, metronomeSound: 'wood', requireTwoSongs: false }),
}));

let currentXml = '';
vi.mock('../../src/data/importStore', () => ({
  getImport: () => Promise.resolve({ data: currentXml }),
}));

let currentTempoBpm: number | undefined;
vi.mock('../../src/curriculum/load', () => ({
  contentUrl: (path: string) => path,
  findItem: () =>
    Promise.resolve({
      id: 'demo',
      title: 'Demo chart',
      imported: true,
      file: null,
      concepts: [],
      tempoBpm: currentTempoBpm,
    }),
}));

const { ChordChartScreen } = await import('../../src/ui/screens/ChordChartScreen');

const router = {
  route: {},
  navigate: vi.fn(),
  navigateScore: vi.fn(),
  navigateLesson: vi.fn(),
} as unknown as Router;

function measure(number: number, root: string): string {
  return `<measure number="${String(number)}"><harmony><root><root-step>${root}</root-step></root><kind>major</kind></harmony></measure>`;
}

async function mountAndStart(xml: string): Promise<HTMLElement> {
  currentXml = xml;
  const section = ChordChartScreen(router, 'demo');
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector<HTMLButtonElement>('#chart-start')).toBeTruthy();
  });
  section.querySelector<HTMLButtonElement>('#chart-comp')?.click();
  section.querySelector<HTMLButtonElement>('#chart-start')?.click();
  await vi.waitFor(() => {
    expect(metronomeState.listeners.length).toBeGreaterThan(0);
  });
  return section;
}

function fireBeat(bar: number): void {
  const beat = { bar, beatInBar: 1, isCountIn: false, isAccent: true, index: 0, timeSec: 0 };
  for (const listener of [...metronomeState.listeners]) listener(beat);
}

describe('the chord chart comps and advances on the very first bar', () => {
  beforeEach(() => {
    metronomeState.listeners = [];
    playChordSpy.mockClear();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('comps bar 1 as soon as it starts, not only from bar 2 onward', async () => {
    const xml = `<score-partwise><part id="P1">${measure(1, 'C')}${measure(2, 'G')}</part></score-partwise>`;
    await mountAndStart(xml);

    fireBeat(1);
    await vi.waitFor(() => {
      expect(playChordSpy, 'the first bar of every performance must comp, not stay silent').toHaveBeenCalledTimes(
        1,
      );
    });
    // C major, root pitch class 0, in the comp octave: 48, 52, 55.
    expect(playChordSpy.mock.calls[0]?.[0]).toEqual([48, 52, 55]);

    fireBeat(2);
    await vi.waitFor(() => {
      expect(playChordSpy).toHaveBeenCalledTimes(2);
    });
    // G major, root pitch class 7: 55, 59, 50 (mod-12 wrapped into the octave).
    expect(playChordSpy.mock.calls[1]?.[0]).toEqual([55, 59, 50]);
  });

  it('a one-bar chart still advances the chorus and comps every time round', async () => {
    const xml = `<score-partwise><part id="P1">${measure(1, 'C')}</part></score-partwise>`;
    const section = await mountAndStart(xml);

    fireBeat(1);
    await vi.waitFor(() => expect(playChordSpy).toHaveBeenCalledTimes(1));
    expect(section.querySelector('#chart-form')?.textContent).toContain('chorus 1');

    // Bar 2 of a one-bar chart is chorus 2, bar index 0 again — the exact
    // case that never re-fired before, because the derived bar index (0)
    // never differed from the one already drawn.
    fireBeat(2);
    await vi.waitFor(() => {
      expect(playChordSpy, 'a one-bar loop never comped again after the first bar').toHaveBeenCalledTimes(2);
    });
    expect(section.querySelector('#chart-form')?.textContent).toContain('chorus 2');

    fireBeat(3);
    await vi.waitFor(() => expect(playChordSpy).toHaveBeenCalledTimes(3));
    expect(section.querySelector('#chart-form')?.textContent).toContain('chorus 3');
  });
});

describe("a catalog tempo outside the bpm field's own 40-240 range", () => {
  afterEach(() => {
    document.body.replaceChildren();
    currentTempoBpm = undefined;
  });

  /**
   * The catalog holds real pieces from 31 bpm up to 264 — both outside the
   * `#chart-bpm` field's declared `min="40" max="240"`, the same bounds a
   * manual edit is clamped to. Loading a chart used to set the field straight
   * from `item.tempoBpm` with no clamp at all, so the field disagreed with its
   * own `min`/`max` before anyone had touched it.
   */
  it.each([
    [264, '240'],
    [31, '40'],
  ])('clamps a catalog tempo of %d to %s, same as a manual edit would be', async (tempoBpm, expected) => {
    currentTempoBpm = tempoBpm;
    const xml = `<score-partwise><part id="P1">${measure(1, 'C')}</part></score-partwise>`;
    currentXml = xml;
    const section = ChordChartScreen(router, 'demo');
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector<HTMLInputElement>('#chart-bpm')?.value).toBe(expected);
    });
  });
});

/**
 * The tempo field counts the chart's beat (MT1, red case 4; the reviewer's ruling, `docs/review/responses/
 * ph1-g6a-landing.md` §4): beats a minute in the first bar's felt beat, the unit named wherever it is not a
 * quarter. The catalog's tempo is quarter notes a minute (`tempoFromXml.ts`), so the sounding tempo is the same:
 * Row, Row, Row's 81 quarters is 54 dotted quarters, Corcovado's 96 is 48 half notes, Blue Bossa's 4/4 is today's.
 */
describe('the tempo field counts the chart’s beat (MT1)', () => {
  afterEach(() => {
    document.body.replaceChildren();
    currentTempoBpm = undefined;
  });

  function metred(beats: number, beatType: number): string {
    const time = `<attributes><divisions>1</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time></attributes>`;
    return `<score-partwise><part id="P1"><measure number="1">${time}<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony></measure></part></score-partwise>`;
  }

  it.each([
    ['6/8', 6, 8, 81, '54', 'bpm (dotted quarters)', 'Tempo, in dotted quarters a minute'],
    ['6/8, the catalog’s float', 6, 8, 80.99999999999999, '54', 'bpm (dotted quarters)', 'Tempo, in dotted quarters a minute'],
    ['12/8', 12, 8, 76, '50.667', 'bpm (dotted quarters)', 'Tempo, in dotted quarters a minute'],
    ['2/2', 2, 2, 96, '48', 'bpm (half notes)', 'Tempo, in half notes a minute'],
    ['3/4', 3, 4, 192, '192', 'bpm', 'Tempo'],
    ['4/4', 4, 4, 96, '96', 'bpm', 'Tempo'],
  ] as [string, number, number, number, string, string, string][])('%s: the field opens in the beat’s unit, the unit named', async (_name, beats, beatType, tempoBpm, value, label, name) => {
    currentTempoBpm = tempoBpm;
    currentXml = metred(beats, beatType);
    const section = ChordChartScreen(router, 'demo');
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector('#chart-start')).not.toBeNull();
    });
    const field = section.querySelector<HTMLInputElement>('#chart-bpm');
    expect(field?.value).toBe(value);
    expect(section.querySelector('label[for="chart-bpm"]')?.textContent).toBe(label);
    expect(field?.getAttribute('aria-label')).toBe(name);
  });
});

/**
 * Where the chart's Back goes (`04` §3b, `?from=`, 2026-09-22).
 *
 * Entry 42 gave the Score screen `?from=<rung>` and recorded in its own *what
 * is unverified* that the chart had the same fault one screen over: a
 * hard-coded `← Library` and three dead ends that went there too, so *Chart*
 * pressed on `jazz.5`'s song row left the learner on the Library rather than
 * on the rung whose lesson describes the chart.
 */
describe('the chart’s Back', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function mountFrom(from?: string): { section: HTMLElement; router: Router; spies: {
    navigate: ReturnType<typeof vi.fn>;
    navigateLesson: ReturnType<typeof vi.fn>;
    navigateScore: ReturnType<typeof vi.fn>;
  } } {
    const spies = { navigate: vi.fn(), navigateLesson: vi.fn(), navigateScore: vi.fn() };
    const local = {
      route: from === undefined ? {} : { chartFrom: from },
      ...spies,
    } as unknown as Router;
    currentXml = `<score-partwise><part id="P1">${measure(1, 'C')}</part></score-partwise>`;
    const section = ChordChartScreen(local, 'demo');
    document.body.replaceChildren(section);
    return { section, router: local, spies };
  }

  it('is the Library when nothing says otherwise, which is every other door in', () => {
    const { section, spies } = mountFrom();
    const back = section.querySelector<HTMLButtonElement>('#chart-back');
    expect(back?.textContent).toBe('← Library');
    back?.click();
    expect(spies.navigate).toHaveBeenCalledWith('library');
    expect(spies.navigateLesson).not.toHaveBeenCalled();
  });

  it('is the rung when a rung opened it, and says so on the button', () => {
    const { section, spies } = mountFrom('jazz.5');
    const back = section.querySelector<HTMLButtonElement>('#chart-back');
    expect(back?.textContent).toBe('← Lesson');
    back?.click();
    expect(spies.navigateLesson).toHaveBeenCalledWith('jazz.5');
    expect(spies.navigate).not.toHaveBeenCalled();
  });

  it('carries the rung on through the no-chords dead end, so that Back comes here too', async () => {
    const spies = { navigate: vi.fn(), navigateLesson: vi.fn(), navigateScore: vi.fn() };
    const local = { route: { chartFrom: 'jazz.5' }, ...spies } as unknown as Router;
    // A part with no `<harmony>` at all: the dead end that offers the Score
    // screen instead, which is the one branch that does not offer a way back.
    currentXml = '<score-partwise><part id="P1"><measure number="1"/></part></score-partwise>';
    const section = ChordChartScreen(local, 'demo');
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector('#chart-open-score')).not.toBeNull();
    });
    section.querySelector<HTMLButtonElement>('#chart-open-score')?.click();
    expect(spies.navigateScore).toHaveBeenCalledWith('demo', { from: 'jazz.5' });
  });
});

/**
 * More than one chord in a bar (PH2; the reviewer's rulings, `docs/review/responses/g6-ph-briefs-cb1.md` §3 and
 * `ph1-g6a-landing.md` §2): the grid draws every segment, the Comp strikes each segment's chord at its written
 * place on the audio clock, the bass takes the harmony sounding at its beat, and the live cell judges a note
 * against the harmony sounding at the instant it is struck, re-judging what is held at each change.
 *
 * Beats are fired by hand with their audio-clock time, and the clock is set before each: a beat's callback runs
 * a little before its click (the metronome's look-ahead), which is what `clock.currentTime < timeSec` stands for.
 * At the default 100 bpm a quarter is 0.6 s. Nothing here is heard: these are what the app schedules.
 */
describe('positioned harmony on the chart (PH2)', () => {
  const BLUE_BOSSA = join(process.cwd(), '..', 'content', 'scores', 'pdmx', 'QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.mxl');
  const blueBossa = (): string => toMusicXml(new Uint8Array(readFileSync(BLUE_BOSSA)));
  /** Dmi7b5 (D F A♭ C) and G7 (G B D F) in the comp octave, as the chart voices them. */
  const D_HALF_DIMINISHED = [50, 53, 56, 48];
  const G7 = [55, 59, 50, 53];

  /** A 4/4 chart, divisions 2; each bar's events as `[root, kind, at quarter]`, the bar filled with rests. */
  function chart(bars: [string, string, number][][]): string {
    const measures = bars.map((events, i) => {
      const attributes = i === 0 ? '<attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>' : '';
      let at = 0;
      let body = '';
      for (const [root, kind, place] of events) {
        if (place > at) body += `<note><rest/><duration>${String((place - at) * 2)}</duration></note>`;
        at = Math.max(at, place);
        body += `<harmony><root><root-step>${root}</root-step></root><kind>${kind}</kind></harmony>`;
      }
      if (at < 4) body += `<note><rest/><duration>${String((4 - at) * 2)}</duration></note>`;
      return `<measure number="${String(i + 1)}">${attributes}${body}</measure>`;
    });
    return `<score-partwise><part id="P1">${measures.join('')}</part></score-partwise>`;
  }
  /** C for a beat and a half, then G7 off the beat (1.5) to the barline; then a bar of F. */
  const OFF_BEAT = chart([[['C', 'major', 0], ['G', 'dominant', 1.5]], [['F', 'major', 0]]]);

  let visibility: 'visible' | 'hidden' = 'visible';

  beforeEach(() => {
    metronomeState.listeners = [];
    keys.listeners = [];
    kitPlays.length = 0;
    cancels.length = 0;
    playChordSpy.mockClear();
    pianoStartSpy.mockClear();
    pianoStopSpy.mockClear();
    clock.currentTime = 0;
    clock.withBacking = false;
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  async function mount(xml: string, { comp = true, backing = false } = {}): Promise<HTMLElement> {
    currentXml = xml;
    const section = ChordChartScreen(router, 'demo');
    document.body.replaceChildren(section);
    await vi.waitFor(() => {
      expect(section.querySelector<HTMLButtonElement>('#chart-start')).toBeTruthy();
    });
    if (comp) section.querySelector<HTMLButtonElement>('#chart-comp')?.click();
    if (backing) section.querySelector<HTMLButtonElement>('#chart-backing')?.click();
    section.querySelector<HTMLButtonElement>('#chart-start')?.click();
    await vi.waitFor(() => {
      expect(metronomeState.listeners.length).toBeGreaterThan(0);
    });
    // Fake timers from here: the segment changes are timers on the audio clock's schedule.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    return section;
  }

  /** The metronome's beat `beatInBar` of its bar `bar`, sounding at `timeSec`, its callback run at `now`. */
  async function beat(bar: number, beatInBar: number, timeSec: number, now = timeSec): Promise<void> {
    clock.currentTime = now;
    const event = { bar, beatInBar, isCountIn: false, isAccent: beatInBar === 1, index: 0, timeSec };
    for (const listener of [...metronomeState.listeners]) listener(event);
    // The comp waits on the piano's promise.
    for (let i = 0; i < 4; i += 1) await Promise.resolve();
  }

  /** Time passes to `t` on the audio clock, and the timers due by then run. */
  async function until(t: number): Promise<void> {
    const ms = Math.max(0, (t - clock.currentTime) * 1000);
    clock.currentTime = t;
    await vi.advanceTimersByTimeAsync(Math.ceil(ms) + 1);
  }

  function press(midis: number[], kind: 'noteOn' | 'noteOff' = 'noteOn'): void {
    for (const midi of midis) for (const listener of [...keys.listeners]) listener({ kind, midi });
  }

  const cell = (section: HTMLElement, bar: number): HTMLElement | null => section.querySelector(`.chart-cell[data-bar="${String(bar)}"]`);
  const seg = (section: HTMLElement, bar: number, index: number): HTMLElement | null =>
    section.querySelector(`.chart-cell[data-bar="${String(bar)}"] .chart-seg[data-seg="${String(index)}"]`);

  it('test 2: Blue Bossa bar 16 comps Dmi7b5 at the bar’s start and G7 two quarters later, each for its own half', async () => {
    await mount(blueBossa());
    await beat(16, 1, 10);
    expect(playChordSpy.mock.calls.map((call) => call[0] as number[])).toEqual([D_HALF_DIMINISHED]);
    // Three quarters of its two-quarter segment, so it ends before G7.
    expect(playChordSpy.mock.calls[0]?.[1]).toBeCloseTo(0.9, 6);
    await beat(16, 2, 10.6, 10.52);
    expect(pianoStartSpy).not.toHaveBeenCalled();
    // Beat 3's callback runs ahead of its click: G7 is scheduled for the click itself, not struck at the callback.
    await beat(16, 3, 11.2, 11.12);
    expect(pianoStartSpy.mock.calls.map((call) => call[0].midi)).toEqual(G7);
    for (const [note] of pianoStartSpy.mock.calls) {
      expect(note.timeSec).toBeCloseTo(11.2, 6);
      expect(note.durationSec).toBeCloseTo(0.9, 6);
      expect(note.velocity).toBe(90);
    }
    expect(playChordSpy).toHaveBeenCalledTimes(1);
  });

  it('test 2: a one-chord bar comps exactly as before, one strike held three beats', async () => {
    await mount(blueBossa());
    await beat(15, 1, 10);
    await beat(15, 2, 10.6, 10.52);
    await beat(15, 3, 11.2, 11.12);
    await beat(15, 4, 11.8, 11.72);
    expect(playChordSpy).toHaveBeenCalledTimes(1);
    expect(playChordSpy.mock.calls[0]?.[1]).toBeCloseTo(1.8, 6);
    expect(pianoStartSpy).not.toHaveBeenCalled();
  });

  it('an off-beat change is scheduled between the beats, at its written place', async () => {
    await mount(OFF_BEAT);
    await beat(1, 1, 10);
    await beat(1, 2, 10.6, 10.52);
    expect(pianoStartSpy.mock.calls.map((call) => call[0].midi)).toEqual([55, 59, 50, 53]);
    for (const [note] of pianoStartSpy.mock.calls) expect(note.timeSec).toBeCloseTo(10.9, 6);
  });

  it('test 3: the live cell judges the instant a note is struck, and re-judges what is held at the change', async () => {
    const section = await mount(blueBossa(), { comp: false });
    await beat(16, 1, 10);
    expect(seg(section, 16, 0)?.dataset.sounding).toBe('true');
    await beat(16, 3, 11.2, 11.12);
    // Just before the change: a G-B-F shell against Dmi7b5 reads no, on the first segment.
    clock.currentTime = 11.19;
    press([55, 59, 65]);
    expect(seg(section, 16, 0)?.dataset.match).toBe('no');
    press([55, 59, 65], 'noteOff');
    expect(seg(section, 16, 0)?.dataset.match).toBe('idle');
    // Just after it, before the change's timer has even run: G7, yes, on the second segment.
    clock.currentTime = 11.21;
    press([55, 59, 65]);
    expect(seg(section, 16, 1)?.dataset.match).toBe('yes');
    expect(seg(section, 16, 1)?.dataset.sounding).toBe('true');
    expect(seg(section, 16, 0)?.dataset.sounding).toBe('false');
    expect(seg(section, 16, 0)?.dataset.match).toBe('idle');
    expect(cell(section, 16)?.dataset.match).toBe('yes');
  });

  it('test 3: D-F-C held across the change reads yes in Dmi7b5 and is re-judged no against G7 at the change', async () => {
    const section = await mount(blueBossa(), { comp: false });
    await beat(16, 1, 10);
    clock.currentTime = 10.5;
    press([50, 53, 60]);
    expect(seg(section, 16, 0)?.dataset.match).toBe('yes');
    await beat(16, 3, 11.2, 11.12);
    expect(seg(section, 16, 1)?.dataset.match).not.toBe('no');
    await until(11.2);
    expect(seg(section, 16, 1)?.dataset.sounding).toBe('true');
    expect(seg(section, 16, 1)?.dataset.match).toBe('no');
    // The verdict belongs to the segment it was judged against: the first keeps its yes.
    expect(seg(section, 16, 0)?.dataset.match).toBe('yes');
  });

  it('test 4 (unit half): the beat-3 bass of Blue Bossa bar 16 is G7’s, the drums and beat 1 as before', async () => {
    clock.withBacking = true;
    await mount(blueBossa(), { comp: false, backing: true });
    await beat(15, 1, 10);
    const bar15 = kitPlays.splice(0);
    await beat(16, 1, 12.4);
    const bar16 = kitPlays.splice(0);
    const bass = (plays: typeof bar15) => plays.filter((p) => p.kind === 'bass').map((p) => [p.atBeat, p.midi]);
    // Bar 16: D (Dmi7b5's root) on beat 1, then G7's fifth, D, on beat 3, where Dmi7b5's A♭ played before.
    expect(bass(bar16)).toEqual([
      [0, 38],
      [2, 38],
    ]);
    // Everything else in the bar, drums and their times, is exactly bar 15's pattern, shifted by the bar.
    const rest = (plays: typeof bar15, start: number) => plays.filter((p) => p.kind !== 'bass').map((p) => [p.kind, p.atBeat, Math.round((p.when - start) * 1e6) / 1e6]);
    expect(rest(bar16, 12.4)).toEqual(rest(bar15, 10));
  });

  /**
   * One clock for the bar (the reviewer, `docs/review/responses/ph2-look.md` §6): at Blue Bossa bar 16's written
   * second-half boundary the comp's G7, the bass's beat 3 and the live cell's segment all change together, placed
   * from the bar's own scheduler time. The bass sits the backing's 20 ms after it, as it does after every bar's
   * first comp chord (`scheduleBacking`'s "a hair ahead"); the click cadence is MT1's and untouched.
   */
  it('Blue Bossa bar 16: comp, bass and the live cell change together at beat 3', async () => {
    clock.withBacking = true;
    const section = await mount(blueBossa(), { comp: true, backing: true });
    await beat(16, 1, 10);
    const bass3 = kitPlays.find((p) => p.kind === 'bass' && p.atBeat === 2);
    await beat(16, 3, 11.2, 11.12);
    const g7 = pianoStartSpy.mock.calls.map((call) => call[0]);
    expect(g7.map((note) => note.midi)).toEqual(G7);
    const compAt = g7[0]?.timeSec ?? Number.NaN;
    expect(compAt).toBeCloseTo(11.2, 6);
    expect(bass3?.midi).toBe(38);
    expect(Math.abs((bass3?.when ?? Number.NaN) - compAt)).toBeLessThanOrEqual(0.02 + 1e-9);
    expect(seg(section, 16, 1)?.dataset.sounding).toBe('false');
    await until(11.2);
    expect(seg(section, 16, 1)?.dataset.sounding).toBe('true');
  });

  it('state: Stop mid-bar cancels the change still to come, its strike and its mark', async () => {
    const section = await mount(OFF_BEAT);
    await beat(1, 1, 10);
    await beat(1, 2, 10.6, 10.52);
    expect(cancels).toHaveLength(4);
    clock.currentTime = 10.7;
    section.querySelector<HTMLButtonElement>('#chart-stop')?.click();
    for (const cancel of cancels) expect(cancel).toHaveBeenCalled();
    await until(11);
    expect(seg(section, 1, 1)?.dataset.sounding).toBe('false');
    expect(seg(section, 1, 0)?.dataset.sounding).toBe('true');
  });

  it('state: hidden mid-bar cancels what was to come; shown again, the bar restarts from its first segment', async () => {
    const section = await mount(OFF_BEAT);
    await beat(1, 1, 10);
    await beat(1, 2, 10.6, 10.52);
    clock.currentTime = 10.7;
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    for (const cancel of cancels) expect(cancel).toHaveBeenCalled();
    await until(11);
    expect(seg(section, 1, 1)?.dataset.sounding).toBe('false');
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    playChordSpy.mockClear();
    // The metronome numbers from bar 1 again after a resume; the chart holds the bar it left.
    await beat(1, 1, 20);
    expect(section.querySelector('#chart-form')?.textContent).toBe('Bar 1 of 2 · chorus 1');
    expect(playChordSpy.mock.calls.map((call) => call[0] as number[])).toEqual([[48, 52, 55]]);
    expect(seg(section, 1, 0)?.dataset.sounding).toBe('true');
  });

  it('state: the chorus wraps to a bar 1 that opens without a symbol, carrying nothing round from the end', async () => {
    const section = await mount(chart([[['D', 'minor', 2]], [['G', 'major', 0]]]));
    await beat(1, 1, 10);
    // Bar 1 opens on nothing: no strike until Dm at beat 3.
    expect(playChordSpy).not.toHaveBeenCalled();
    expect(seg(section, 1, 0)?.textContent).toBe('—');
    await beat(2, 1, 12.4);
    expect(playChordSpy).toHaveBeenCalledTimes(1);
    await beat(3, 1, 14.8);
    expect(section.querySelector('#chart-form')?.textContent).toBe('Bar 1 of 2 · chorus 2');
    // Chorus 2's bar 1 opens on nothing again, not on bar 2's G.
    expect(playChordSpy).toHaveBeenCalledTimes(1);
    expect(seg(section, 1, 0)?.dataset.sounding).toBe('true');
    await beat(3, 3, 16, 15.92);
    expect(pianoStartSpy.mock.calls.map((call) => call[0].midi)).toEqual([50, 53, 57]);
  });

  it('state: a tempo changed mid-bar places the change by the new tempo from the next beat on', async () => {
    const section = await mount(OFF_BEAT);
    await beat(1, 1, 10);
    const bpm = section.querySelector<HTMLInputElement>('#chart-bpm');
    if (bpm) {
      bpm.value = '120';
      bpm.dispatchEvent(new Event('change'));
    }
    // Beat 2's time was fixed by the old tempo; the half beat after it is the new tempo's 0.25 s.
    await beat(1, 2, 10.6, 10.52);
    expect(pianoStartSpy).toHaveBeenCalledTimes(4);
    for (const [note] of pianoStartSpy.mock.calls) expect(note.timeSec).toBeCloseTo(10.85, 6);
  });

  it('state: Comp turned on mid-bar strikes the changes still to come; off again, it cancels them', async () => {
    const section = await mount(OFF_BEAT, { comp: false });
    await beat(1, 1, 10);
    expect(playChordSpy).not.toHaveBeenCalled();
    section.querySelector<HTMLButtonElement>('#chart-comp')?.click();
    await beat(1, 2, 10.6, 10.52);
    expect(pianoStartSpy).toHaveBeenCalledTimes(4);
    clock.currentTime = 10.7;
    section.querySelector<HTMLButtonElement>('#chart-comp')?.click();
    for (const cancel of cancels) expect(cancel).toHaveBeenCalled();
  });

  /**
   * The pickup's notated length (the reviewer, `docs/review/responses/ph1-g6a-landing.md` §4: PH2 consumes it). A
   * one-quarter pickup in 4/4 is counted as a full bar, as MT1 counts it, and its music sounds in the bar's last
   * quarter, leading into bar 2's downbeat: its chord is struck on beat 4 and held for three quarters of its own
   * quarter, the bass has no harmony to play on beats 1 and 3, and the drums play the counted bar.
   */
  it('a pickup sounds its notated length at the end of its counted bar', async () => {
    clock.withBacking = true;
    const pickup =
      '<score-partwise><part id="P1">' +
      '<measure number="0" implicit="yes"><attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes><harmony><root><root-step>G</root-step></root><kind>major</kind></harmony><note><rest/><duration>2</duration></note></measure>' +
      '<measure number="1"><harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note><rest/><duration>8</duration></note></measure>' +
      '</part></score-partwise>';
    const section = await mount(pickup, { backing: true });
    // The pickup is drawn as the one-chord cell it is, and it is bar 1 of 2.
    expect(cell(section, 1)?.textContent).toBe('G');
    expect(cell(section, 1)?.dataset.split).toBeUndefined();
    await beat(1, 1, 10);
    expect(playChordSpy).not.toHaveBeenCalled();
    expect(kitPlays.filter((p) => p.kind === 'bass')).toEqual([]);
    expect(kitPlays.filter((p) => p.kind === 'kick').length).toBeGreaterThan(0);
    await beat(1, 2, 10.6, 10.52);
    await beat(1, 3, 11.2, 11.12);
    expect(pianoStartSpy).not.toHaveBeenCalled();
    await beat(1, 4, 11.8, 11.72);
    expect(pianoStartSpy.mock.calls.map((call) => call[0].midi)).toEqual([55, 59, 50]);
    for (const [note] of pianoStartSpy.mock.calls) {
      expect(note.timeSec).toBeCloseTo(11.8, 6);
      expect(note.durationSec).toBeCloseTo(0.45, 6);
    }
    expect(section.querySelector('#chart-form')?.textContent).toBe('Bar 1 of 2 · chorus 1');
  });

  it('state: Bass + drums turned on mid-bar starts with the next bar, as before', async () => {
    clock.withBacking = true;
    const section = await mount(OFF_BEAT, { comp: false });
    await beat(1, 1, 10);
    section.querySelector<HTMLButtonElement>('#chart-backing')?.click();
    await beat(1, 2, 10.6, 10.52);
    expect(kitPlays).toHaveLength(0);
    await beat(2, 1, 12.4);
    expect(kitPlays.filter((p) => p.kind === 'bass').map((p) => p.midi)).toEqual([41, 36]);
  });
});
