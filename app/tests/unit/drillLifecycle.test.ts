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
   */
  const state = {
    available: false,
    frozenMs: 0,
    freezeFrom: null as number | null,
    clicks: [] as { startAt: number; stopAt: number }[],
    context: null as unknown as AudioContext,
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
    // The three members the drill screen reads. Unavailable unless a case
    // says so: `ensureStarted` refuses as the real one does without Web Audio.
    audioEngine: {
      ensureStarted: (): Promise<AudioContext> =>
        audio.available
          ? Promise.resolve(audio.context)
          : Promise.reject(new Error('The Web Audio API is not available in this browser.')),
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
  it('stops its click and its grid while hidden, takes no tap, counts no hidden time, and comes back on the same point of the same grid', async () => {
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
    // The grid moved on by exactly the hidden span, so the next onset is
    // still 300 ms away, as it was when the page hid.
    expect.soft(live.startedAt, 'the grid stayed where it was while the time passed').toBe(grid + 300_000);
    // Tapped on each remaining onset, in visible time.
    await play(300);
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
    // The click came back on the next beat of the moved grid, and every half second after.
    const back = clicksHeard(onAudioClock(visibleAt), onAudioClock(performance.now())).map(onInputTimeline);
    expect.soft(back.length, 'the click did not come back').toBeGreaterThan(3);
    expect.soft(back[0] ?? 0, 'the click came back off the grid').toBeCloseTo(visibleAt + 300, 0);
    expect.soft((back[1] ?? 0) - (back[0] ?? 0)).toBeCloseTo(500, 0);
    // Hidden time is not practice: the recorded row counts what was visible.
    const shownFor = hiddenAt - openedAt + (performance.now() - visibleAt);
    click('drill-next');
    expect(recordRunSpy, 'the finished card was not recorded').toHaveBeenCalledTimes(1);
    expect(Number(recordRunSpy.mock.calls[0]?.[0]?.durationMs)).toBe(shownFor);
  });

  it('comes back on its grid when the audio clock stood still while hidden, reading both clocks again', async () => {
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
    await play(300);
    press(60);
    expect(live.result().correct, 'the tap on the next onset was not judged on time').toBe(3);
    await play(1_000);
    const back = clicksHeard(onAudioClock(visibleAt), Number.POSITIVE_INFINITY).map(onInputTimeline);
    expect(back[0], 'the click did not come back on the grid').toBeCloseTo(visibleAt + 300, 0);
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

  it('hidden after the downbeat, before any tap: quiet while hidden and after, and the first tap after the return starts the pattern and its click', async () => {
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
    setVisibility('visible');
    await flush();
    await play(1_000);
    expect(clicksHeard(onAudioClock(hiddenAt), onAudioClock(performance.now())), 'a click sounded before the first tap').toEqual([]);
    const tapAt = performance.now();
    press(60);
    expect(live.firstTapAt).toBe(tapAt);
    expect(live.result().correct).toBe(1);
    await play(1_000);
    const back = clicksHeard(onAudioClock(tapAt), Number.POSITIVE_INFINITY).map(onInputTimeline);
    expect(back[0], 'the click did not start on the first tap’s grid').toBeCloseTo(tapAt + 500, 0);
    expect(visibleAt - hiddenAt).toBe(300_000);
  });

  it('a tap sent to a hidden page once the count has named the downbeat is not the first onset, and the downbeat comes back as far ahead as it was', async () => {
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
    expect(live.startedAt, 'the downbeat did not move past the hidden span').toBe(downbeat + 300_000);
    // Still as far ahead as it was: a tap 100 ms after the return is a hand finding its place.
    await play(100);
    press(60);
    expect(live.firstTapAt, 'a stray during the resumed count started the rhythm').toBeNull();
    expect(live.result().answered).toBe(0);
    // No second count: a count run again over a downbeat already named would
    // name another, and a stray during it would start the pattern.
    await until(() => text('drill-status').startsWith('Tap the rhythm'), 'the moved downbeat');
    expect(live.startedAt, 'a second count moved the downbeat').toBe(downbeat + 300_000);
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
