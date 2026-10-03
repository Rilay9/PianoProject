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
import type { SessionScore } from '../../src/engine/types';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem } from '../../src/curriculum/types';
import { parseHash, type Router } from '../../src/router';
import { disposeScreen } from '../../src/ui/screenLifecycle';

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
  running: boolean;
  paused: boolean;
}

const { findItemSpy, modelRef, sessionRef, engine, engineListeners, sheetCloses } = vi.hoisted(() => {
  /** Who is listening to the engine's state, as `AudioEngine.onStateChange` keeps them. */
  const engineListeners = new Set<(state: string) => void>();
  return {
    findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
    modelRef: { current: null as ScoreModel | null },
    sessionRef: { current: null as null | Record<string, unknown> },
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
    learnerHasNotes = true;
    readonly starts = vi.fn();
    readonly resumes = vi.fn();
    readonly pauses = vi.fn();
    constructor(_options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      sessionRef.current = this as unknown as Record<string, unknown>;
    }
    previewFirst(): void {}
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    setPiano(): void {}
    start(run: unknown): void {
      this.starts(run);
      this.running = true;
      this.state = { paused: false, step: 0, mode: (run as { mode: string }).mode };
    }
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


/**
 * G86a probe (the brief's item 8, folded into item 7): is `Hear it`'s wait
 * (U67) unbounded, and does a start there that never answers leave ▶ dead?
 * Written to pass on the committed screen, where it confirms the deadlock, and
 * to fail once the wait is bounded. Not for the commit; kept in the run folder.
 */
describe('probe: Hear it’s never-answering start wedges ▶ (committed screen)', () => {
  it('ten minutes after Hear it’s tap, ▶ neither asks nor starts nor says anything', async () => {
    const section = await open();
    engine.state = 'suspended';
    engine.ensureStarted.mockImplementation(neverAnswers);
    vi.useFakeTimers();
    click('score-hear');
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10 * 60 * 1000);
    await settle();
    click('score-play');
    pressSpace();
    click('score-hear');
    vi.advanceTimersByTime(10 * 60 * 1000);
    await settle();
    // The deadlock, as it stands on the committed screen:
    expect(engine.ensureStarted, 'a later tap asked the engine').toHaveBeenCalledTimes(1);
    expect(session().starts, 'a later tap started something').not.toHaveBeenCalled();
    expect(section.dataset.hearing).not.toBe('true');
    expect(playButton().dataset.startingSound, '▶ said it was waiting').toBeUndefined();
    expect(playButton().disabled, '▶ held').toBe(false);
  });
});
