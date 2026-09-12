// @vitest-environment jsdom
/**
 * The Score screen opened by the guided tour (`04` §5, §5c-1).
 *
 * The tour teaches Wait, Tempo and loops on the real screen rather than on an
 * imitation of it inside the drill, so three things have to be true of the
 * screen itself: `?mode=` beats the learner's own default, `?loop=` arrives
 * already looping, and every way off the screen goes back to the tour rather
 * than to a tab. The last one is the part that is easy to half-do — there are
 * three exits, not one: Back in the header, its twin at the bar's left end
 * when the phone is sideways, and Done on the summary sheet.
 *
 * The engraver, the session and the file read are stubbed. What is under test
 * is the wiring around them, and a real OSMD here would make this a slow test
 * of the renderer instead of a fast one of the route.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { SessionScore } from '../../src/engine/types';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem } from '../../src/curriculum/types';
import { parseHash, type Route, type Router } from '../../src/router';

const SONG_ID = 'song.folk.hot-cross-buns';
const TOUR_ID = 'drill.tour.app-basics';

/**
 * Two full 4/4 bars of quarter notes.
 *
 * Full deliberately: a first bar shorter than the time signature is a *pickup*,
 * which `printedBar` numbers 0 — so a four-note model with one note per bar
 * would have the screen calling the first bar 0 and this file asserting a bar
 * numbering the piece does not have.
 */
const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

/**
 * The same music with a one-beat first bar, which is a *pickup*.
 *
 * `printedBar` numbers a pickup **0**, so the bar the loop machinery calls 1
 * is printed 0 and every printed number on the page is one behind. That is the
 * only piece shape on which `?loop=` can be got wrong, so it is the one worth
 * a fixture.
 */
const PICKUP_MODEL = makeModel(
  [0, 4, 5, 6, 7, 8, 9, 10, 11].map((onset, index) => ({
    onset,
    notes: [note({ midi: 60 + index })],
  })),
);

const { findItemSpy, modelRef, onFinishedRef, recordRunSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  recordRunSpy: vi.fn((): Promise<void> => Promise.resolve()),
  /** Which fixture the engraver hands back; swapped by the pickup cases. */
  modelRef: { current: null as ScoreModel | null },
  /** The session's `onFinished`, so a run can be ended without an engine. */
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...original, findItem: findItemSpy };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: recordRunSpy,
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
  // The real module's constants stay real — `MIN`/`MAX` bars are read by the
  // steppers and a stubbed pair would be asserting the stub.
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
    running = false;
    state = null;
    prepared = null;
    expectedNow: number[] = [];
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
    }
    /**
     * The real one returns `undefined` for a range the piece does not have —
     * it looks for `sourceMeasureIndex === from - 1` — and the screen leans on
     * that, so the stub has to refuse the same ranges rather than agreeing to
     * every pair of numbers.
     */
    loopForPrintedBars(from: number, to: number): { fromStep: number; toStep: number } | undefined {
      const steps = modelRef.current?.steps ?? [];
      const first = steps.find((step) => step.sourceMeasureIndex === from - 1);
      const last = [...steps].reverse().find((step) => step.sourceMeasureIndex <= to - 1);
      if (!first || !last || last.index < first.index) return undefined;
      return { fromStep: first.index, toStep: last.index };
    }
    setStrip(): void {}
    setPiano(): void {}
    start(): void {}
    stop(): void {}
    repaint(): void {}
    dispose(): void {}
  },
}));

const { ScoreScreen } = await import('../../src/ui/screens/ScoreScreen');

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

interface FakeRouter {
  route: Route;
  navigate: ReturnType<typeof vi.fn>;
  navigateDrill: ReturnType<typeof vi.fn>;
  navigateScore: ReturnType<typeof vi.fn>;
}

function routerFor(hash: string): FakeRouter {
  return {
    // The real parser, so the test states a URL and not a route object — a
    // route the parser would never produce would prove nothing.
    route: { ...parseHash(hash), tab: 'plan' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateScore: vi.fn(),
  };
}

async function open(hash: string): Promise<{ section: HTMLElement; router: FakeRouter }> {
  const router = routerFor(hash);
  const section = ScoreScreen(router as unknown as Router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(document.querySelector('#score-title')?.textContent).toBe('Hot Cross Buns');
  });
  return { section, router };
}

function click(id: string): void {
  const node = document.querySelector<HTMLButtonElement>(`#${id}`);
  expect(node, id).not.toBeNull();
  (node as HTMLButtonElement).click();
}

/** A finished run, with nothing in it worth a stat. */
function emptyScore(): SessionScore {
  return {
    mode: 'wait',
    tempoPct: 70,
    totalSteps: 4,
    correctSteps: 4,
    expectedNotes: 4,
    hits: 4,
    missedTotal: 0,
    wrongNotesTotal: 0,
    accuracy: 1,
    accuracyEstimated: false,
    lenientChordSteps: 0,
    timing: {
      n: 4,
      meanMs: 0,
      stdDevMs: 0,
      medianMs: 0,
      earlyPct: 0,
      latePct: 0,
      histogram: [],
    },
    hotSpots: [],
    durationMs: 1_000,
    loops: 0,
    rolledChordSteps: 0,
    notes: [],
  };
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(songItem());
  recordRunSpy.mockReset();
  recordRunSpy.mockResolvedValue(undefined);
  onFinishedRef.current = null;
  modelRef.current = MODEL;
  // Both defaults the same and *not* the mode the tour asks for, so "the route
  // won" cannot be confused with "the default happened to agree".
  updateSettings({ defaultModeWithInput: 'tempo', defaultModeWithoutInput: 'tempo' });
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({
    defaultModeWithInput: DEFAULT_SETTINGS.defaultModeWithInput,
    defaultModeWithoutInput: DEFAULT_SETTINGS.defaultModeWithoutInput,
  });
  vi.unstubAllGlobals();
});

describe('a mode in the hash', () => {
  it('is the mode the screen opens in, over the learner’s default', async () => {
    const { section } = await open(`#/score/${SONG_ID}?mode=wait`);
    expect(section.dataset.mode).toBe('wait');
    expect(document.querySelector<HTMLSelectElement>('#score-mode')?.value).toBe('wait');
  });

  it('and without one the default still decides', async () => {
    const { section } = await open(`#/score/${SONG_ID}`);
    expect(section.dataset.mode).toBe('tempo');
  });

  it('leaves the select live, so the learner can still change it', async () => {
    const { section } = await open(`#/score/${SONG_ID}?mode=wait`);
    const select = document.querySelector<HTMLSelectElement>('#score-mode');
    expect(select).not.toBeNull();
    (select as HTMLSelectElement).value = 'free';
    (select as HTMLSelectElement).dispatchEvent(new Event('change'));
    expect(section.dataset.mode).toBe('free');
  });
});

describe('a loop in the hash', () => {
  it('opens with those printed bars already looping', async () => {
    const { section } = await open(`#/score/${SONG_ID}?mode=wait&loop=1-2`);
    expect(section.dataset.loop).toBe('1-2');
    // …and the control says so in the same words it would if a finger had set
    // it, because it is the same state.
    expect(document.querySelector('#score-loop')?.textContent).toContain('1');
    expect(document.querySelector('#score-loop')?.textContent).toContain('2');
  });

  it('is absent when the hash does not ask for one', async () => {
    const { section } = await open(`#/score/${SONG_ID}`);
    expect(section.dataset.loop).toBe('');
    expect(document.querySelector('#score-loop')?.textContent).toBe('Off');
  });

  it('is refused in a performance, which is one pass by definition', async () => {
    const { section } = await open(`#/score/${SONG_ID}?performance=1&loop=1-2`);
    expect(section.dataset.loop).toBe('');
  });

  it('loops the bars the hash names on a piece that opens with a pickup', async () => {
    // The hash is written in the numbers a person reads off the page, and on a
    // pickup piece those are one behind the numbers the loop counts in. Asked
    // for 0-1 the screen must say it is looping 0-1 — not 1-2, and not, as it
    // did, nothing at all, because bar 0 counted in is `sourceMeasureIndex` -1
    // and no such bar exists.
    modelRef.current = PICKUP_MODEL;
    const { section } = await open(`#/score/${SONG_ID}?loop=0-1`);
    expect(section.dataset.loop).toBe('0-1');
    expect(document.querySelector('#score-loop')?.textContent).not.toBe('Off');
  });

  it('and still names them on a piece that does not', async () => {
    const { section } = await open(`#/score/${SONG_ID}?loop=1-2`);
    expect(section.dataset.loop).toBe('1-2');
  });

  it('is dropped when the piece has no such bars', async () => {
    // Two bars long. A Loop control announcing bars 40 and 41 would be naming
    // a range that loops nothing.
    const { section } = await open(`#/score/${SONG_ID}?loop=40-41`);
    expect(section.dataset.loop).toBe('');
    expect(document.querySelector('#score-loop')?.textContent).toBe('Off');
  });
});

describe('the way back out', () => {
  it('Back returns to the tour that opened it', async () => {
    const { router } = await open(`#/score/${SONG_ID}?mode=wait&tour=${TOUR_ID}`);
    click('score-back');
    expect(router.navigateDrill).toHaveBeenCalledWith(TOUR_ID);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('so does the copy of Back the phone shows sideways', async () => {
    const { router } = await open(`#/score/${SONG_ID}?mode=wait&tour=${TOUR_ID}`);
    click('score-back-side');
    expect(router.navigateDrill).toHaveBeenCalledWith(TOUR_ID);
  });

  it('and so does Done on the summary sheet at the end of a run', async () => {
    const { router } = await open(`#/score/${SONG_ID}?mode=wait&tour=${TOUR_ID}`);
    expect(onFinishedRef.current).not.toBeNull();
    onFinishedRef.current?.(emptyScore(), false);
    click('summary-done');
    expect(router.navigateDrill).toHaveBeenCalledWith(TOUR_ID);
  });

  it('goes to the tab it came from when no tour opened it', async () => {
    const { router } = await open(`#/score/${SONG_ID}`);
    click('score-back');
    expect(router.navigate).toHaveBeenCalledWith('plan');
    expect(router.navigateDrill).not.toHaveBeenCalled();
  });

  it('does not strand the learner on a tour id that is not a catalog id', async () => {
    // The parser drops it, so the screen behaves as though none was given.
    const { router } = await open(`#/score/${SONG_ID}?tour=../../etc/passwd`);
    click('score-back');
    expect(router.navigate).toHaveBeenCalledWith('plan');
  });
});

describe('the controls that are routes keep the tour', () => {
  it('Blind carries the mode, the loop and the way back', async () => {
    const { router } = await open(`#/score/${SONG_ID}?mode=wait&loop=1-2&tour=${TOUR_ID}`);
    click('score-blind');
    expect(router.navigateScore).toHaveBeenCalledWith(SONG_ID, {
      mode: 'wait',
      loop: { from: 1, to: 2 },
      tour: TOUR_ID,
      blind: true,
      performance: false,
    });
  });

  it('Perform does too', async () => {
    const { router } = await open(`#/score/${SONG_ID}?mode=tempo&tour=${TOUR_ID}`);
    click('score-performance');
    expect(router.navigateScore).toHaveBeenCalledWith(SONG_ID, {
      mode: 'tempo',
      tour: TOUR_ID,
      blind: false,
      performance: true,
    });
  });
});
