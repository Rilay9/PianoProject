// @vitest-environment jsdom
/**
 * Two things the Score screen owes the screens around it (G86, U69).
 *
 * **Its sheets close when it goes (G86).** The ⋯ and tempo sheets sit on
 * `body`, outside the `main` the app shell empties on a route change, and a
 * sheet puts every other child of `body` out of reach (`inert`) until its own
 * close runs. The screen pushed a closer for each onto `openSheets` and nothing
 * read the list, so Back with one open left it over the next screen and that
 * screen inert beneath it. The disposer now drains the list, and a closer
 * leaves it when its sheet closes by Close, the backdrop or Escape.
 *
 * **▶ asks the sound to start inside the tap (U69).** The engine's
 * first-gesture start is one-shot; once a platform has suspended the context
 * (a locked screen, a call), nothing on ▶'s path started it again, so the run
 * went on silent. Every ▶ branch that makes a sound, and Space's start, now
 * call `ensureStarted()` in the tap where the engine is not running and wait
 * for it at most `PLAY_SOUND_WAIT_MS` with ▶ held and busy. The pause never
 * waits.
 *
 * **…and starts nothing when the sound did not start (G86a).** Where the wait
 * ends (the bound, the start answering or the start failing) with the engine
 * still not running, nothing starts, carries on or ends: ▶ reads ▶ again, the
 * state line says *Sound did not start — tap ▶ again*, and the next tap asks
 * the engine again. U69 went ahead at the bound whatever the engine said,
 * which is the silent run it existed to stop (the reviewer's ruling,
 * `responses/970fd770.md`); its two cases that asserted that are replaced
 * here. `Hear it`'s own wait (U67) is the same gate now, bounded, so a start
 * that never answers there no longer leaves ▶ dead behind it.
 *
 * **…and so does every other tap that starts the sound (U105).** *Carry on*,
 * *Start again*, a hand after *Nothing for the … hand*, a bar held down,
 * *Try again*, and the summary's *Again*, *Slower*, *Faster* and *Loop the
 * weak bars* called `startRun` directly, so with the audio suspended each
 * started a run nobody heard. Each now runs its whole handler through the same
 * gate: refused, nothing it would have changed is changed, and the line names
 * the control. A key on a connected piano is not a tap the platform lets start
 * the sound (the reviewer's ruling, `responses/questions-bd7d303e.md`): with
 * the sound running it starts the run as before; with it suspended it asks
 * nothing, starts nothing and says to tap ▶. A key on the screen is a tap: it
 * asks, and where the answer comes after the key's own moment the run starts
 * without that key, which is never fed back-dated.
 *
 * **…and a refused tap on the summary says so on the summary (U105a).**
 * Sideways the header is not drawn and the bar that mirrors its line is under
 * the sheet, so the sheet carries the sentence itself, first on it, as a
 * status (the reviewer's required change, `responses/f51e8010.md`), painted
 * only where the header is not drawn.
 *
 * The engine module is replaced by an object whose `state` the tests set and
 * whose `ensureStarted` is a spy that by default does what the real one does
 * when it succeeds: it returns once the context is running, and publishes the
 * change (`AudioEngine.ensureStarted` awaits `resume()`, and a context whose
 * resume has resolved is running). The session, engraver and renderer are
 * stubbed as `scoreMidRunSettings.test.ts` stubs them (its session runs, so a
 * second ▶ is a pause). `getPiano` is held so the load itself never calls the
 * engine. What is observed is which calls the screen makes and when.
 *
 * **Nothing here is heard, and nothing here is a phone.** Whether a real
 * context suspended by Android resumes on ▶ is unverified on a device; the
 * browser case in `score.screen.spec.ts` observes a Chromium context going
 * from suspended to running after ▶, and that Chromium does not apply the
 * gesture rule either.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import { forgetAllUnfinishedForTest, rememberUnfinished, unfinishedFor } from '../../src/data/unfinishedRun';
import { timingStats } from '../../src/engine/Scoring';
import type { SessionScore } from '../../src/engine/types';
import type { InputNoteEvent } from '../../src/midi/types';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem } from '../../src/curriculum/types';
import { parseHash, type Router } from '../../src/router';
import { disposeScreen } from '../../src/ui/screenLifecycle';
import { screenKeyboardSource, webMidiSource } from '../../src/app/services';

const SONG_ID = 'song.folk.hot-cross-buns';

/** Two full 4/4 bars, so the first bar is not a pickup. */
const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

interface SessionSpies {
  starts: ReturnType<typeof vi.fn>;
  resumes: ReturnType<typeof vi.fn>;
  pauses: ReturnType<typeof vi.fn>;
  /** Every note played into the run: `(midi, velocity, tMs, confidence)` (U105). */
  feeds: ReturnType<typeof vi.fn>;
  running: boolean;
  paused: boolean;
}

const { findItemSpy, modelRef, sessionRef, onFinishedRef, handsWithoutNotes, engine, engineListeners, sheetCloses } = vi.hoisted(() => {
  /** Who is listening to the engine's state, as `AudioEngine.onStateChange` keeps them. */
  const engineListeners = new Set<(state: string) => void>();
  return {
    findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
    modelRef: { current: null as ScoreModel | null },
    sessionRef: { current: null as null | Record<string, unknown> },
    /** The screen's finish handler, so a test can end a run and open the summary (U105). */
    onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
    /** Hands the piece has nothing for, so a run with one of them is refused (U105). */
    handsWithoutNotes: new Set<string>(),
    engineListeners,
    /** What the screen sees as the app's audio engine. */
    engine: {
      supported: true,
      /** `AudioEngineState`: 'unsupported' | 'uninitialised' | 'suspended' | 'running'. */
      state: 'running',
      ensureStarted: vi.fn((): Promise<unknown> => Promise.resolve(undefined)),
      contextOrNull: null,
      masterGain: null,
      onStateChange: vi.fn((listener: (state: string) => void) => {
        engineListeners.add(listener);
        return () => engineListeners.delete(listener);
      }),
      startOnFirstGesture: vi.fn(() => () => undefined),
    },
    /** Every sheet opened, with a spy on the `close` its opener was handed. */
    sheetCloses: [] as { id: string | undefined; close: ReturnType<typeof vi.fn> }[],
  };
});

vi.mock('../../src/audio/AudioEngine', () => ({ audioEngine: engine }));

vi.mock('../../src/app/services', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/app/services')>();
  // Held: the load's `getPiano()` would otherwise call `ensureStarted` itself.
  return { ...original, getPiano: vi.fn(() => new Promise(() => undefined)) };
});

vi.mock('../../src/ui/widgets', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/ui/widgets')>();
  return {
    ...original,
    openSheet: (title: string, options: { id?: string } = {}) => {
      const sheet = original.openSheet(title, options);
      const close = vi.fn(sheet.close);
      sheetCloses.push({ id: options.id, close });
      return { ...sheet, close };
    },
  };
});

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...original, findItem: findItemSpy };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: vi.fn(() => Promise.resolve()),
  sessionsForItem: vi.fn(() => Promise.resolve([])),
}));

// The session's transition (X1), for *Try again* (U105): a route with `?session=` gets a handle that
// records nothing, and the transition draws only *Try again*, wired to the screen's own restart, as
// `drawTransition` draws it after a measured failure (`sessionTransition.test.ts`).
vi.mock('../../src/ui/sessionRunner', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/ui/sessionRunner')>();
  const { SESSION_TEXT } = await import('../../src/ui/help');
  return {
    ...original,
    sessionHandle: (token: string | undefined) =>
      token === undefined || token === ''
        ? null
        : {
            token,
            record: () => Promise.resolve(null),
            opened: () => Promise.resolve(),
            attempted: () => undefined,
            completed: () => Promise.resolve(null),
            startClock: () => () => undefined,
            write: () => Promise.resolve({ ok: false, why: 'none', run: null }),
          },
    drawTransition: (into: HTMLElement, host: { button: (label: string, onClick: () => void, id: string, primary: boolean) => HTMLElement; tryAgain: () => void }) => {
      into.replaceChildren(host.button(SESSION_TEXT.tryAgain, () => host.tryAgain(), 'session-try-again', true));
      into.hidden = false;
      return Promise.resolve('kept-here');
    },
  };
});

vi.mock('../../src/score/mxl', () => ({ toMusicXml: () => '<score-partwise/>' }));

vi.mock('../../src/score/OsmdView', () => ({
  OsmdView: class {
    load(): Promise<void> {
      return Promise.resolve();
    }
    extractModel(): unknown {
      return modelRef.current;
    }
    dispose(): void {
      /* nothing to tear down */
    }
  },
}));

vi.mock('../../src/score/WindowRenderer', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/score/WindowRenderer')>();
  return {
    ...original,
    WindowRenderer: class {
      stepIndex = 0;
      currentWindow = { fromMeasure: 0, toMeasure: 1 };
      static create(): Promise<unknown> {
        return Promise.resolve(new this());
      }
      showStep(): void {}
      setHandsFocus(): void {}
      setBarsPerWindow(): void {}
      setLoopRange(): void {}
      setRunning(): void {}
      placeSlots(): void {}
      fitToStage(): void {}
      refit(): void {}
      dispose(): void {}
      debugFit(): null {
        return null;
      }
    },
  };
});

vi.mock('../../src/score/ScoreSession', () => ({
  ScoreSession: class {
    /** A session that runs, as `scoreMidRunSettings.test.ts`'s does. */
    running = false;
    hasSuspended = false;
    state: { paused: boolean; step: number; mode: string } | null = null;
    get paused(): boolean {
      return this.state?.paused === true;
    }
    get mode(): string | null {
      return this.state?.mode ?? null;
    }
    prepared = null;
    expectedNow: number[] = [];
    /** Holding for the learner's first note: the key-started run's case (U105). */
    armed = false;
    /** The hands of the last run asked for, for `learnerHasNotes`. */
    lastHands = 'both';
    /** False for a hand the piece has nothing for (`handsWithoutNotes`), which the screen refuses. */
    get learnerHasNotes(): boolean {
      return !handsWithoutNotes.has(this.lastHands);
    }
    readonly starts = vi.fn();
    readonly resumes = vi.fn();
    readonly pauses = vi.fn();
    readonly feeds = vi.fn();
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      sessionRef.current = this as unknown as Record<string, unknown>;
      onFinishedRef.current = options.onFinished ?? null;
    }
    previewFirst(): void {}
    /** A loop over the bars asked for: a bar held down plays (U105), and a loop run starts. */
    loopForPrintedBars(from: number, to: number): { from: number; to: number } {
      return { from, to };
    }
    setStrip(): void {}
    setPiano(): void {}
    start(run: unknown): void {
      this.starts(run);
      this.running = true;
      const asked = run as { mode: string; hands?: string; startPaused?: boolean };
      this.lastHands = asked.hands ?? 'both';
      // Held paused where the start asks for it: an option changed while paused (T33, C2).
      this.state = { paused: asked.startPaused === true, step: 0, mode: asked.mode };
    }
    feed(midi: number, velocity: number, tMs: number, confidence: number): void {
      this.feeds(midi, velocity, tMs, confidence);
    }
    feedOff(): void {}
    feedSustain(): void {}
    setMetronome(): void {}
    pause(): void {
      this.pauses();
      if (this.state) this.state.paused = true;
    }
    resume(): void {
      this.resumes();
      if (this.state) this.state.paused = false;
    }
    stop(): void {
      this.running = false;
      this.state = null;
    }
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen, PLAY_SOUND_WAIT_MS } = await import('../../src/ui/screens/ScoreScreen');
const { STATE_TEXT } = await import('../../src/ui/help');

/** What the state line says when ▶'s (or Space's) tap could not start the sound (G86a). */
const PLAY_REFUSED = STATE_TEXT.soundOff('▶');
/** …and when `Hear it`'s could not. */
const HEAR_REFUSED = STATE_TEXT.soundOff('Hear it');

/** The engine's state changed, published to its listeners as `AudioEngine`'s `emit` does. */
function engineBecomes(state: string): void {
  engine.state = state;
  for (const listener of [...engineListeners]) listener(state);
}

/**
 * The real `ensureStarted` on success: it returns only once `resume()` has
 * resolved, which leaves the context running, and publishes that first.
 */
function startsTheSound(): Promise<unknown> {
  return Promise.resolve().then(() => engineBecomes('running'));
}

/** A start that never answers: the context's `resume()` hanging, as G86's probe stubbed it. */
function neverAnswers(): Promise<unknown> {
  return new Promise(() => undefined);
}

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout in jsdom */
};

function songItem(): CatalogItem {
  return {
    id: SONG_ID,
    type: 'song',
    title: 'Hot Cross Buns',
    level: 0.3,
    tracks: ['core'],
    concepts: [],
    file: 'scores/authored/song.folk.hot-cross-buns.mxl',
  } as unknown as CatalogItem;
}

function routerFor(hash: string): Record<string, unknown> {
  return {
    route: { ...parseHash(hash), tab: 'plan' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  };
}

async function open(hash = `#/score/${SONG_ID}?mode=tempo`): Promise<HTMLElement> {
  const section = ScoreScreen(routerFor(hash) as unknown as Router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(document.querySelector('#score-title')?.textContent).not.toBe('');
  });
  return section;
}

function byId(id: string): HTMLElement {
  const node = document.getElementById(id);
  expect(node, id).not.toBeNull();
  return node as HTMLElement;
}

function click(id: string): void {
  byId(id).click();
}

function session(): SessionSpies {
  const held = sessionRef.current;
  expect(held, 'the screen never built a session').not.toBeNull();
  return held as unknown as SessionSpies;
}

/** Children of `body` a sheet has put out of reach. */
function inertBodyChildren(): number {
  return Array.from(document.body.children).filter((node) => (node as HTMLElement).inert === true).length;
}

/** Lets the engine's settled start reach the screen's `.then`. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

function pressSpace(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
}

function playButton(): HTMLButtonElement {
  return byId('score-play') as HTMLButtonElement;
}

/** ▶ in its non-playing state, free to press, with nothing waiting on it. */
function expectPlayAtRest(): void {
  const play = playButton();
  expect(play.textContent, '▶’s glyph').toBe('▶');
  expect(play.getAttribute('aria-label')).toBe('Play');
  expect(play.disabled, '▶ left held').toBe(false);
  expect(play.hasAttribute('aria-busy'), '▶ left busy').toBe(false);
  expect(play.dataset.startingSound).toBeUndefined();
}

/** What the state line says now. */
function stateLine(): string {
  return byId('score-waiting').textContent ?? '';
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  // Every first-sight card already seen, as the browser specs' storage state has it: the mode's
  // card is a `helpStrip` sheet the screen opens on a first visit, and whether it goes with the
  // screen is that module's question (G86's follow-ups), not this file's.
  localStorage.setItem('pianopath.firstSight', JSON.stringify(['*']));
  modelRef.current = MODEL;
  sessionRef.current = null;
  onFinishedRef.current = null;
  handsWithoutNotes.clear();
  forgetAllUnfinishedForTest();
  sheetCloses.length = 0;
  engine.supported = true;
  engine.state = 'running';
  // A screen left in `body` by the last case is replaced, not disposed: its listener goes here.
  engineListeners.clear();
  engine.ensureStarted.mockReset();
  engine.ensureStarted.mockImplementation(startsTheSound);
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(songItem());
  updateSettings({ defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo' });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  updateSettings({
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
  });
  vi.unstubAllGlobals();
});

describe('the Score screen’s sheets go with it (G86)', () => {
  it('leaving with ⋯ open takes the sheet, gives the page back, and parks its rows', async () => {
    const section = await open();
    click('score-more');
    expect(document.querySelector('#score-more-sheet')).not.toBeNull();
    expect(inertBodyChildren(), 'the open sheet puts the screen out of reach').toBeGreaterThan(0);
    disposeScreen(section);
    expect(document.querySelector('.sheet'), 'a sheet left over the next screen').toBeNull();
    expect(inertBodyChildren(), 'a body child left inert').toBe(0);
    // The rows own their state and ids; they go back where the next opening looks for them.
    expect(byId('score-restart').closest('#score-stash')).not.toBeNull();
  });

  it('and the same with the tempo sheet open', async () => {
    const section = await open();
    click('score-tempo-label');
    expect(document.querySelector('#score-tempo-sheet')).not.toBeNull();
    disposeScreen(section);
    expect(document.querySelector('.sheet')).toBeNull();
    expect(inertBodyChildren()).toBe(0);
    expect(byId('score-tempo').closest('#score-tempo-stash')).not.toBeNull();
  });

  it('a sheet closed by Close leaves no closer behind; the one open at the time is the one closed', async () => {
    const section = await open();
    click('score-more');
    click('score-more-sheet-close');
    await settle();
    expect(document.querySelector('.sheet')).toBeNull();
    click('score-more');
    expect(sheetCloses.map((s) => s.id)).toEqual(['score-more-sheet', 'score-more-sheet']);
    expect(() => disposeScreen(section)).not.toThrow();
    const [first, second] = sheetCloses;
    expect(first?.close, 'the closed sheet closed a second time').not.toHaveBeenCalled();
    expect(second?.close, 'the open sheet closed with the screen').toHaveBeenCalledTimes(1);
    expect(document.querySelector('.sheet')).toBeNull();
    expect(inertBodyChildren()).toBe(0);
  });

  it('Close and then leaving in the same moment throws nothing and closes nothing twice', async () => {
    const section = await open();
    click('score-more');
    click('score-more-sheet-close');
    // No microtask between: the sheet's observer has not yet run.
    expect(() => disposeScreen(section)).not.toThrow();
    expect(sheetCloses[0]?.close).not.toHaveBeenCalled();
    expect(document.querySelector('.sheet')).toBeNull();
    expect(inertBodyChildren()).toBe(0);
    expect(byId('score-restart').closest('#score-stash')).not.toBeNull();
  });
});

/** A Keep tempo run started and paused with the sound running, then the sound suspended. */
async function pausedRunOnASuspendedEngine(): Promise<HTMLElement> {
  const section = await open();
  click('score-play');
  click('score-play');
  expect(session().paused).toBe(true);
  expect(engine.ensureStarted).not.toHaveBeenCalled();
  engine.state = 'suspended';
  return section;
}

describe('▶ asks the sound to start inside the tap (U69)', () => {
  it('on a paused run: the start is asked for in the tap, and the run carries on once it has answered', async () => {
    await pausedRunOnASuspendedEngine();
    click('score-play');
    expect(engine.ensureStarted, 'nothing on ▶’s path asked the sound to start').toHaveBeenCalledTimes(1);
    expect(session().resumes, 'the run carried on before the sound had started').not.toHaveBeenCalled();
    await settle();
    expect(session().resumes).toHaveBeenCalledTimes(1);
    expect(session().paused).toBe(false);
  });

  // U69's *a start that never answers … then the run carries on* and *a start
  // that fails still carries the run on* stood here. Both asserted the
  // fail-open the reviewer's ruling reverses (G86a, class: replace); their
  // replacements are (a) and (d) in the next block.

  it('with the sound running, or no Web Audio at all, ▶ acts at once and asks nothing', async () => {
    await pausedRunOnASuspendedEngine();
    engine.state = 'running';
    click('score-play');
    expect(session().resumes).toHaveBeenCalledTimes(1);
    click('score-play');
    engine.supported = false;
    engine.state = 'unsupported';
    click('score-play');
    expect(session().resumes).toHaveBeenCalledTimes(2);
    expect(engine.ensureStarted).not.toHaveBeenCalled();
  });

  it('the pause never waits', async () => {
    await open();
    click('score-play');
    expect(session().running).toBe(true);
    engine.state = 'suspended';
    click('score-play');
    expect(session().pauses).toHaveBeenCalledTimes(1);
    expect(engine.ensureStarted).not.toHaveBeenCalled();
    expect((byId('score-play') as HTMLButtonElement).disabled).toBe(false);
  });

  it('a fresh start the same: asked in the tap, started once it has answered', async () => {
    const section = await open();
    engine.state = 'uninitialised';
    click('score-play');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    expect(session().starts).not.toHaveBeenCalled();
    // Space and Hear it in the wait: neither asks again or starts anything of its own.
    pressSpace();
    click('score-hear');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    expect(section.dataset.hearing).not.toBe('true');
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(1);
  });

  it('Space’s start the same', async () => {
    await open();
    engine.state = 'suspended';
    pressSpace();
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    expect(session().starts).not.toHaveBeenCalled();
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(1);
  });

  it('▶ during Hear it the same: the demonstration gives way once the start has answered', async () => {
    const section = await open();
    click('score-hear');
    expect(section.dataset.hearing).toBe('true');
    engine.state = 'suspended';
    click('score-play');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    expect(section.dataset.hearing).toBe('true');
    await settle();
    expect(section.dataset.hearing).toBe('false');
    expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'tempo' }));
  });

  it('leaving in the wait cancels: nothing starts on a screen that has gone', async () => {
    const section = await open();
    engine.state = 'suspended';
    let answer: (value: unknown) => void = () => undefined;
    engine.ensureStarted.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
    click('score-play');
    disposeScreen(section);
    answer(undefined);
    await settle();
    expect(session().starts).not.toHaveBeenCalled();
  });
});

/**
 * The reviewer's required change to U69 (G86a, `responses/970fd770.md`): where
 * the wait ends with the sound still not running, nothing starts, ▶ reads ▶,
 * the state line says so in one sentence, and the next tap asks again. And
 * the same gate for `Hear it` (`responses/questions-ecccffb7.md`).
 */
describe('a tap that could not start the sound says so and starts nothing (G86a)', () => {
  it('(a) a start that never answers: ▶ busy until the bound, then nothing carries on, ▶ reads ▶ and the line says so; the next tap asks again', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    const play = playButton();
    play.click();
    expect(play.disabled).toBe(true);
    expect(play.getAttribute('aria-busy')).toBe('true');
    expect(play.dataset.startingSound).toBe('true');
    // A second tap, and Space, in the wait: nothing more (kept from U69's case).
    play.click();
    pressSpace();
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS - 1);
    expect(session().resumes).not.toHaveBeenCalled();
    expect(play.dataset.startingSound).toBe('true');
    vi.advanceTimersByTime(1);
    await settle();
    expect(session().resumes, 'the run carried on against a sound that had not started').not.toHaveBeenCalled();
    expect(session().paused, 'the paused run stays paused').toBe(true);
    expectPlayAtRest();
    expect(stateLine()).toBe(PLAY_REFUSED);
    expect(play.dataset.soundRefused).toBe('true');
    // Nothing recorded the engine as unavailable: the next tap asks, inside the tap.
    engine.ensureStarted.mockImplementation(startsTheSound);
    play.click();
    expect(engine.ensureStarted, 'the next tap did not ask the engine again').toHaveBeenCalledTimes(2);
    await settle();
    expect(session().resumes).toHaveBeenCalledTimes(1);
    expect(session().paused).toBe(false);
    expect(stateLine()).not.toBe(PLAY_REFUSED);
    expect(play.dataset.soundRefused).toBeUndefined();
  });

  it('(b) a fresh start the same: no run starts, ▶ reads ▶, the line says so; the next tap starts it', async () => {
    const section = await open();
    engine.state = 'uninitialised';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('score-play');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(session().starts, 'a run started against a sound that had not started').not.toHaveBeenCalled();
    expect(section.dataset.running).toBe('false');
    expectPlayAtRest();
    expect(stateLine()).toBe(PLAY_REFUSED);
    engine.ensureStarted.mockImplementation(startsTheSound);
    click('score-play');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(2);
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(1);
    expect(stateLine()).not.toBe(PLAY_REFUSED);
  });

  it('(b) and Space’s start the same, Space asking again the next time', async () => {
    await open();
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    pressSpace();
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(session().starts, 'Space started a run against a sound that had not started').not.toHaveBeenCalled();
    expectPlayAtRest();
    expect(stateLine()).toBe(PLAY_REFUSED);
    engine.ensureStarted.mockImplementation(startsTheSound);
    pressSpace();
    expect(engine.ensureStarted).toHaveBeenCalledTimes(2);
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(1);
  });

  it('(c) ▶ over Hear it, refused: the demonstration goes on, nothing is started, and the line says so over it', async () => {
    const section = await open();
    click('score-hear');
    expect(section.dataset.hearing).toBe('true');
    expect(session().starts).toHaveBeenCalledTimes(1);
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('score-play');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(section.dataset.hearing, 'the demonstration ended for a run that could not sound').toBe('true');
    expect(session().starts).toHaveBeenCalledTimes(1);
    expectPlayAtRest();
    expect(stateLine()).toBe(PLAY_REFUSED);
  });

  it('(d) a start that fails: refused the same, with the sentence', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    click('score-play');
    await settle();
    expect(session().resumes, 'a start that failed carried the run on').not.toHaveBeenCalled();
    expect(session().paused).toBe(true);
    expectPlayAtRest();
    expect(stateLine()).toBe(PLAY_REFUSED);
  });

  it('(e) a start that answers with the sound still not running: refused the same', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => Promise.resolve(undefined));
    click('score-play');
    await settle();
    expect(session().resumes, 'an answer with the sound still off carried the run on').not.toHaveBeenCalled();
    expectPlayAtRest();
    expect(stateLine()).toBe(PLAY_REFUSED);
  });

  it('(f) a start that answers after the bound refused: the sentence goes, and nothing starts by itself', async () => {
    await pausedRunOnASuspendedEngine();
    let answer: () => void = () => undefined;
    engine.ensureStarted.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = () => {
            engineBecomes('running');
            resolve(undefined);
          };
        }),
    );
    vi.useFakeTimers();
    click('score-play');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(session().resumes).not.toHaveBeenCalled();
    expect(stateLine()).toBe(PLAY_REFUSED);
    answer();
    await settle();
    expect(stateLine(), 'the sentence outlived the sound starting').toBe(STATE_TEXT.paused);
    expect(playButton().dataset.soundRefused).toBeUndefined();
    expect(session().resumes, 'the run began by itself after the learner was told it had not').not.toHaveBeenCalled();
    expect(session().paused).toBe(true);
    expectPlayAtRest();
  });

  it('(f) and the same where the sound starts some other way while the sentence stands', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    click('score-play');
    await settle();
    expect(stateLine()).toBe(PLAY_REFUSED);
    engineBecomes('running');
    expect(stateLine()).toBe(STATE_TEXT.paused);
    expect(session().resumes).not.toHaveBeenCalled();
  });

  // Revised by U122c (class: replace). It held that the sentence reached the bar's left end and the
  // stage's corner chip, sideways; c6 puts it on the top line in the name's place, marked as a
  // refusal, and the row's status slot never carries it (so the row cannot grow past the window, U120).
  it('(g) the sentence reaches the top line, where the header is not drawn, and the row does not carry it', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    click('score-play');
    await settle();
    expect(byId('score-top-say').textContent).toBe(PLAY_REFUSED);
    expect(byId('score-top').dataset.says).toBe('refusal');
    expect(byId('score-status-side').textContent).toBe('');
  });

  it('Hear it with a start that never answers: no demonstration, the line says so, and ▶ is not left dead', async () => {
    const section = await open();
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('score-hear');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(section.dataset.hearing).not.toBe('true');
    expect(session().starts).not.toHaveBeenCalled();
    // Soft, so a red run shows the deadlock below as well as the missing sentence.
    expect.soft(stateLine(), 'nothing said the sound had not started').toBe(HEAR_REFUSED);
    expect.soft(byId('score-hear').dataset.soundRefused).toBe('true');
    expectPlayAtRest();
    // ▶ asks the engine again in its own tap, and waits for it: the shared flag is clear.
    click('score-play');
    expect(engine.ensureStarted, '▶ left dead behind Hear it’s wait').toHaveBeenCalledTimes(2);
    expect(playButton().dataset.startingSound).toBe('true');
  });

  it('Hear it whose start answers with the sound running: the demonstration begins', async () => {
    const section = await open();
    engine.state = 'suspended';
    click('score-hear');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    expect(section.dataset.hearing).not.toBe('true');
    await settle();
    expect(section.dataset.hearing).toBe('true');
    expect(stateLine()).not.toBe(HEAR_REFUSED);
  });

  it('Hear it whose start fails, then answers with the sound still off: no demonstration either time, the line says so', async () => {
    const section = await open();
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    click('score-hear');
    await settle();
    expect(section.dataset.hearing, 'a demonstration moving, silent, after a start that failed').not.toBe('true');
    expect(session().starts).not.toHaveBeenCalled();
    expect(stateLine()).toBe(HEAR_REFUSED);
    engine.ensureStarted.mockImplementation(() => Promise.resolve(undefined));
    click('score-hear');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(2);
    await settle();
    expect(section.dataset.hearing).not.toBe('true');
    expect(stateLine()).toBe(HEAR_REFUSED);
  });

  it('Hear it answered after the bound: the sentence goes, and the demonstration does not start by itself', async () => {
    const section = await open();
    engine.state = 'suspended';
    let answer: () => void = () => undefined;
    engine.ensureStarted.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = () => {
            engineBecomes('running');
            resolve(undefined);
          };
        }),
    );
    vi.useFakeTimers();
    click('score-hear');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(stateLine()).toBe(HEAR_REFUSED);
    answer();
    await settle();
    expect(stateLine(), 'the sentence outlived the sound starting').not.toBe(HEAR_REFUSED);
    expect(byId('score-hear').dataset.soundRefused).toBeUndefined();
    expect(section.dataset.hearing, 'the demonstration began by itself').not.toBe('true');
    expect(session().starts).not.toHaveBeenCalled();
  });

  it('with no Web Audio, Hear it still plays at once, silent, and nothing says the sound did not start', async () => {
    const section = await open();
    engine.supported = false;
    engine.state = 'unsupported';
    click('score-hear');
    expect(section.dataset.hearing).toBe('true');
    expect(engine.ensureStarted).not.toHaveBeenCalled();
    expect(stateLine()).not.toBe(HEAR_REFUSED);
  });
});

/**
 * A finished Keep tempo run with one weak bar, as `scoreSummaryTruth.test.ts` builds its runs: six
 * notes heard of eight, the first bar missed twice, so the sheet offers *Loop the weak bars*.
 */
function finishedRun(): SessionScore {
  return {
    mode: 'tempo',
    tempoPct: 100,
    totalSteps: 8,
    correctSteps: 6,
    expectedNotes: 8,
    hits: 6,
    missedTotal: 2,
    wrongNotesTotal: 0,
    accuracy: 0.75,
    accuracyEstimated: false,
    lenientChordSteps: 0,
    timing: timingStats([10, -20, 5, 0, 15, -5]),
    hotSpots: [{ measureIndex: 0, misses: 2, wrongs: 0 }],
    durationMs: 8_000,
    loops: 0,
    rolledChordSteps: 0,
    notes: Array.from({ length: 6 }, (_, index) => ({
      midi: 64,
      velocity: 80,
      tMs: index * 500,
      stepIndex: index,
      ok: true,
      deltaMs: 0,
    })),
  };
}

/** A run started with the sound running and finished by the engine: the summary is up. */
async function withTheSummaryUp(hash?: string): Promise<HTMLElement> {
  const section = await open(hash);
  click('score-play');
  expect(session().running).toBe(true);
  // The engine reports its end with the run already over.
  (sessionRef.current as unknown as { stop: () => void }).stop();
  onFinishedRef.current?.(finishedRun(), false);
  await vi.waitFor(() => expect(byId('score-summary').hidden).toBe(false));
  return section;
}

function summaryShows(): boolean {
  return !byId('score-summary').hidden;
}

function selected(id: string): boolean {
  return byId(id).classList.contains('is-selected');
}

/** A control that starts the sound, as the table below drives it (U105). */
interface SoundTapRow {
  /** The control as the table names it, and as the sentence does. */
  name: string;
  /** The control's id: the one that carries `data-sound-refused` while its refusal stands. */
  id: string;
  /** What the state line says when its tap is refused. */
  sentence: string;
  /** Opens the screen and brings the control on, with the sound running. */
  reach: () => Promise<HTMLElement>;
  /** Taps (or holds) it. Fake timers are on. */
  tap: () => void;
  /** What a refused tap leaves as it was. */
  unchanged: (section: HTMLElement) => void;
  /** What the tap does once the sound runs, as it did before. */
  done: (section: HTMLElement) => void;
}

/**
 * The taps U105 puts through the gate, with how each is reached and what its refusal leaves alone
 * (the brief's item 3). *Slower* and *Faster* change the tempo first, so a retry after a refusal that
 * had applied it would move it twice; *Carry on* sets a loop and forgets the record; a demonstration
 * under *Start again* would have ended.
 */
/** The tempo a visit opens at, which *Slower* and *Faster* move by ten. */
const OPENING_TEMPO = DEFAULT_SETTINGS.defaultTempoPct;

const SOUND_TAPS: SoundTapRow[] = [
  {
    name: 'Carry on',
    id: 'score-resume-go',
    sentence: STATE_TEXT.soundOff('Carry on'),
    reach: async () => {
      rememberUnfinished({ itemId: SONG_ID, bar: 2, ofBars: 2, at: new Date().toISOString() });
      const section = await open();
      expect(byId('score-resume').hidden, 'no offer to carry on').toBe(false);
      return section;
    },
    tap: () => click('score-resume-go'),
    unchanged: (section) => {
      expect(byId('score-resume').hidden, 'the offer went').toBe(false);
      expect(unfinishedFor(SONG_ID), 'the record of where the run was left was forgotten').toBeDefined();
      expect(section.dataset.loop, 'a loop was set').toBe('');
    },
    done: (section) => {
      expect(section.dataset.loop).toBe('2-2');
      expect(unfinishedFor(SONG_ID)).toBeUndefined();
      expect(byId('score-resume').hidden).toBe(true);
    },
  },
  {
    name: 'Start again',
    id: 'score-restart',
    sentence: STATE_TEXT.soundOff('Start again'),
    reach: async () => {
      const section = await open();
      click('score-hear');
      expect(section.dataset.hearing).toBe('true');
      return section;
    },
    tap: () => click('score-restart'),
    unchanged: (section) => {
      expect(section.dataset.hearing, 'the demonstration was ended for a run that could not sound').toBe('true');
    },
    done: (section) => {
      expect(section.dataset.hearing).toBe('false');
      expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'tempo' }));
    },
  },
  {
    name: 'R',
    id: 'score-hands-R',
    sentence: STATE_TEXT.soundOff('R'),
    reach: async () => {
      handsWithoutNotes.add('L');
      const section = await open();
      click('score-hands-L');
      click('score-play');
      expect(session().running).toBe(false);
      expect(byId('score-status').textContent).toContain('Nothing for the left hand');
      return section;
    },
    tap: () => click('score-hands-R'),
    unchanged: () => {
      expect(selected('score-hands-L'), 'the hand changed').toBe(true);
      expect(selected('score-hands-R')).toBe(false);
      expect(byId('score-status').textContent).toContain('Nothing for the left hand');
    },
    done: () => {
      expect(selected('score-hands-R')).toBe(true);
      expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ hands: 'R' }));
    },
  },
  {
    name: 'bar 1',
    id: 'score-stage',
    sentence: STATE_TEXT.soundOff('bar 1', { verb: 'hold' }),
    reach: () => open(),
    tap: () => {
      byId('score-stage').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }));
      vi.advanceTimersByTime(400);
    },
    unchanged: (section) => {
      expect(section.dataset.loop, 'the bar was made the loop').toBe('');
      expect(byId('score-status').textContent).not.toContain('as written');
    },
    done: (section) => {
      expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'listen' }));
      expect(section.dataset.loop).toBe('1-1');
    },
  },
  {
    name: 'Try again',
    id: 'session-try-again',
    sentence: STATE_TEXT.soundOff('Try again'),
    reach: async () => {
      const section = await withTheSummaryUp(`#/score/${SONG_ID}?mode=tempo&session=tok00001`);
      await vi.waitFor(() => expect(document.getElementById('session-try-again')).not.toBeNull());
      return section;
    },
    tap: () => click('session-try-again'),
    unchanged: () => {
      expect(summaryShows(), 'the summary went').toBe(true);
    },
    done: () => {
      expect(summaryShows()).toBe(false);
      expect(session().running).toBe(true);
    },
  },
  {
    name: 'Again',
    id: 'summary-again',
    sentence: STATE_TEXT.soundOff('Again'),
    reach: () => withTheSummaryUp(),
    tap: () => click('summary-again'),
    unchanged: () => {
      expect(summaryShows(), 'the summary went').toBe(true);
    },
    done: () => {
      expect(summaryShows()).toBe(false);
      expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ tempoPct: OPENING_TEMPO }));
    },
  },
  {
    name: 'Slower',
    id: 'summary-slower',
    sentence: STATE_TEXT.soundOff('Slower'),
    reach: () => withTheSummaryUp(),
    tap: () => click('summary-slower'),
    unchanged: () => {
      expect((byId('score-tempo') as HTMLInputElement).value, 'the tempo moved').toBe(String(OPENING_TEMPO));
      expect(summaryShows()).toBe(true);
    },
    done: () => {
      expect((byId('score-tempo') as HTMLInputElement).value).toBe(String(OPENING_TEMPO - 10));
      expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ tempoPct: OPENING_TEMPO - 10 }));
    },
  },
  {
    name: 'Faster',
    id: 'summary-faster',
    sentence: STATE_TEXT.soundOff('Faster'),
    reach: () => withTheSummaryUp(),
    tap: () => click('summary-faster'),
    unchanged: () => {
      expect((byId('score-tempo') as HTMLInputElement).value, 'the tempo moved').toBe(String(OPENING_TEMPO));
      expect(summaryShows()).toBe(true);
    },
    done: () => {
      expect((byId('score-tempo') as HTMLInputElement).value).toBe(String(OPENING_TEMPO + 10));
      expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ tempoPct: OPENING_TEMPO + 10 }));
    },
  },
  {
    name: 'Loop',
    id: 'summary-loop',
    sentence: STATE_TEXT.soundOff('Loop'),
    reach: () => withTheSummaryUp(),
    tap: () => click('summary-loop'),
    unchanged: (section) => {
      expect(section.dataset.loop, 'the weak bars were made the loop').toBe('');
      expect(summaryShows()).toBe(true);
    },
    done: (section) => {
      expect(section.dataset.loop).toBe('1-2');
      expect(summaryShows()).toBe(false);
    },
  },
];

/**
 * U105: every tap that can begin audible playback asks for the sound through `withSound`, and a
 * refused tap leaves its whole action unapplied (the reviewer's approval,
 * `responses/questions-bd7d303e.md`). Each row, three ways: the start never answers, it fails, it
 * answers with the sound running.
 */
describe('every tap that starts the sound asks for it, and a refusal names the control (U105)', () => {
  it('G86a’s two sentences are unchanged, byte for byte, by the widened parameter', () => {
    expect(STATE_TEXT.soundOff('▶')).toBe('Sound did not start — tap ▶ again');
    expect(STATE_TEXT.soundOff('Hear it')).toBe('Sound did not start — tap Hear it again');
  });

  it.each(SOUND_TAPS)('$name: a start that never answers changes nothing the tap would change, and the line names it', async (row) => {
    const section = await row.reach();
    const startsBefore = session().starts.mock.calls.length;
    const label = row.id === 'score-stage' ? null : byId(row.id).textContent ?? '';
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    row.tap();
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(session().starts, 'a run started against a sound that had not started').toHaveBeenCalledTimes(startsBefore);
    expect(engine.ensureStarted, 'the tap did not ask the sound to start').toHaveBeenCalledTimes(1);
    row.unchanged(section);
    expect(stateLine(), 'the line does not name the control tapped').toBe(row.sentence);
    // The name is the control's own label, or its first words (`04` §5f).
    if (label !== null) expect(label.startsWith(row.name), `“${row.name}” is not the start of “${label}”`).toBe(true);
    expect(byId(row.id).dataset.soundRefused, 'the tapped control is not marked').toBe('true');
    expect(document.querySelectorAll('[data-sound-refused]'), 'another control marked').toHaveLength(1);
    // The sentence never stands while ▶ reads ⏸ (item 6).
    expect(playButton().textContent).toBe('▶');
    expect(playButton().disabled, 'a tap other than ▶’s held ▶').toBe(false);
  });

  it.each(SOUND_TAPS)('$name: a start that fails is refused the same', async (row) => {
    const section = await row.reach();
    const startsBefore = session().starts.mock.calls.length;
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    vi.useFakeTimers();
    row.tap();
    await settle();
    expect(session().starts, 'a start that failed started a run').toHaveBeenCalledTimes(startsBefore);
    row.unchanged(section);
    expect(stateLine()).toBe(row.sentence);
    expect(byId(row.id).dataset.soundRefused).toBe('true');
  });

  it.each(SOUND_TAPS)('$name: a start that answers with the sound running does what the tap did, once', async (row) => {
    const section = await row.reach();
    const startsBefore = session().starts.mock.calls.length;
    engine.state = 'suspended';
    vi.useFakeTimers();
    row.tap();
    expect(engine.ensureStarted, 'the tap did not ask the sound to start').toHaveBeenCalledTimes(1);
    expect(session().starts, 'a run started before the sound had').toHaveBeenCalledTimes(startsBefore);
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(startsBefore + 1);
    row.done(section);
    expect(stateLine()).not.toBe(row.sentence);
    expect(document.querySelectorAll('[data-sound-refused]')).toHaveLength(0);
  });
});

/** The summary's taps among U105's: the ones whose control is on the summary sheet. */
const SUMMARY_TAPS = SOUND_TAPS.filter((row) =>
  ['session-try-again', 'summary-again', 'summary-slower', 'summary-faster', 'summary-loop'].includes(row.id),
);

/** What the summary's own line says now; empty where there is none. */
function summaryLine(): string {
  return document.getElementById('summary-refusal')?.textContent ?? '';
}

/** Whether a node sits under an ancestor the screen has put out of reach. */
function underInert(node: HTMLElement): boolean {
  for (let at: HTMLElement | null = node; at !== null; at = at.parentElement) {
    if (at.inert) return true;
  }
  return false;
}

/**
 * U105a: a refused tap on the summary says so on the summary (the reviewer's required change,
 * `responses/f51e8010.md`). Sideways the header is not drawn and the bar's mirror of the state line
 * is under the sheet, so a refused *Again* there looked dead. The sheet now carries its own line,
 * `#summary-refusal`, first in the sheet, in the sentence the state line says, as a status a screen
 * reader is told of (the head behind the sheet is inert). Where it is painted is `style.css`'s:
 * sideways only, where the header is not drawn; upright and on a tablet the header's line is the one
 * seen and this copy is for a screen reader (the orchestrator's word at the landing: the sentence
 * once). jsdom loads no CSS and has no layout, so here the line is present, named and reachable, and
 * the header's line is not hidden; what is painted where is `score.screen.spec.ts`'s.
 */
describe('a refused tap on the summary says so on the summary (U105a)', () => {
  it.each(SUMMARY_TAPS)('$name: the summary’s own line names it, first on the sheet, as a status; the tap left unapplied', async (row) => {
    const section = await row.reach();
    const startsBefore = session().starts.mock.calls.length;
    expect(summaryLine(), 'the summary said something before any refusal').toBe('');
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    row.tap();
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(session().starts, 'a run started against a sound that had not started').toHaveBeenCalledTimes(startsBefore);
    row.unchanged(section);
    const sheet = byId('score-summary');
    const line = byId('summary-refusal');
    expect(sheet.contains(line), 'the line is not on the summary').toBe(true);
    expect(line.textContent, 'the summary’s line does not name the control tapped').toBe(row.sentence);
    expect(line.textContent, 'the summary and the state line disagree').toBe(stateLine());
    expect(byId('score-waiting').hidden, 'the header’s line, the one seen upright, is hidden').toBe(false);
    expect(sheet.firstElementChild, 'the line is not the first thing the sheet says').toBe(line);
    expect(line.getAttribute('role'), 'a screen reader is not told').toBe('status');
    expect(underInert(line), 'the line is out of reach with the screen behind the sheet').toBe(false);
    expect(byId(row.id).dataset.soundRefused).toBe('true');
  });

  it('the summary’s line goes when the sound starts some other way, and while the next tap asks; a refusal again brings it back', async () => {
    await withTheSummaryUp();
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('summary-again');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(summaryLine()).toBe(STATE_TEXT.soundOff('Again'));
    engineBecomes('running');
    expect(summaryLine(), 'the line stood over a sound that runs').toBe('');
    expect(summaryShows(), 'the sound starting by itself took the summary').toBe(true);

    engine.state = 'suspended';
    click('summary-slower');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(summaryLine()).toBe(STATE_TEXT.soundOff('Slower'));
    click('summary-again');
    expect(summaryLine(), 'the last refusal stood while the next tap asked').toBe('');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(summaryLine(), 'the line does not follow the tap made last').toBe(STATE_TEXT.soundOff('Again'));
    expect((byId('score-tempo') as HTMLInputElement).value, 'the refused Slower moved the tempo').toBe(String(OPENING_TEMPO));
  });

  it('a refusal standing for a control not on the summary is not said on it', async () => {
    await open();
    click('score-play');
    expect(session().running).toBe(true);
    // Hear it over a run the platform has silenced (U105's Follow-up 2): refused, and still standing
    // when the run's end brings the summary up.
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('score-hear');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    vi.useRealTimers();
    expect(stateLine()).toBe(HEAR_REFUSED);
    (sessionRef.current as unknown as { stop: () => void }).stop();
    onFinishedRef.current?.(finishedRun(), false);
    await vi.waitFor(() => expect(summaryShows()).toBe(true));
    expect(stateLine(), 'the refusal went with the run').toBe(HEAR_REFUSED);
    expect(summaryLine(), 'the summary named a control that is not on it').toBe('');
  });
});

/** The keys (U105, the reviewer's required correction): a piano key and a key on the screen are different events. */
describe('a key that would start a run (U105)', () => {
  let screen: HTMLElement | null = null;
  let pianoKey: ((event: InputNoteEvent) => void) | null = null;
  let onNote: { mockRestore: () => void } | null = null;

  async function openWith(input: 'midi' | 'keys'): Promise<HTMLElement> {
    if (input === 'midi') {
      onNote = vi.spyOn(webMidiSource, 'onNote').mockImplementation((listener) => {
        pianoKey = listener;
        return () => {
          if (pianoKey === listener) pianoKey = null;
        };
      });
    }
    // Wait for me: the learner plays first and there is no count-in, so a key that starts the run
    // is its first note (T8).
    screen = await open(`#/score/${SONG_ID}?mode=wait`);
    const control = byId('score-input') as HTMLSelectElement;
    control.value = input;
    control.dispatchEvent(new Event('change'));
    return screen;
  }

  /** A key on a connected piano, as `WebMidiSource` hands it on. */
  function playPianoKey(midi: number, tMs: number): void {
    expect(pianoKey, 'the screen is not listening to the piano').not.toBeNull();
    pianoKey?.({ kind: 'noteOn', midi, velocity: 80, tMs, confidence: 1, source: 'midi' });
  }

  const KEY_REFUSED = STATE_TEXT.soundOff('▶', { again: false });

  afterEach(() => {
    onNote?.mockRestore();
    onNote = null;
    pianoKey = null;
    screenKeyboardSource.releaseAll();
    if (screen) disposeScreen(screen);
    screen = null;
  });

  it('a piano key with the sound running starts the run and is its first note, at once, as before', async () => {
    await openWith('midi');
    playPianoKey(64, 1_234);
    expect(session().starts).toHaveBeenCalledTimes(1);
    expect(session().feeds).toHaveBeenCalledWith(64, 80, 1_234, 1);
    expect(engine.ensureStarted).not.toHaveBeenCalled();
  });

  it('a piano key with the sound suspended asks nothing, starts nothing, and says to tap ▶; ▶ then starts the run without that key', async () => {
    await openWith('midi');
    engine.state = 'suspended';
    vi.useFakeTimers();
    playPianoKey(64, 1_234);
    expect(session().starts, 'a run started, silent, from a piano key').not.toHaveBeenCalled();
    expect(engine.ensureStarted, 'a piano key asked the sound to start, outside a tap').not.toHaveBeenCalled();
    expect(stateLine()).toBe(KEY_REFUSED);
    expect(playButton().dataset.soundRefused).toBe('true');
    expectPlayAtRest();
    // Refused at once, and not held: nothing starts later on that key's behalf.
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS * 2);
    await settle();
    expect(session().starts).not.toHaveBeenCalled();
    click('score-play');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(1);
    expect(session().feeds, 'the refused key was played into the run later').not.toHaveBeenCalled();
    expect(stateLine()).not.toBe(KEY_REFUSED);
    expect(playButton().dataset.soundRefused).toBeUndefined();
  });

  it('a key on the screen with the sound running starts the run and is its first note, at once, as before', async () => {
    await openWith('keys');
    screenKeyboardSource.noteOn(64, 90, 1_234);
    expect(session().starts).toHaveBeenCalledTimes(1);
    expect(session().feeds).toHaveBeenCalledWith(64, 90, 1_234, 1);
    expect(engine.ensureStarted).not.toHaveBeenCalled();
  });

  it('a key on the screen with the sound suspended asks in its tap; the run starts once it has, and the first note fed is one played after', async () => {
    await openWith('keys');
    engine.state = 'suspended';
    screenKeyboardSource.noteOn(64, 90, 1_000);
    expect(engine.ensureStarted, 'the key’s tap did not ask the sound to start').toHaveBeenCalledTimes(1);
    expect(session().starts, 'a run started before the sound had').not.toHaveBeenCalled();
    await settle();
    expect(session().starts).toHaveBeenCalledTimes(1);
    // The key was pressed before the sound had started: it started the run and is not played into it,
    // so the run's first note is never one timed before the run began.
    expect(session().feeds, 'the key pressed before the sound started was fed, back-dated').not.toHaveBeenCalled();
    screenKeyboardSource.noteOff(64, 1_050);
    screenKeyboardSource.noteOn(62, 90, 5_000);
    expect(session().feeds).toHaveBeenCalledTimes(1);
    expect(session().feeds).toHaveBeenCalledWith(62, 90, 5_000, 1);
  });

  it('a key on the screen whose start never answers, or fails, starts no run, silent', async () => {
    await openWith('keys');
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    screenKeyboardSource.noteOn(64, 90, 1_000);
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(session().starts, 'a run started, silent, from a key on the screen').not.toHaveBeenCalled();
    expect(stateLine()).toBe(KEY_REFUSED);
    expect(playButton().dataset.soundRefused).toBe('true');
    screenKeyboardSource.noteOff(64, 1_100);
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    screenKeyboardSource.noteOn(64, 90, 2_000);
    await settle();
    expect(engine.ensureStarted).toHaveBeenCalledTimes(2);
    expect(session().starts).not.toHaveBeenCalled();
    expect(session().feeds).not.toHaveBeenCalled();
    expect(stateLine()).toBe(KEY_REFUSED);
  });
});

/** Item 6: the sentence never stands while ▶ reads ⏸; a start held paused keeps it. */
describe('the standing refusal (U105)', () => {
  it('a start that makes ▶ read ⏸ lets the standing refusal go', async () => {
    // A run playing, and the platform suspends the sound under it without the page going away.
    await open();
    click('score-play');
    expect(session().running).toBe(true);
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('score-hear');
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS);
    await settle();
    expect(stateLine()).toBe(HEAR_REFUSED);
    // Another path starts the run again, playing: a hand changed restarts it (T33).
    click('score-hands-L');
    expect(session().starts).toHaveBeenCalledTimes(2);
    expect(playButton().textContent).toBe('⏸');
    expect(stateLine(), 'the refusal stood over a run that plays').not.toBe(HEAR_REFUSED);
    expect(document.querySelectorAll('[data-sound-refused]')).toHaveLength(0);
  });

  it('a restart held paused keeps it: still true, and ▶ reads ▶', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    click('score-play');
    await settle();
    expect(stateLine()).toBe(PLAY_REFUSED);
    click('score-hands-L');
    expect(session().starts).toHaveBeenCalledTimes(2);
    expect(session().paused).toBe(true);
    expect(playButton().textContent).toBe('▶');
    expect(stateLine()).toBe(PLAY_REFUSED);
    expect(playButton().dataset.soundRefused).toBe('true');
  });
});
