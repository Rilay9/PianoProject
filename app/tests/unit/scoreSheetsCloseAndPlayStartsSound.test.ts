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
 * call `ensureStarted()` in the tap where the engine is not running, wait for
 * it at most `PLAY_SOUND_WAIT_MS` with ▶ held and busy, and then act whether or
 * not it settled. The pause never waits.
 *
 * The engine module is replaced by an object whose `state` the tests set and
 * whose `ensureStarted` is a spy; the session, engraver and renderer are
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

const { findItemSpy, modelRef, sessionRef, engine, sheetCloses } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  modelRef: { current: null as ScoreModel | null },
  sessionRef: { current: null as null | Record<string, unknown> },
  /** What the screen sees as the app's audio engine. */
  engine: {
    supported: true,
    /** `AudioEngineState`: 'unsupported' | 'uninitialised' | 'suspended' | 'running'. */
    state: 'running',
    ensureStarted: vi.fn((): Promise<unknown> => Promise.resolve(undefined)),
    contextOrNull: null,
    masterGain: null,
    onStateChange: vi.fn(() => () => undefined),
    startOnFirstGesture: vi.fn(() => () => undefined),
  },
  /** Every sheet opened, with a spy on the `close` its opener was handed. */
  sheetCloses: [] as { id: string | undefined; close: ReturnType<typeof vi.fn> }[],
}));

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
  engine.ensureStarted.mockReset();
  engine.ensureStarted.mockImplementation(() => Promise.resolve(undefined));
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

describe('▶ asks the sound to start inside the tap (U69)', () => {
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

  it('on a paused run: the start is asked for in the tap, and the run carries on once it has answered', async () => {
    await pausedRunOnASuspendedEngine();
    click('score-play');
    expect(engine.ensureStarted, 'nothing on ▶’s path asked the sound to start').toHaveBeenCalledTimes(1);
    expect(session().resumes, 'the run carried on before the sound had started').not.toHaveBeenCalled();
    await settle();
    expect(session().resumes).toHaveBeenCalledTimes(1);
    expect(session().paused).toBe(false);
  });

  it('a start that never answers: ▶ is held and busy until the bound, then the run carries on', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => new Promise(() => undefined));
    vi.useFakeTimers();
    const play = byId('score-play') as HTMLButtonElement;
    play.click();
    expect(play.disabled).toBe(true);
    expect(play.getAttribute('aria-busy')).toBe('true');
    expect(play.dataset.startingSound).toBe('true');
    // A second tap, and Space, in the wait: nothing more.
    play.click();
    pressSpace();
    expect(engine.ensureStarted).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PLAY_SOUND_WAIT_MS - 1);
    expect(session().resumes).not.toHaveBeenCalled();
    expect(play.dataset.startingSound).toBe('true');
    vi.advanceTimersByTime(1);
    expect(session().resumes).toHaveBeenCalledTimes(1);
    expect(play.disabled).toBe(false);
    expect(play.hasAttribute('aria-busy')).toBe(false);
    expect(play.dataset.startingSound).toBeUndefined();
  });

  it('a start that fails still carries the run on', async () => {
    await pausedRunOnASuspendedEngine();
    engine.ensureStarted.mockImplementation(() => Promise.reject(new Error('refused')));
    click('score-play');
    await settle();
    expect(session().resumes).toHaveBeenCalledTimes(1);
  });

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
