// @vitest-environment jsdom
/**
 * The drill screen while the page is hidden (backlog X15; convergence CL05).
 *
 * A phone locked mid-card, another app in front, the tab in the background:
 * none of it is practice, and none of it may move the card on or make a sound
 * into a screen nobody is looking at (Part 19). Part 20 §4 adds the number:
 * play 20 s, hidden 5 min, play 10 s, and the card's recorded time is about
 * 30 s. The Simon cases carry the reviewer's ruling (`responses/questions-
 * e71ef3ad.md` §CL05): a chain cut off by hiding comes back silent, waits for
 * *▶ Play again*, replays from its first note, and is never scored as an
 * attempt in between.
 *
 * CL05a (the reviewer's required change, `responses/4923be59.md`) finishes it
 * for Drill: a rhythm card's click and judged grid stop while hidden and come
 * back on the same point of the same grid; a card's time to answer counts no
 * hidden time; and a key, a MIDI note or the pedal sent to a hidden page feeds
 * no card.
 *
 * CL05b (the reviewer's required change, `responses/8764c643.md`) narrows when
 * that return takes effect: a rhythm card back from a hidden span stays held
 * until the sound is actually running, then gives one count-in, not judged,
 * before the held grid and its click go on from the point the page hid at.
 * Four CL05a cases that pinned the instant, count-free return are rewritten to
 * that rule; the rest are as CL05a left them.
 *
 * Driven through the real screen with a faked clock and a forged
 * `document.visibilityState`, the way `sessionClock.test.ts` forges it.
 * **Nothing here is heard**: the piano is a spy, so what is asserted is when a
 * note was asked for, never what it sounded like. The rhythm cases run the
 * real `Metronome` over the smallest audio context that records when each
 * click was scheduled and whether it was stopped before it sounded, on the
 * faked clock; it is off for every other case, which keeps jsdom's own answer
 * (no Web Audio, so the rhythm card's no-metronome path).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Drill } from '../../src/engine/drills/types';
import type { InputNoteEvent, MidiMessageEvent } from '../../src/midi/types';
import type { Router } from '../../src/router';

const { findItemSpy, recordRunSpy, piano, audio } = vi.hoisted(() => {
  /**
   * The audio the rhythm card's click is made on. `available` false is jsdom's
   * answer, and every case but the rhythm ones keeps it. A click is a source
   * node's `start(when)`; the metronome cancels one by `stop(now)` before it
   * sounds, so a click was heard when it started before it was stopped.
   * `freezeFrom` stands the audio clock still, as a platform that suspends the
   * context on a locked phone does; `frozenMs` is how long it has stood.
   *
   * CL05b: the engine's `state` as the screen reads it (`AudioEngine.state`),
   * `running` unless a case suspends it, and the `statechange` that reports it
   * (`onStateChange`). `holdStarts` keeps every `ensureStarted()` unanswered
   * until `releaseStarts()` — a start asked for outside a gesture on a platform
   * that ignores one — and a start that answers does not by itself make the
   * state read `running`: the case says when the sound is back.
   *
   * CL05b, point 3: `starts` records every `ensureStarted()`, and whether it
   * was asked inside a gesture (`inGesture`, set by `gesture()`). With
   * `wakesOnGesture`, a start asked inside one runs the context, as a platform
   * that honours a start only inside a gesture does; `resume()` is that.
   */
  const state = {
    available: false,
    frozenMs: 0,
    freezeFrom: null as number | null,
    clicks: [] as { startAt: number; stopAt: number }[],
    context: null as unknown as AudioContext,
    engineState: 'running' as 'running' | 'suspended',
    holdStarts: false,
    pendingStarts: [] as (() => void)[],
    stateListeners: new Set<(next: string) => void>(),
    inGesture: false,
    wakesOnGesture: false,
    starts: [] as boolean[],
    resume: (): void => undefined,
  };
  state.resume = (): void => {
    if (state.freezeFrom !== null) state.frozenMs += performance.now() - state.freezeFrom;
    state.freezeFrom = null;
    state.engineState = 'running';
    for (const listener of [...state.stateListeners]) listener('running');
  };
  const wire = { connect: (): void => undefined, disconnect: (): void => undefined };
  const param = (): object => ({
    value: 0,
    setValueAtTime: (): void => undefined,
    exponentialRampToValueAtTime: (): void => undefined,
  });
  const source = (): object => {
    const click = { startAt: Number.POSITIVE_INFINITY, stopAt: Number.POSITIVE_INFINITY };
    return {
      ...wire,
      buffer: null,
      type: '',
      frequency: param(),
      onended: null,
      start: (when: number): void => {
        click.startAt = when;
        state.clicks.push(click);
      },
      stop: (when: number): void => {
        click.stopAt = when;
      },
    };
  };
  state.context = {
    get currentTime(): number {
      const now = performance.now();
      const standing = state.freezeFrom === null ? 0 : now - state.freezeFrom;
      return (now - state.frozenMs - standing) / 1000;
    },
    sampleRate: 8000,
    destination: wire,
    createGain: () => ({ ...wire, gain: param() }),
    createBiquadFilter: () => ({ ...wire, type: '', frequency: param(), Q: param() }),
    createBufferSource: source,
    createOscillator: source,
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
  } as unknown as AudioContext;
  return {
    findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
    recordRunSpy: vi.fn((_record: Record<string, unknown>): Promise<void> => Promise.resolve()),
    piano: {
      playChord: vi.fn((_midi: readonly number[], _durationSec?: number) => undefined),
      start: vi.fn((_note: unknown) => () => undefined),
      stop: vi.fn(),
    },
    audio: state,
  };
});

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: vi.fn(() => Promise.reject(new Error('no curriculum here'))),
  };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: recordRunSpy,
  sessionsForItem: vi.fn(() => Promise.resolve([])),
  getProgress: vi.fn(() => Promise.resolve({ bestAccuracy: 0 })),
}));

vi.mock('../../src/app/services', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/app/services')>();
  return {
    ...original,
    getPiano: () => Promise.resolve(piano),
    // The members the drill screen reads. Unavailable unless a case says so:
    // `ensureStarted` refuses as the real one does without Web Audio, and the
    // engine then reads `unsupported`.
    audioEngine: {
      get supported(): boolean {
        return audio.available;
      },
      get state(): string {
        return audio.available ? audio.engineState : 'unsupported';
      },
      ensureStarted: (): Promise<AudioContext> => {
        if (!audio.available) return Promise.reject(new Error('The Web Audio API is not available in this browser.'));
        audio.starts.push(audio.inGesture);
        if (audio.inGesture && audio.wakesOnGesture && audio.engineState !== 'running') audio.resume();
        if (!audio.holdStarts) return Promise.resolve(audio.context);
        return new Promise((resolve) => audio.pendingStarts.push(() => resolve(audio.context)));
      },
      onStateChange: (listener: (next: string) => void): (() => void) => {
        audio.stateListeners.add(listener);
        return () => audio.stateListeners.delete(listener);
      },
      get contextOrNull(): AudioContext | null {
        return audio.available ? audio.context : null;
      },
      masterGain: null,
    },
  };
});

const { DrillScreen } = await import('../../src/ui/screens/DrillScreen');
const { screenKeyboardSource, webMidiSource } = await import('../../src/app/services');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const { ChordDictationDrill } = await import('../../src/engine/drills/harmony');
const { RhythmDrill, PedalDrill } = await import('../../src/engine/drills/special');
const { PromptDrill } = await import('../../src/engine/drills/PromptDrill');
const { SimonDrill } = await import('../../src/engine/drills/simon');
const { Metronome } = await import('../../src/audio/Metronome');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* jsdom has no layout */
};

let visibility: 'visible' | 'hidden' = 'visible';
let mounted: HTMLElement | null = null;

function setVisibility(next: 'visible' | 'hidden'): void {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

/** Microtasks and any timer already due, without moving the clock. */
async function flush(): Promise<void> {
  for (let i = 0; i < 4; i += 1) await vi.advanceTimersByTimeAsync(0);
}

async function play(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

async function mount(item: CatalogItem): Promise<HTMLElement> {
  findItemSpy.mockResolvedValue(item);
  const router = {
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    route: { tab: 'plan' },
  } as unknown as Router;
  const section = DrillScreen(router, item.id);
  mounted = section;
  document.body.replaceChildren(section);
  await flush();
  expect(section.dataset.drill, 'the drill never opened').not.toBe('loading');
  return section;
}

function click(id: string): void {
  const node = document.querySelector<HTMLButtonElement>(`#${id}`);
  expect(node, `#${id} is not on the screen`).not.toBeNull();
  (node as HTMLButtonElement).click();
}

function text(id: string): string {
  return document.querySelector(`#${id}`)?.textContent ?? '';
}

function press(midi: number): void {
  screenKeyboardSource.noteOn(midi, 90);
  screenKeyboardSource.noteOff(midi);
}

function expects(section: HTMLElement): number[] {
  return (section.dataset.expects ?? '').split(',').filter(Boolean).map(Number);
}

/** Every note the piano was asked for, flattened, in order. */
function notesAsked(): number[] {
  return piano.playChord.mock.calls.flatMap((call) => [...call[0]]);
}

/** What the screen subscribed to on the MIDI source, so a case can play a MIDI key or the pedal. */
const midiNotes = new Set<(event: InputNoteEvent) => void>();
const midiMessages = new Set<(message: MidiMessageEvent) => void>();

/** A key on a MIDI piano, down and up, timestamped now as Web MIDI's are. */
function midiKey(midi: number): void {
  const tMs = performance.now();
  for (const listener of [...midiNotes]) {
    listener({ kind: 'noteOn', midi, velocity: 90, tMs, confidence: 1, source: 'midi' });
    listener({ kind: 'noteOff', midi, velocity: 0, tMs, confidence: 1, source: 'midi' });
  }
}

/** The sustain pedal, CC64, down (127) or up (0). */
function midiPedal(value: number): void {
  const message: MidiMessageEvent = { kind: 'cc', cc: 64, value, tMs: performance.now(), raw: new Uint8Array([0xb0, 64, value]) };
  for (const listener of [...midiMessages]) listener(message);
}

/** Steps the clock a metronome tick at a time until `condition` holds. */
async function until(condition: () => boolean, what: string, limitMs = 10_000): Promise<void> {
  for (let waited = 0; waited <= limitMs; waited += 25) {
    if (condition()) return;
    await play(25);
  }
  throw new Error(`never happened: ${what}`);
}

/** The audio-clock times of every click that sounded from `fromSec` up to `toSec`. */
function clicksHeard(fromSec: number, toSec: number): number[] {
  return audio.clicks
    .filter((click) => click.startAt < click.stopAt && click.startAt >= fromSec && click.startAt < toSec)
    .map((click) => click.startAt);
}

/** An audio-clock time on the input timeline, while the audio clock runs. */
function onInputTimeline(sec: number): number {
  return sec * 1000 + audio.frozenMs;
}

/** Every click heard from the input-timeline moment `fromMs` on, as input-timeline moments, while the audio clock runs. */
function heardSince(fromMs: number): number[] {
  return clicksHeard((fromMs - audio.frozenMs) / 1000, Number.POSITIVE_INFINITY).map(onInputTimeline);
}

/** The gaps between consecutive moments. */
function gaps(moments: number[]): number[] {
  return moments.slice(1).map((moment, i) => Math.round(moment - (moments[i] ?? moment)));
}

/**
 * The platform suspends the context (CL05b): the engine reads `suspended`
 * and its clock stands still, as a suspended context's `currentTime` does.
 */
function suspendAudio(): void {
  audio.engineState = 'suspended';
  audio.freezeFrom = performance.now();
}

/** The context runs again: its clock goes on from where it stood, and `statechange` says so. */
function resumeAudio(): void {
  audio.resume();
}

/** `act` inside a gesture — a tap or a key on the page — the one place a platform honours a start. */
function gesture(act: () => void): void {
  audio.inGesture = true;
  try {
    act();
  } finally {
    audio.inGesture = false;
  }
}

/** The card. */
function stageEl(): HTMLElement {
  const node = document.querySelector<HTMLElement>('#drill-stage');
  expect(node, 'the card is not on the screen').not.toBeNull();
  return node as HTMLElement;
}

/** A key pressed on the card, as the keyboard sends it. */
function keyOn(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** Every start held so far answers, the state as it is. */
function releaseStarts(): void {
  audio.holdStarts = false;
  for (const answer of audio.pendingStarts.splice(0)) answer();
}

/** One row of the end sheet's numbers, as the learner reads it. */
function stat(name: string): string {
  return document.querySelector(`#drill-stats dd[data-stat="${name}"]`)?.textContent ?? '';
}

beforeEach(() => {
  localStorage.clear();
  findItemSpy.mockReset();
  recordRunSpy.mockReset();
  recordRunSpy.mockResolvedValue(undefined);
  piano.playChord.mockClear();
  piano.start.mockClear();
  audio.available = false;
  audio.frozenMs = 0;
  audio.freezeFrom = null;
  audio.clicks = [];
  audio.engineState = 'running';
  audio.holdStarts = false;
  audio.pendingStarts = [];
  audio.stateListeners.clear();
  audio.inGesture = false;
  audio.wakesOnGesture = false;
  audio.starts = [];
  midiNotes.clear();
  midiMessages.clear();
  vi.spyOn(webMidiSource, 'onNote').mockImplementation((listener) => {
    midiNotes.add(listener);
    return () => midiNotes.delete(listener);
  });
  vi.spyOn(webMidiSource, 'onMessage').mockImplementation((listener) => {
    midiMessages.add(listener);
    return () => midiMessages.delete(listener);
  });
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  // jsdom has no `matchMedia`; the chart's card asks it how much room there is.
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList),
  );
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
  });
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// --- the items -----------------------------------------------------------------

function noteFlashItem(): CatalogItem {
  return {
    id: 'drill.read.treble-flash',
    type: 'drill',
    title: 'Treble flash cards',
    level: 1.1,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'note-flash', params: { clef: 'treble' } },
  } as unknown as CatalogItem;
}

function checklistItem(): CatalogItem {
  return {
    id: 'drill.posture.checklist',
    type: 'drill',
    title: 'Posture checklist',
    level: 0.1,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'checklist', params: { items: ['Sit tall', 'Curved fingers'] } },
  } as unknown as CatalogItem;
}

function placementItem(): CatalogItem {
  return {
    id: 'drill.placement.test',
    type: 'drill',
    title: 'Placement',
    level: 0.4,
    tracks: ['core'],
    concepts: [],
    drill: {
      kind: 'placement',
      params: { passUnit: '2.1', items: [{ text: 'Play a C major scale', failUnit: '1.1' }] },
    },
  } as unknown as CatalogItem;
}

function tourItem(): CatalogItem {
  return {
    id: 'drill.tour.app-basics',
    type: 'drill',
    title: 'Guided tour of the practice modes',
    level: 0.3,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'walkthrough', params: { song: 'song.folk.hot-cross-buns', steps: ['wait-mode', 'tempo-mode', 'loops'] } },
  } as unknown as CatalogItem;
}

/** Four bars at ♩=120: a bar is exactly two seconds. */
function formItem(): CatalogItem {
  return {
    id: 'drill.jam.form-tracker',
    type: 'drill',
    title: 'Play the form with the chart',
    level: 3.1,
    tracks: ['jazz'],
    concepts: [],
    drill: { kind: 'backing-track', params: { progression: ['C', 'F', 'G', 'C'], bpm: 120, chartView: true } },
  } as unknown as CatalogItem;
}

function dictationItem(): CatalogItem {
  return {
    id: 'drill.ear.dictation',
    type: 'drill',
    title: 'Harmonic dictation',
    level: 4.1,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'harmonic-dictation', params: {} },
  } as unknown as CatalogItem;
}

/** The ear-only rung, the default: nothing lit, only the sound. */
function simonItem(): CatalogItem {
  return {
    id: 'drill.ear.simon-c-major',
    type: 'drill',
    title: 'Simon',
    level: 1.2,
    hands: 'right',
    tracks: ['core'],
    concepts: ['simon'],
    drill: { kind: 'simon', params: { key: 'C', notes: 8 } },
  } as unknown as CatalogItem;
}

/** Two bars of quarters at ♩=120: onsets every 500 ms from the downbeat, after a four-click count. */
function rhythmItem(): CatalogItem {
  return {
    id: 'drill.rhythm.quarters',
    type: 'drill',
    title: 'Clap quarter notes',
    level: 1.1,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'rhythm', params: { bpm: 120, bars: 2, timeSig: '4/4', values: ['quarter'] } },
  } as unknown as CatalogItem;
}

function pedalItem(): CatalogItem {
  return {
    id: 'drill.pedal.legato',
    type: 'drill',
    title: 'Legato pedal',
    level: 3.2,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'pedal', params: { progression: ['I', 'IV', 'V', 'I'] } },
  } as unknown as CatalogItem;
}

const FORM = /Bar (\d+) of 4 · pass (\d+)/;

function formReads(): { bar: number; pass: number } {
  const match = FORM.exec(text('drill-form'));
  expect(match, `the form readout says "${text('drill-form')}"`).not.toBeNull();
  return { bar: Number(match?.[1]), pass: Number(match?.[2]) };
}

// --- time -------------------------------------------------------------------------

describe('a card’s recorded time is visible time only (Part 20 §4)', () => {
  /** The sequence the map names: play 20 s, hidden 5 min, play 10 s. */
  async function twentyHiddenTen(): Promise<void> {
    await play(20_000);
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await play(10_000);
  }

  function recordedDuration(): number {
    expect(recordRunSpy, 'nothing was recorded').toHaveBeenCalledTimes(1);
    return Number(recordRunSpy.mock.calls[0]?.[0]?.durationMs);
  }

  it('a drill set: 20 s, hidden 5 min, 10 s is counted 30 s', async () => {
    await mount(noteFlashItem());
    await twentyHiddenTen();
    click('drill-end');
    click('drill-keep');
    expect(recordedDuration()).toBe(30_000);
  });

  it('a checklist: the same 30 s', async () => {
    await mount(checklistItem());
    await twentyHiddenTen();
    click('drill-checklist-done');
    expect(recordedDuration()).toBe(30_000);
  });

  it('a placement test: the same 30 s', async () => {
    await mount(placementItem());
    await twentyHiddenTen();
    click('drill-placement-fail');
    expect(recordedDuration()).toBe(30_000);
  });

  it('the guided tour: the same 30 s', async () => {
    await mount(tourItem());
    await twentyHiddenTen();
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    expect(recordedDuration()).toBe(30_000);
  });
});

// --- the form chart and its loop --------------------------------------------------

describe('the backing track’s chart and loop while hidden', () => {
  it('20 s, hidden 5 min, 10 s: the chart reads 30 s into the form', async () => {
    await mount(formItem());
    await play(20_000);
    // 20 s at two seconds a bar: bar 11 of the run, which is bar 3, third time round.
    expect(formReads()).toEqual({ bar: 3, pass: 3 });
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    await play(10_000);
    // 30 s: bar 16 of the run, bar 4, fourth time round.
    expect(formReads()).toEqual({ bar: 4, pass: 4 });
  });

  it('holds the bar while hidden and comes back on it, neither ahead nor at bar 1', async () => {
    await mount(formItem());
    await play(3_000);
    // One and a half bars in: bar 2, and the loop has sounded bars 1 and 2.
    expect(formReads()).toEqual({ bar: 2, pass: 1 });
    expect(piano.playChord).toHaveBeenCalledTimes(2);
    setVisibility('hidden');
    await play(5 * 60_000);
    expect(formReads(), 'the chart moved while the page was hidden').toEqual({ bar: 2, pass: 1 });
    expect(piano.playChord, 'the loop sounded into a hidden page').toHaveBeenCalledTimes(2);
    setVisibility('visible');
    await flush();
    // Back on bar 2, from its downbeat: its chord again, nothing skipped.
    expect(formReads(), 'the chart did not come back where it was').toEqual({ bar: 2, pass: 1 });
    expect(piano.playChord).toHaveBeenCalledTimes(3);
    await play(4_000);
    // Two more bars of loop: bars 3 and 4 sound, and the chart is on bar 4.
    expect(formReads()).toEqual({ bar: 4, pass: 1 });
    expect(piano.playChord).toHaveBeenCalledTimes(5);
  });
});

// --- dictation -----------------------------------------------------------------------

describe('the dictation ticker while hidden', () => {
  it('does not tick while hidden, and ticks again once visible', async () => {
    const tick = vi.spyOn(ChordDictationDrill.prototype, 'tick');
    await mount(dictationItem());
    await play(500);
    expect(tick, 'the ticker never ran, so this proves nothing').toHaveBeenCalled();
    setVisibility('hidden');
    tick.mockClear();
    await play(5 * 60_000);
    expect(tick, 'the dictation clock advanced while the page was hidden').not.toHaveBeenCalled();
    setVisibility('visible');
    await play(500);
    expect(tick).toHaveBeenCalled();
  });
});

// --- Simon -----------------------------------------------------------------------------

describe('a Simon chain cut off by hiding (the reviewer’s ruling, §CL05)', () => {
  /**
   * Card 1 answered right, so card 2 — a two-note chain, 520 ms apart — starts
   * sounding. Returns once its first note has been asked for and its second
   * has not.
   */
  async function intoTheSecondChain(section: HTMLElement): Promise<number[]> {
    await play(700);
    expect(text('drill-status')).toContain('Your turn');
    const first = expects(section);
    expect(first).toHaveLength(1);
    press(first[0] as number);
    expect(section.dataset.feedback).toBe('correct');
    piano.playChord.mockClear();
    await play(450 + 100);
    const chain = expects(section);
    expect(chain, 'card 2 is not a two-note chain').toHaveLength(2);
    expect(notesAsked(), 'the chain’s first note has not sounded').toEqual([chain[0]]);
    return chain;
  }

  it('asks the piano for nothing while hidden', async () => {
    const section = await mount(simonItem());
    await intoTheSecondChain(section);
    setVisibility('hidden');
    piano.playChord.mockClear();
    await play(5 * 60_000);
    expect(piano.playChord, 'the chain kept sounding into a hidden page').not.toHaveBeenCalled();
    expect(piano.start).not.toHaveBeenCalled();
  });

  it('comes back silent, scores nothing, says it was interrupted, and replays from the first note when asked', async () => {
    const section = await mount(simonItem());
    const chain = await intoTheSecondChain(section);
    const counterBefore = text('drill-counter');
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    piano.playChord.mockClear();
    await play(5_000);
    expect(piano.playChord, 'sound on return, with nothing asked for').not.toHaveBeenCalled();
    // A truthful line: not the stale "Listen — the app is playing."
    expect(text('drill-status')).not.toContain('Listen');
    expect(text('drill-status')).toMatch(/interrupted/i);
    expect(text('drill-status')).toContain('Play again');
    // A key before *Play again* is not an answer to a chain nobody heard.
    const wrong = (chain[0] as number) === 60 ? 62 : 60;
    press(wrong);
    expect(section.dataset.feedback ?? '', 'the interrupted chain was scored').toBe('');
    expect(text('drill-counter')).toBe(counterBefore);
    // Still the same card: the drill was not moved on past its unanswered chain.
    expect(expects(section)).toEqual(chain);
    // The learner asks: from the first note, not from where it was cut.
    click('drill-replay');
    await flush();
    await play(1_100);
    expect(notesAsked()).toEqual(chain);
    expect(text('drill-status')).toContain('Your turn');
    // And now a key is an answer again.
    press(chain[0] as number);
    press(chain[1] as number);
    expect(section.dataset.feedback).toBe('correct');
  });

  it('a drill opened while the page is already hidden sounds nothing, and waits on return like a cut-off chain', async () => {
    visibility = 'hidden';
    const section = await mount(simonItem());
    await play(5 * 60_000);
    expect(piano.playChord, 'the first chain sounded into a hidden page').not.toHaveBeenCalled();
    setVisibility('visible');
    await play(5_000);
    expect(piano.playChord).not.toHaveBeenCalled();
    expect(text('drill-status')).toMatch(/interrupted/i);
    click('drill-replay');
    await flush();
    await play(600);
    expect(notesAsked()).toEqual(expects(section));
  });

  it('a feedback pause that ends while hidden moves nothing on and plays nothing', async () => {
    const section = await mount(simonItem());
    await play(700);
    const first = expects(section);
    press(first[0] as number);
    expect(section.dataset.feedback).toBe('correct');
    // Hidden inside the 450 ms pause after a right answer.
    setVisibility('hidden');
    piano.playChord.mockClear();
    await play(5 * 60_000);
    expect(expects(section), 'the pause advanced to the next card while hidden').toEqual(first);
    expect(piano.playChord, 'the next card’s chain sounded into a hidden page').not.toHaveBeenCalled();
    setVisibility('visible');
    await play(5_000);
    expect(piano.playChord, 'the next card sounded on return, with nothing asked for').not.toHaveBeenCalled();
    expect(expects(section)).toEqual(first);
    // The held card says how to leave it, and a tap does.
    expect(text('drill-status')).toContain('Tap the card');
    section.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await flush();
    await play(1_100);
    expect(expects(section)).toHaveLength(2);
    expect(notesAsked()).toEqual(expects(section));
  });
});

// --- CL05a: the rhythm card, time to answer, and input while hidden ------------------------

type LiveRhythm = InstanceType<typeof RhythmDrill>;

/** Opens the rhythm card with its click on and returns the drill the screen made. */
async function openRhythm(): Promise<LiveRhythm> {
  audio.available = true;
  const next = vi.spyOn(RhythmDrill.prototype, 'next');
  await mount(rhythmItem());
  const live = next.mock.contexts[0] as LiveRhythm | undefined;
  expect(live, 'the rhythm card never opened').toBeInstanceOf(RhythmDrill);
  return live as LiveRhythm;
}

/** The input-timeline moment `ms` on the audio clock, while it runs. */
function onAudioClock(ms: number): number {
  return (ms - audio.frozenMs) / 1000;
}

/**
 * Counts in and taps the first two onsets on time, so the pattern is running
 * and the click is back on the learner's grid (T8); then 200 ms more, so the
 * next onset is 300 ms away.
 */
async function intoALiveRhythm(): Promise<LiveRhythm> {
  const live = await openRhythm();
  await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the count-in reached bar 1');
  await play(Math.round((live.startedAt as number) - performance.now()));
  press(60);
  await play(500);
  press(60);
  expect(live.result().correct, 'the two taps before the hide were not on time').toBe(2);
  await play(200);
  return live;
}

describe('a rhythm card while hidden (CL05a, the reviewer’s required change)', () => {
  it('stops its click and its grid while hidden, takes no tap, counts no hidden time, and after one count-in comes back on the same point of the same grid', async () => {
    const openedAt = performance.now();
    const live = await intoALiveRhythm();
    const grid = live.startedAt as number;
    const before = live.result();
    const hiddenAt = performance.now();
    setVisibility('hidden');
    // A long hidden span, with a hand on the keys now and then.
    for (const gap of [1_000, 59_000, 140_000, 99_000]) {
      await play(gap);
      press(60);
      midiKey(62);
    }
    await play(1_000);
    const visibleAt = performance.now();
    expect(visibleAt - hiddenAt).toBe(300_000);
    expect.soft(clicksHeard(onAudioClock(hiddenAt), onAudioClock(visibleAt)), 'the click kept sounding into a hidden page').toEqual([]);
    expect.soft(live.result().answered, 'a tap to a hidden page was judged').toBe(before.answered);
    expect.soft(live.result().correct).toBe(before.correct);
    setVisibility('visible');
    await flush();
    // CL05b: one count-in first, a bar of clicks a beat apart, and the click
    // goes on after it on the same pulse.
    await until(() => heardSince(visibleAt).length >= 6, 'the count-in and the click after it');
    const back = heardSince(visibleAt);
    expect.soft(gaps(back.slice(0, 6)), 'the count-in and the click after it are not a beat apart').toEqual([500, 500, 500, 500, 500]);
    // The page hid 200 ms into beat 1, so the count leads back to beat 1 and
    // the onset that was next, on beat 2, falls two beats after its last click.
    // The grid moved on by the hidden span and by the hold and the count, so
    // none of it is counted and nothing in it is missed.
    const lastCount = back[3] ?? 0;
    const beatOneAt = lastCount + 500;
    expect.soft(live.startedAt ?? 0, 'the grid does not resume where the page hid').toBeCloseTo(beatOneAt - 500, 3);
    expect.soft((live.startedAt as number) - grid, 'the grid came back short of the hidden span').toBeGreaterThan(300_000);
    // Tapped on each remaining onset, after the count.
    await play(Math.round(lastCount + 1_000 - performance.now()));
    press(60);
    for (let onset = 1; onset < 6; onset += 1) {
      await play(500);
      press(60);
    }
    const result = live.result();
    expect.soft(result.correct, 'the taps after the return missed the grid').toBe(8);
    expect.soft(result.detail?.extraTaps, 'taps were counted extra').toBe(0);
    // The rhythm card's average is its timing offset: on the grid, nought.
    expect.soft(Math.abs(result.meanReactionMs)).toBeLessThan(2);
    // The click went on with the grid, every half second.
    const all = heardSince(visibleAt);
    expect.soft(all.length, 'the click did not go on after the count').toBeGreaterThan(9);
    expect.soft(gaps(all).every((gap) => gap === 500), 'the click went off the pulse').toBe(true);
    // Hidden time is not practice: the recorded row counts what was visible.
    const shownFor = hiddenAt - openedAt + (performance.now() - visibleAt);
    click('drill-next');
    expect(recordRunSpy, 'the finished card was not recorded').toHaveBeenCalledTimes(1);
    expect(Number(recordRunSpy.mock.calls[0]?.[0]?.durationMs)).toBe(shownFor);
  });

  it('comes back on its grid when the audio clock stood still while hidden, its count-in and click read through both clocks again', async () => {
    const live = await intoALiveRhythm();
    const hiddenAt = performance.now();
    // A platform that suspends the audio context on a locked phone.
    audio.freezeFrom = hiddenAt;
    setVisibility('hidden');
    await play(5 * 60_000);
    const visibleAt = performance.now();
    audio.frozenMs += visibleAt - hiddenAt;
    audio.freezeFrom = null;
    setVisibility('visible');
    await flush();
    // CL05b: the count-in, then beat 1 — where the page hid — on the moved grid.
    await until(() => heardSince(visibleAt).length >= 5, 'the count-in and the click after it');
    const back = heardSince(visibleAt);
    expect(back[4], 'the click did not come back on the grid').toBeCloseTo((live.startedAt as number) + 500, 0);
    await play(Math.round((live.startedAt as number) + 1_000 - performance.now()));
    press(60);
    expect(live.result().correct, 'the tap on the next onset was not judged on time').toBe(3);
  });

  it('a rhythm card opened while the page is hidden starts no click until the page is back, then counts in from the top', async () => {
    const start = vi.spyOn(Metronome.prototype, 'start');
    visibility = 'hidden';
    const live = await openRhythm();
    await play(5 * 60_000);
    expect(start, 'the click started into a hidden page').not.toHaveBeenCalled();
    expect(clicksHeard(0, Number.POSITIVE_INFINITY), 'a click sounded into a hidden page').toEqual([]);
    setVisibility('visible');
    await flush();
    expect(start, 'the card did not count in on return').toHaveBeenCalledTimes(1);
    await until(() => text('drill-status').startsWith('Count-in'), 'the count-in began');
    // A hand finding its place during the count is not the first onset.
    press(60);
    expect(live.firstTapAt).toBeNull();
    expect(live.result().answered).toBe(0);
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the count-in reached bar 1');
    await play(Math.round((live.startedAt as number) - performance.now()));
    press(60);
    expect(live.result().correct).toBe(1);
  });

  it('hidden in the middle of the count-in: the count stops, and comes back from the top, still refusing a stray', async () => {
    const start = vi.spyOn(Metronome.prototype, 'start');
    const live = await openRhythm();
    await until(() => text('drill-status') === 'Count-in — 2', 'the count reached its second click');
    expect(start).toHaveBeenCalledTimes(1);
    const hiddenAt = performance.now();
    setVisibility('hidden');
    await play(5 * 60_000);
    const visibleAt = performance.now();
    expect(clicksHeard(onAudioClock(hiddenAt), onAudioClock(visibleAt)), 'the count went on into a hidden page').toEqual([]);
    setVisibility('visible');
    await flush();
    expect(start, 'the count did not start again on return').toHaveBeenCalledTimes(2);
    await until(() => text('drill-status') === 'Count-in — 1', 'the count began again from its first click');
    press(60);
    expect(live.firstTapAt, 'a stray during the new count started the rhythm').toBeNull();
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the new count reached bar 1');
    await play(Math.round((live.startedAt as number) - performance.now()));
    press(60);
    expect(live.result().correct).toBe(1);
  });

  it('hidden after the downbeat, before any tap: quiet while hidden; on return one count-in names the downbeat again, a tap during it is a stray, and the first tap after starts the pattern and its click', async () => {
    const live = await openRhythm();
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the count-in reached bar 1');
    await play(Math.round((live.startedAt as number) - performance.now()) + 300);
    const hiddenAt = performance.now();
    setVisibility('hidden');
    await play(1_000);
    press(60);
    expect(live.firstTapAt, 'a tap to a hidden page started the rhythm').toBeNull();
    await play(5 * 60_000 - 1_000);
    const visibleAt = performance.now();
    expect(visibleAt - hiddenAt).toBe(300_000);
    expect(clicksHeard(onAudioClock(hiddenAt), onAudioClock(visibleAt)), 'a click sounded into a hidden page').toEqual([]);
    setVisibility('visible');
    await flush();
    // CL05b: one count-in, and a hand finding its place during it is not the first onset.
    await until(() => heardSince(visibleAt).length >= 2, 'the count-in began');
    press(60);
    expect(live.firstTapAt, 'a tap during the count-in started the rhythm').toBeNull();
    expect(live.result().answered).toBe(0);
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the count-in reached the downbeat');
    const count = heardSince(visibleAt).slice(0, 4);
    expect(gaps(count), 'the count-in is not a bar a beat apart').toEqual([500, 500, 500]);
    expect(live.startedAt ?? 0, 'the downbeat is not a beat after the count').toBeCloseTo((count[3] ?? 0) + 500, 3);
    // Quiet after the downbeat until the first tap, as on the card's first count.
    await play(1_000);
    const downbeat = live.startedAt as number;
    expect(heardSince(downbeat + 1), 'a click sounded after the downbeat before the first tap').toEqual([]);
    const tapAt = performance.now();
    press(60);
    expect(live.firstTapAt).toBe(tapAt);
    expect(live.result().correct).toBe(1);
    await play(1_000);
    const back = clicksHeard(onAudioClock(tapAt), Number.POSITIVE_INFINITY).map(onInputTimeline);
    expect(back[0], 'the click did not start on the first tap’s grid').toBeCloseTo(tapAt + 500, 0);
  });

  it('a tap sent to a hidden page once the count has named the downbeat is not the first onset; on return one count-in leads to the downbeat again, past the hidden span and the count', async () => {
    const live = await openRhythm();
    await until(() => text('drill-status') === 'Count-in — 4', 'the count reached its last click');
    const downbeat = live.startedAt as number;
    const hiddenAt = performance.now();
    expect(downbeat - hiddenAt, 'the downbeat is not still to come').toBeGreaterThan(300);
    setVisibility('hidden');
    await play(1_000);
    press(60);
    midiKey(60);
    expect.soft(live.firstTapAt, 'a tap to a hidden page started the rhythm').toBeNull();
    expect.soft(live.result().answered, 'a tap to a hidden page was judged').toBe(0);
    await play(5 * 60_000 - 1_000);
    const visibleAt = performance.now();
    expect.soft(clicksHeard(onAudioClock(hiddenAt), onAudioClock(visibleAt)), 'the click went on into a hidden page').toEqual([]);
    setVisibility('visible');
    await flush();
    // A tap 100 ms after the return, where the old downbeat was still to come,
    // is a hand finding its place — and so is one during the new count.
    await play(100);
    press(60);
    expect(live.firstTapAt, 'a stray after the return started the rhythm').toBeNull();
    expect(live.result().answered).toBe(0);
    // CL05b: one count-in, the card's own bar, and the downbeat a beat after
    // its last click — moved on past the hidden span and past the count, so a
    // stray during the count cannot start the pattern.
    await until(() => heardSince(visibleAt).length >= 3, 'the count-in reached its third click');
    press(60);
    expect(live.firstTapAt, 'a stray during the count-in started the rhythm').toBeNull();
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the moved downbeat');
    const count = heardSince(visibleAt).slice(0, 4);
    expect(gaps(count), 'the count-in is not a bar a beat apart').toEqual([500, 500, 500]);
    expect(live.startedAt ?? 0, 'the downbeat is not a beat after the count').toBeCloseTo((count[3] ?? 0) + 500, 3);
    expect((live.startedAt as number) - downbeat, 'the downbeat did not move past the hidden span').toBeGreaterThan(visibleAt - hiddenAt);
    // On the moved downbeat it is the first onset, on time, and the click comes back on its grid.
    const tapAt = Math.round(live.startedAt as number);
    await play(tapAt - performance.now());
    press(60);
    expect(live.result().correct).toBe(1);
    await play(1_000);
    const back = clicksHeard(onAudioClock(tapAt), Number.POSITIVE_INFINITY).map(onInputTimeline);
    expect(back[0], 'the click did not come back on the first tap’s grid').toBeCloseTo(tapAt + 500, 0);
  });
});

describe('a rhythm card comes back only once it can be heard, and after one count-in (CL05b, the reviewer’s required change)', () => {
  it('held while the sound is suspended — no click, no judged tap, the grid unmoved — then one count-in, not judged, then the grid from the point the page hid at', async () => {
    const live = await intoALiveRhythm();
    // Hidden 700 ms into the pattern: its first two onsets tapped, the third 300 ms away.
    const grid = live.startedAt as number;
    const before = live.result();
    const hiddenAt = performance.now();
    // The platform suspends the context with the lock, and a start asked for
    // outside a gesture does not answer.
    suspendAudio();
    audio.holdStarts = true;
    setVisibility('hidden');
    const scheduled = audio.clicks.length;
    await play(5 * 60_000);
    const visibleAt = performance.now();
    setVisibility('visible');
    await flush();
    // Past the start's one-second bound, tapping exactly where the grid moved
    // by the hidden span would put the next onsets.
    await play(300);
    press(60);
    for (let i = 0; i < 3; i += 1) {
      await play(500);
      press(60);
    }
    // The start answers, and the context is still suspended.
    releaseStarts();
    await flush();
    await play(500);
    midiKey(62);
    expect.soft(audio.clicks.length, 'a click was scheduled while the sound was suspended').toBe(scheduled);
    expect.soft(live.result().answered, 'a tap was judged while the sound was suspended').toBe(before.answered);
    expect.soft(live.result().correct).toBe(before.correct);
    expect.soft(live.result().answers[2]?.correct, 'the onset next at the hide was used up while the sound was suspended').toBe(false);
    expect.soft(live.startedAt, 'the grid moved while it was held').toBe(grid + (visibleAt - hiddenAt));
    // The sound runs again: one count-in, the card's own bar.
    const runningAt = performance.now();
    resumeAudio();
    await until(() => heardSince(runningAt).length >= 2, 'the count-in began');
    // A hand finding its place on the count's second click is not judged.
    await play(Math.max(0, Math.round((heardSince(runningAt)[1] ?? 0) - performance.now())));
    press(60);
    expect.soft(live.result().answered, 'a tap during the count-in was judged').toBe(before.answered);
    await until(() => heardSince(runningAt).length >= 6, 'the count-in and the click after it');
    const heard = heardSince(runningAt);
    expect.soft(gaps(heard.slice(0, 6)), 'the count-in and the click are not one pulse').toEqual([500, 500, 500, 500, 500]);
    // A whole count before the next judged onset, which falls two beats after
    // the count's last click: the count leads back to beat 1, where the page hid.
    const lastCount = heard[3] ?? 0;
    const nextOnsetAt = (live.startedAt as number) + 1_000;
    expect.soft(nextOnsetAt - lastCount, 'the next judged onset is not where the page hid').toBeCloseTo(1_000, 3);
    // The grid moved on by everything hidden and held, not by the hidden span alone.
    expect.soft((live.startedAt as number) - grid, 'the hold was counted as practice').toBeGreaterThan(runningAt - hiddenAt);
    // The next on-time tap is the onset that was next at the hide — the third,
    // not the first, and not one the hold skipped — and the rest follow it.
    await play(Math.round(lastCount + 1_000 - performance.now()));
    press(60);
    expect.soft(live.result().answers[2]?.correct, 'the onset next at the hide was not the next one judged').toBe(true);
    expect.soft(live.result().correct).toBe(3);
    for (let onset = 3; onset < 8; onset += 1) {
      await play(500);
      press(60);
    }
    const result = live.result();
    expect(result.correct, 'the taps after the count missed the grid').toBe(8);
    expect(result.detail?.extraTaps, 'taps were counted extra').toBe(0);
  });

  it('a long hold is not counted either: a minute with the start answered and the context still suspended, and the onset next at the hide is still the next one judged', async () => {
    const live = await intoALiveRhythm();
    suspendAudio();
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    await play(60_000);
    expect(live.result().answered, 'a tap was judged in the hold').toBe(2);
    const runningAt = performance.now();
    resumeAudio();
    await until(() => heardSince(runningAt).length >= 4, 'the count-in');
    const lastCount = heardSince(runningAt)[3] ?? 0;
    await play(Math.round(lastCount + 1_000 - performance.now()));
    press(60);
    expect(live.result().answers[2]?.correct, 'the onset next at the hide fell due in the hold and was missed').toBe(true);
    expect(live.result().correct).toBe(3);
    expect(live.result().detail?.extraTaps).toBe(0);
  });

  it('hidden again while held: the held point and the click are the first hide’s, and the second span and the hold are not counted', async () => {
    const live = await intoALiveRhythm();
    suspendAudio();
    setVisibility('hidden');
    await play(60_000);
    setVisibility('visible');
    await flush();
    await play(10_000);
    setVisibility('hidden');
    await play(60_000);
    setVisibility('visible');
    await flush();
    await play(2_000);
    const runningAt = performance.now();
    resumeAudio();
    // The click was going before the first hide, so it goes on after the count.
    await until(() => heardSince(runningAt).length >= 6, 'the count-in and the click after it');
    const heard = heardSince(runningAt);
    expect(gaps(heard.slice(0, 6))).toEqual([500, 500, 500, 500, 500]);
    await play(Math.round((heard[3] ?? 0) + 1_000 - performance.now()));
    press(60);
    expect(live.result().answers[2]?.correct, 'the second hide moved the held point').toBe(true);
    expect(live.result().detail?.extraTaps).toBe(0);
  });

  it('a card opened while hidden judges nothing against the moment it opened while the return’s start goes unanswered, and counts in from the top once the sound runs', async () => {
    const start = vi.spyOn(Metronome.prototype, 'start');
    visibility = 'hidden';
    const live = await openRhythm();
    await play(5 * 60_000);
    suspendAudio();
    audio.holdStarts = true;
    setVisibility('visible');
    await flush();
    for (let i = 0; i < 4; i += 1) {
      await play(500);
      press(60);
    }
    expect.soft(live.firstTapAt, 'a tap was the first onset with the start unanswered').toBeNull();
    expect.soft(live.result().answered, 'a tap was judged against the moment the card opened').toBe(0);
    expect.soft(start, 'the count began with the sound suspended').not.toHaveBeenCalled();
    resumeAudio();
    releaseStarts();
    await flush();
    await until(() => text('drill-status').startsWith('Count-in'), 'the count-in began');
    expect(start).toHaveBeenCalledTimes(1);
    press(60);
    expect(live.firstTapAt, 'a stray during the count started the rhythm').toBeNull();
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the count-in reached bar 1');
    await play(Math.round((live.startedAt as number) - performance.now()));
    press(60);
    expect(live.result().correct).toBe(1);
  });

  it('the hold is the rhythm card’s alone: a note-flash card back with the sound suspended takes its answer at once', async () => {
    audio.available = true;
    const section = await mount(noteFlashItem());
    await play(1_000);
    suspendAudio();
    audio.holdStarts = true;
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    press(expects(section)[0] as number);
    expect(section.dataset.feedback).toBe('correct');
  });

  it('with no Web Audio there is no sound to wait for: the card carries on as before, its taps judged on its moved grid', async () => {
    // `audio.available` stays false: jsdom's answer, and the card's silent first-tap path.
    const next = vi.spyOn(RhythmDrill.prototype, 'next');
    await mount(rhythmItem());
    const live = next.mock.contexts[0] as LiveRhythm;
    expect(text('drill-status')).toContain('No metronome');
    press(60);
    await play(500);
    press(60);
    await play(200);
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    await play(300);
    press(60);
    expect(live.result().correct).toBe(3);
    expect(live.result().detail?.extraTaps).toBe(0);
  });
});

describe('the held rhythm card’s one way back while its sound is paused: the card itself (CL05b point 3, the reviewer’s ruling, `responses/questions-91f683ff.md`)', () => {
  const SOUND_PAUSED = 'Sound is paused — tap to continue.';

  it('says the sound is paused and is a keyboard-reachable target; a key on the strip, even as a tap, and a MIDI key ask for no sound and are not judged', async () => {
    const live = await intoALiveRhythm();
    const before = live.result();
    suspendAudio();
    audio.wakesOnGesture = true;
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    expect.soft(text('drill-status'), 'the held card does not say the sound is paused').toBe(SOUND_PAUSED);
    expect.soft(stageEl().getAttribute('role'), 'the card is not an activation target').toBe('button');
    expect.soft(stageEl().getAttribute('tabindex'), 'the card cannot be reached from the keyboard').toBe('0');
    const asked = audio.starts.length;
    await play(300);
    gesture(() => press(60));
    midiKey(62);
    await play(500);
    gesture(() => press(60));
    expect.soft(audio.starts.length, 'a key asked for the sound').toBe(asked);
    expect.soft(audio.engineState, 'a key woke the sound').toBe('suspended');
    expect.soft(live.result().answered, 'a key was judged while the sound was paused').toBe(before.answered);
    expect(text('drill-status'), 'the sentence went with a key').toBe(SOUND_PAUSED);
  });

  it('a tap on the card asks for the sound inside the tap; once it runs the sentence goes, the card is no target, and after one count-in the grid goes on where it hid', async () => {
    const live = await intoALiveRhythm();
    suspendAudio();
    audio.wakesOnGesture = true;
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    const asked = audio.starts.length;
    const tappedAt = performance.now();
    gesture(() => stageEl().click());
    expect.soft(audio.starts.slice(asked), 'the tap did not ask for the sound, once, inside itself').toEqual([true]);
    await flush();
    expect.soft(audio.engineState).toBe('running');
    expect.soft(text('drill-status'), 'the sentence stayed after the sound ran').not.toBe(SOUND_PAUSED);
    expect.soft(stageEl().hasAttribute('role'), 'the card is still a target after the sound ran').toBe(false);
    expect.soft(stageEl().hasAttribute('tabindex'), 'the card is still in the keyboard order after the sound ran').toBe(false);
    // The card is no longer the resume action: a second tap on it asks for nothing.
    gesture(() => stageEl().click());
    expect.soft(audio.starts.length, 'a tap after the resume asked for the sound again').toBe(asked + 1);
    await until(() => heardSince(tappedAt).length >= 4, 'the count-in');
    const lastCount = heardSince(tappedAt)[3] ?? 0;
    expect.soft(text('drill-status'), 'the sentence came back during the count').not.toBe(SOUND_PAUSED);
    await play(Math.round(lastCount + 1_000 - performance.now()));
    press(60);
    expect.soft(live.result().answers[2]?.correct, 'the onset next at the hide was not the next one judged').toBe(true);
    for (let onset = 3; onset < 8; onset += 1) {
      await play(500);
      press(60);
    }
    expect(stageEl().hasAttribute('role'), 'the card became a target again').toBe(false);
    expect(live.result().correct).toBe(8);
    expect(live.result().detail?.extraTaps).toBe(0);
  });

  it('Enter or Space on the card asks the same; where the sound still cannot run it stays paused and held, and judges nothing', async () => {
    const live = await intoALiveRhythm();
    const before = live.result();
    // A platform that refuses even a start asked inside a gesture.
    suspendAudio();
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    const asked = audio.starts.length;
    gesture(() => keyOn(stageEl(), 'Enter'));
    expect.soft(audio.starts.slice(asked), 'Enter on the card did not ask for the sound inside the key').toEqual([true]);
    await flush();
    await play(300);
    press(60);
    await play(1_500);
    press(60);
    expect.soft(text('drill-status'), 'the card stopped saying the sound is paused').toBe(SOUND_PAUSED);
    expect.soft(stageEl().getAttribute('role'), 'the card stopped being the way back').toBe('button');
    expect.soft(live.result().answered, 'a key was judged with the sound still paused').toBe(before.answered);
    // Space, where the platform now allows it, and without scrolling the page.
    audio.wakesOnGesture = true;
    let space: KeyboardEvent | null = null;
    gesture(() => {
      space = keyOn(stageEl(), ' ');
    });
    expect.soft((space as KeyboardEvent | null)?.defaultPrevented, 'Space on the card scrolled the page').toBe(true);
    expect.soft(audio.engineState, 'Space on the card did not wake the sound').toBe('running');
    await until(() => text('drill-status').startsWith('Count-in'), 'the count-in');
    expect(live.result().answered).toBe(before.answered);
  });
});

// --- X45: a rhythm card's first open ----------------------------------------------------

const { audioEngine } = await import('../../src/app/services');

/**
 * X45 (the reviewer's ruling, `responses/1a89de52.md`): CL05b's rule one edge
 * earlier. No judged rhythm timing against an inaudible or unestablished
 * pulse, on a card's first open as on its return: from the moment it opens
 * until its sound is actually running the card judges nothing, and says so
 * with CL05b's paused card where the sound is not running; then its ordinary
 * count-in plays. Nothing was played before, so there is nothing to re-anchor.
 * With no Web Audio it carries on at once, as it always has — the CL05b case
 * above, which already opens its card with none.
 */
describe('a rhythm card’s first open judges nothing until its sound is running, then counts in as it always has (X45)', () => {
  const SOUND_PAUSED = 'Sound is paused — tap to continue.';

  /**
   * Taps where the card's first four onsets fall on the grid the drill holds
   * from the moment it opened, before any count has named a downbeat — the
   * taps a card that judged before its pulse would score.
   */
  async function tapTheOpenGrid(live: LiveRhythm): Promise<void> {
    const opened = live.startedAt as number;
    for (let onset = 0; onset < 4; onset += 1) {
      await play(Math.max(0, Math.round(opened + onset * 500 - performance.now())));
      press(60);
    }
  }

  /** The paused card, as CL05b's return shows it: the sentence, and the card a keyboard-reachable button. */
  function expectPaused(): void {
    expect.soft(text('drill-status'), 'the held card does not say the sound is paused').toBe(SOUND_PAUSED);
    expect.soft(stageEl().getAttribute('role'), 'the card is not an activation target').toBe('button');
    expect.soft(stageEl().getAttribute('tabindex'), 'the card cannot be reached from the keyboard').toBe('0');
    expect.soft(stageEl().getAttribute('aria-label'), 'the card does not say what it does').toBe(SOUND_PAUSED);
  }

  /** The pause is over: the sentence gone, the card no longer a button. */
  function expectNotPaused(): void {
    expect.soft(text('drill-status'), 'the sentence stayed after the sound ran').not.toBe(SOUND_PAUSED);
    expect.soft(stageEl().hasAttribute('role'), 'the card is still a target after the sound ran').toBe(false);
    expect.soft(stageEl().hasAttribute('tabindex'), 'the card is still in the keyboard order after the sound ran').toBe(false);
  }

  /**
   * The card's ordinary first count, as it plays with the sound running: one
   * bar of clicks a beat apart with the downbeat a beat after the last, a hand
   * finding its place during it a stray, and the first tap on the downbeat
   * the pattern's start and its first judged onset.
   */
  async function countsInFromTheTop(live: LiveRhythm): Promise<void> {
    await until(() => text('drill-status') === 'Count-in — 1', 'the count-in began from its first click');
    press(60);
    expect(live.firstTapAt, 'a stray during the count started the rhythm').toBeNull();
    expect(live.result().answered, 'a stray during the count was judged').toBe(0);
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the count-in reached bar 1');
    const downbeat = live.startedAt as number;
    const count = heardSince(downbeat - 2_100).filter((at) => at < downbeat - 1);
    expect.soft(gaps(count), 'the count-in is not a bar of clicks a beat apart').toEqual([500, 500, 500]);
    expect.soft(count[3] ?? 0, 'the downbeat is not a beat after the count’s last click').toBeCloseTo(downbeat - 500, 0);
    await play(Math.max(0, Math.round((live.startedAt as number) - performance.now())));
    const tapAt = performance.now();
    press(60);
    expect(live.firstTapAt, 'the first tap after the count did not start the pattern').toBe(tapAt);
    expect(live.result().answers[0]?.correct, 'the first tap after the count is not the first judged onset').toBe(true);
    expect(live.result().answered).toBe(1);
  }

  it('Part A, the start never answers: no tap is judged against the moment the card opened, and once the start answers the ordinary count-in leads to the first judged onset', async () => {
    const start = vi.spyOn(Metronome.prototype, 'start');
    // The start the card asks for as it opens never answers.
    audio.holdStarts = true;
    const live = await openRhythm();
    await tapTheOpenGrid(live);
    // Past the start's one-second bound, and still nothing.
    await play(1_500);
    press(60);
    midiKey(62);
    expect.soft(live.result().answered, 'a tap was judged against the moment the card opened').toBe(0);
    expect.soft(live.firstTapAt, 'a tap was the first onset with the start unanswered').toBeNull();
    expect.soft(start, 'the count began with the start unanswered').not.toHaveBeenCalled();
    releaseStarts();
    await flush();
    expect(start, 'the count did not begin once the start answered').toHaveBeenCalledTimes(1);
    await countsInFromTheTop(live);
  });

  it('Part A with the sound suspended: the card says the sound is paused and is the way back, judges nothing against the moment it opened, and counts in from the top once the sound runs', async () => {
    const start = vi.spyOn(Metronome.prototype, 'start');
    // An unanswered start as the real engine meets one: the context not running.
    suspendAudio();
    audio.holdStarts = true;
    const live = await openRhythm();
    expectPaused();
    await tapTheOpenGrid(live);
    await play(1_500);
    press(60);
    midiKey(62);
    expect.soft(live.result().answered, 'a tap was judged against the moment the card opened').toBe(0);
    expect.soft(live.firstTapAt, 'a tap was the first onset with the start unanswered').toBeNull();
    expect.soft(start, 'the count began with the sound suspended').not.toHaveBeenCalled();
    expectPaused();
    resumeAudio();
    releaseStarts();
    await flush();
    expectNotPaused();
    expect(start, 'the count did not begin once the sound ran').toHaveBeenCalledTimes(1);
    await countsInFromTheTop(live);
  });

  it('Part B, the start answers with the sound still suspended: no count-in on a standing clock and no tap taken, the card says so; the sound coming back by itself counts in, with no tap needed', async () => {
    const start = vi.spyOn(Metronome.prototype, 'start');
    suspendAudio();
    const live = await openRhythm();
    expectPaused();
    // Well past where a four-click count-in would have ended, had it played.
    for (let i = 0; i < 8; i += 1) {
      await play(500);
      press(60);
    }
    expect.soft(text('drill-status'), 'a count-in began on a standing clock').not.toMatch(/^Count-in/);
    expect.soft(start, 'a count-in was begun with the sound suspended').not.toHaveBeenCalled();
    expect.soft(live.result().answered, 'a tap was judged with the sound suspended').toBe(0);
    expect.soft(live.firstTapAt, 'a tap was the first onset with the sound suspended').toBeNull();
    expectPaused();
    // The platform's sound comes back on its own: no gesture, no tap.
    resumeAudio();
    await flush();
    expectNotPaused();
    expect(start, 'the count did not begin once the sound ran').toHaveBeenCalledTimes(1);
    await countsInFromTheTop(live);
  });

  it('Part C, where only a tap can start the sound: a key asks for nothing, a tap on the paused card asks once, inside the tap; the ordinary count-in follows and the first tap after it is the first judged onset', async () => {
    suspendAudio();
    audio.wakesOnGesture = true;
    const live = await openRhythm();
    await play(2_000);
    expectPaused();
    // A key on the strip, even as a tap, is the answer the learner means next: never the way back.
    gesture(() => press(60));
    expect.soft(audio.engineState, 'a key woke the sound').toBe('suspended');
    expect.soft(live.result().answered, 'a key was judged with the sound paused').toBe(0);
    // Every start asked for from here: inside a gesture or not, and with the sound running or not.
    const asks: { inGesture: boolean; running: boolean }[] = [];
    const ask = audioEngine.ensureStarted.bind(audioEngine);
    vi.spyOn(audioEngine, 'ensureStarted').mockImplementation(() => {
      asks.push({ inGesture: audio.inGesture, running: audio.engineState === 'running' });
      return ask();
    });
    gesture(() => stageEl().click());
    expect
      .soft(
        asks.filter((asked) => !asked.running),
        'the tap did not ask for the sound, once, inside itself',
      )
      .toEqual([{ inGesture: true, running: false }]);
    await flush();
    expect.soft(audio.engineState, 'the tap did not wake the sound').toBe('running');
    expectNotPaused();
    // The card is no longer the way back: a second tap on it asks for nothing.
    const asked = asks.length;
    gesture(() => stageEl().click());
    expect.soft(asks.length, 'a tap after the sound ran asked for it again').toBe(asked);
    await countsInFromTheTop(live);
  });

  it('“Again” opens its card the same way: held while the sound is suspended, hidden during the wait and back, it counts in from the top and its first tap starts the pattern', async () => {
    const first = await openRhythm();
    // The first card's count names its downbeat, and the set is ended there.
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the first card’s count reached bar 1');
    click('drill-next');
    suspendAudio();
    const next = vi.spyOn(RhythmDrill.prototype, 'next');
    click('drill-again');
    await flush();
    const live = next.mock.contexts.at(-1) as LiveRhythm | undefined;
    expect(live, '“Again” opened no new card').toBeInstanceOf(RhythmDrill);
    expect(live).not.toBe(first);
    const again = live as LiveRhythm;
    expectPaused();
    await tapTheOpenGrid(again);
    expect.soft(again.result().answered, 'a tap was judged against the moment the card opened').toBe(0);
    setVisibility('hidden');
    await play(60_000);
    setVisibility('visible');
    await flush();
    expectPaused();
    await play(1_000);
    resumeAudio();
    await flush();
    expectNotPaused();
    await countsInFromTheTop(again);
  });
});

describe('a card’s time to answer counts no hidden time (CL05a)', () => {
  it('a card hidden for 5 min and answered 400 ms after the return took 1.4 s', async () => {
    const section = await mount(noteFlashItem());
    await play(1_000);
    setVisibility('hidden');
    await play(5 * 60_000);
    setVisibility('visible');
    await flush();
    await play(400);
    press(expects(section)[0] as number);
    expect(section.dataset.feedback).toBe('correct');
    click('drill-end');
    expect(stat('average-time-to-answer')).toBe('1400 ms');
  });
});

describe('a key, a MIDI note or the pedal sent to a hidden page feeds no card (CL05a)', () => {
  it.each([
    ['the screen keyboard', press],
    ['a MIDI piano', midiKey],
  ])('a card still open when the page hides is not answered from %s while hidden', async (_route, key) => {
    const section = await mount(noteFlashItem());
    await play(1_000);
    const card = expects(section);
    const counter = text('drill-counter');
    setVisibility('hidden');
    key(card[0] as number);
    expect.soft(section.dataset.feedback ?? '', 'a key to a hidden page answered the card').toBe('');
    await play(5 * 60_000);
    expect(text('drill-counter'), 'the card moved on while hidden').toBe(counter);
    setVisibility('visible');
    await flush();
    expect(expects(section)).toEqual(card);
    key(card[0] as number);
    expect(section.dataset.feedback).toBe('correct');
  });

  it('a pagehide that leaves the page reading visible refuses a key all the same, until pageshow', async () => {
    const section = await mount(noteFlashItem());
    await play(1_000);
    const card = expects(section);
    window.dispatchEvent(new Event('pagehide'));
    expect(document.visibilityState).toBe('visible');
    press(card[0] as number);
    expect(section.dataset.feedback ?? '', 'a key after pagehide answered the card').toBe('');
    window.dispatchEvent(new Event('pageshow'));
    press(card[0] as number);
    expect(section.dataset.feedback).toBe('correct');
  });

  it('a card that opens after a pagehide, the page still reading visible, sounds nothing', async () => {
    findItemSpy.mockResolvedValue(simonItem());
    const router = { navigate: vi.fn(), route: { tab: 'plan' } } as unknown as Router;
    const section = DrillScreen(router, simonItem().id);
    mounted = section;
    document.body.replaceChildren(section);
    // Gone before the drill has loaded.
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    await play(5_000);
    expect(section.dataset.drill).toBe('running');
    expect(piano.playChord, 'the first chain sounded after the page was hidden').not.toHaveBeenCalled();
  });

  it('the pedal sent to a hidden page reaches no pedal card', async () => {
    const feed = vi.spyOn(PedalDrill.prototype, 'feed');
    await mount(pedalItem());
    await play(500);
    setVisibility('hidden');
    midiPedal(127);
    midiPedal(0);
    expect(feed, 'the pedal fed a card on a hidden page').not.toHaveBeenCalled();
    expect(text('drill-pedal-lamp')).toBe('Pedal up');
    setVisibility('visible');
    await flush();
    midiPedal(127);
    expect(feed).toHaveBeenCalledTimes(1);
    expect(text('drill-pedal-lamp')).toBe('Pedal down');
  });
});

describe('each kind moves the moments it holds past a hidden span (CL05a, `Drill.excludeHidden`)', () => {
  /** A clock the case sets by hand. */
  function handClock(): { t: number; now: () => number } {
    const clock = { t: 0, now: (): number => clock.t };
    return clock;
  }
  const on = (midi: number, tMs: number) => ({ kind: 'noteOn' as const, midi, velocity: 90, tMs });
  /** What the screen does on return, through the contract every drill is held to. */
  function passHidden(drill: Drill, hiddenAtMs: number, visibleAtMs: number): void {
    drill.excludeHidden?.(hiddenAtMs, visibleAtMs);
  }

  it('a prompt card: hidden time leaves its answer’s time; a card opened while hidden is timed from the return', () => {
    const clock = handClock();
    const drill = new PromptDrill({
      kind: 'note-flash',
      prompts: [
        { index: 0, label: 'C4', expected: [60] },
        { index: 1, label: 'D4', expected: [62] },
      ],
      anyOctave: false,
      clock,
    });
    clock.t = 1_000;
    drill.next();
    passHidden(drill, 3_000, 303_000);
    drill.feed(on(60, 303_400));
    // Opened at 305 000, inside a hidden span from 304 500 to 605 000.
    clock.t = 305_000;
    drill.next();
    passHidden(drill, 304_500, 605_000);
    drill.feed(on(62, 605_400));
    expect(drill.result().answers.map((answer) => answer.reactionMs)).toEqual([2_400, 400]);
  });

  it('a Simon card: the same', () => {
    const clock = handClock();
    const drill = new SimonDrill({ rng: () => 0.3, clock, rounds: 2 });
    clock.t = 1_000;
    const first = drill.next();
    passHidden(drill, 3_000, 303_000);
    drill.feed(on(first?.expected[0] as number, 303_400));
    expect(drill.result().answers[0]?.reactionMs).toBe(2_400);
  });

  it('a dictation card: hidden time between two chords leaves the answer’s time', () => {
    const clock = handClock();
    const drill = new ChordDictationDrill({ clock });
    const chords = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]];
    drill.next();
    for (const midi of chords[0] ?? []) drill.feed(on(midi, 500));
    for (const midi of chords[1] ?? []) drill.feed(on(midi, 1_000));
    passHidden(drill, 1_500, 301_500);
    for (const midi of chords[2] ?? []) drill.feed(on(midi, 302_000));
    for (const midi of chords[3] ?? []) drill.feed(on(midi, 302_500));
    clock.t = 303_000;
    drill.next();
    expect(drill.result().answers[0]?.correct).toBe(true);
    expect(drill.result().answers[0]?.reactionMs).toBe(2_500);
  });

  it('a dictation card: a chord heard before the hide keeps its distance from the prompt', () => {
    const clock = handClock();
    const drill = new ChordDictationDrill({ clock });
    const chords = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]];
    drill.next();
    chords.forEach((chord, i) => {
      for (const midi of chord) drill.feed(on(midi, 500 + i * 500));
    });
    // All four played by 2 s, the last closed by the screen's ticker in the
    // silence after it; hidden from 2.5 s for five minutes; *Done* after the return.
    drill.tick(2_200);
    passHidden(drill, 2_500, 302_500);
    clock.t = 303_000;
    drill.next();
    expect(drill.result().answers[0]?.reactionMs).toBe(2_000);
  });

  it('a pedal card: a lift after the return is timed in visible time', () => {
    const drill = new PedalDrill({});
    drill.next();
    drill.feed(on(60, 0));
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: 10 });
    drill.next();
    drill.feed(on(59, 1_000));
    passHidden(drill, 1_050, 301_050);
    drill.feed({ kind: 'cc', cc: 64, value: 0, tMs: 301_100 });
    drill.feed({ kind: 'cc', cc: 64, value: 127, tMs: 301_150 });
    drill.next();
    const change = drill.result().answers[0];
    expect(change?.reactionMs).toBe(100);
    expect(change?.correct, 'a clean change judged against hidden time').toBe(true);
  });

  it('a rhythm card: the grid moves on by the whole span, and before the count has named a downbeat nothing moves', () => {
    const clock = handClock();
    const drill = new RhythmDrill({ pattern: [0, 500, 1_000], bpm: 120, clock });
    drill.next();
    drill.latchOnFirstTap();
    drill.feed(on(60, 1_000));
    drill.feed(on(60, 1_500));
    passHidden(drill, 1_700, 301_700);
    expect(drill.startedAt).toBe(301_000);
    drill.feed(on(60, 302_000));
    expect(drill.result().correct).toBe(3);
    expect(drill.result().detail?.extraTaps).toBe(0);

    // Still in the count: the start is only when the card appeared, and a
    // hand finding its place stays a stray after the page has hidden and come back.
    const counting = new RhythmDrill({ pattern: [0, 500], bpm: 120, clock });
    clock.t = 10_000;
    counting.next();
    counting.latchOnFirstTap({ awaitCountIn: true });
    passHidden(counting, 10_500, 310_500);
    expect(counting.startedAt).toBe(10_000);
    counting.feed(on(60, 311_000));
    expect(counting.firstTapAt, 'the wait for the count ended with the hidden span').toBeNull();
  });
});
