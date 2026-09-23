// @vitest-environment jsdom
/**
 * What a control in the `⋯` sheet does to a run that is already going (T23).
 *
 * The question this file asks is column 3 of T23's grid — *a setting changed
 * mid-run* — on the two controls a learner reaches for with their hands on
 * the keys: the click, and the tempo. Both used to answer it the same way,
 * by calling `startRun()`, which is the run again from its first bar with
 * every mark on the page cleared, another count-in, and nothing at all on the
 * screen saying the run the learner was in had just been thrown away.
 *
 * Why a file of its own rather than more cases in `scoreTourRoute.test.ts`:
 * that file's `ScoreSession` stub leaves `running` false for ever, which is
 * what lets its tests press `▶` twice to mean two runs. The claims here are
 * about a run that **is** running, so the stub has to say so, and changing
 * the shared one would turn its second `▶` into a pause.
 *
 * The engraver, the renderer and the session are stubbed. What is under test
 * is which session calls the screen makes, which is the whole of the fault.
 *
 * **Nothing here is heard.** jsdom has no audio; whether the click that
 * `setMetronome` starts lands in phase with the judging grid is the
 * arithmetic in `startMetronomeOnGrid`, and no test in this repository
 * listens to it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeModel, note } from './helpers/engineHarness';
import { DEFAULT_SETTINGS, updateSettings } from '../../src/data/settingsStore';
import type { SessionScore } from '../../src/engine/types';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem } from '../../src/curriculum/types';
import { parseHash, type Router } from '../../src/router';

const SONG_ID = 'song.folk.hot-cross-buns';

/** Two full 4/4 bars, so the first bar is not a pickup. */
const MODEL = makeModel(
  [64, 62, 60, 62, 64, 64, 64, 64].map((midi, index) => ({
    onset: index,
    notes: [note({ midi })],
  })),
);

const { findItemSpy, modelRef, sessionRef, onFinishedRef } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  modelRef: { current: null as ScoreModel | null },
  /** The stub the screen is holding, so the calls it received can be read. */
  sessionRef: { current: null as null | Record<string, unknown> },
  onFinishedRef: { current: null as null | ((score: SessionScore, looped: boolean) => void) },
}));

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
    /** Unlike the shared stub's, this one runs — see the file comment. */
    running = false;
    state: { paused: boolean; step: number } | null = null;
    prepared = null;
    expectedNow: number[] = [];
    learnerHasNotes = true;
    readonly starts = vi.fn();
    readonly metronomes = vi.fn();
    constructor(options: { onFinished?: (score: SessionScore, looped: boolean) => void }) {
      onFinishedRef.current = options.onFinished ?? null;
      sessionRef.current = this as unknown as Record<string, unknown>;
    }
    loopForPrintedBars(): undefined {
      return undefined;
    }
    setStrip(): void {}
    setPiano(): void {}
    start(run: unknown): void {
      this.starts(run);
      this.running = true;
      this.state = { paused: false, step: 0 };
    }
    setMetronome(on: boolean): void {
      this.metronomes(on);
    }
    pause(): void {
      if (this.state) this.state.paused = true;
    }
    resume(): void {
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

function routerFor(hash: string): Record<string, unknown> {
  return {
    // The real parser, so the test states a URL rather than a route object.
    route: { ...parseHash(hash), tab: 'plan' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  };
}

async function open(hash: string): Promise<HTMLElement> {
  const section = ScoreScreen(routerFor(hash) as unknown as Router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(document.querySelector('#score-title')?.textContent).not.toBe('');
  });
  return section;
}

function click(id: string): void {
  const node = document.querySelector<HTMLElement>(`#${id}`);
  expect(node, id).not.toBeNull();
  (node as HTMLElement).click();
}

/** The stub the screen built, with its two spies. */
function session(): { starts: ReturnType<typeof vi.fn>; metronomes: ReturnType<typeof vi.fn> } {
  const held = sessionRef.current;
  expect(held, 'the screen never built a session').not.toBeNull();
  return held as unknown as { starts: ReturnType<typeof vi.fn>; metronomes: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
  );
  modelRef.current = MODEL;
  sessionRef.current = null;
  onFinishedRef.current = null;
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(songItem());
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

describe('the click, reached for mid-piece', () => {
  it('starts without throwing the run away', async () => {
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-play');
    expect(session().starts).toHaveBeenCalledTimes(1);
    click('score-metronome');
    // The one call that matters: the run is not started a second time. Before
    // this fix the row called `startRun()`, so reaching for the click meant
    // the run again from bar 1 with every mark on the page cleared.
    expect(session().starts).toHaveBeenCalledTimes(1);
    expect(session().metronomes).toHaveBeenLastCalledWith(true);
    expect(document.querySelector('#score-metronome')?.textContent).toBe('On');
  });

  it('and stops the same way', async () => {
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-play');
    click('score-metronome');
    click('score-metronome');
    expect(session().starts).toHaveBeenCalledTimes(1);
    expect(session().metronomes).toHaveBeenLastCalledWith(false);
    expect(document.querySelector('#score-metronome')?.textContent).toBe('Off');
  });

  it('and is still what the next run is started with', async () => {
    // The row is a setting as well as an act: a run started after it has been
    // pressed must carry it, or the click would vanish at the next restart.
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-metronome');
    click('score-play');
    expect(session().starts).toHaveBeenLastCalledWith(
      expect.objectContaining({ metronome: true }),
    );
  });
});

describe('the tempo slider, moved mid-run', () => {
  function slider(): HTMLInputElement {
    const el = document.querySelector<HTMLInputElement>('#score-tempo');
    expect(el).not.toBeNull();
    return el as HTMLInputElement;
  }

  it('re-times the run once the finger comes off, not on every step of the drag', async () => {
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-play');
    expect(session().starts).toHaveBeenCalledTimes(1);
    const tempo = slider();
    // A drag: `input` per step, `change` when it is let go.
    for (const value of ['95', '90', '85', '80']) {
      tempo.value = value;
      tempo.dispatchEvent(new Event('input'));
    }
    expect(session().starts).toHaveBeenCalledTimes(1);
    // …and the label follows the finger all the same, which is what `input`
    // is for: a slider whose readout only moved on release would look broken.
    expect(document.querySelector('#score-tempo-label')?.textContent).toContain('80');
    tempo.dispatchEvent(new Event('change'));
    expect(session().starts).toHaveBeenCalledTimes(2);
    expect(session().starts).toHaveBeenLastCalledWith(expect.objectContaining({ tempoPct: 80 }));
  });
});

/**
 * The phone locks mid-run, and the sentence that comes back names a way out.
 *
 * It read *"▶ to carry on, ⏮ to start again"*. Two searches — for `⏮` over
 * `src/ui` and over `style.css` — returned only that sentence itself, so the
 * glyph it told the learner to press is on no control in the app. The thing it
 * means is the *Start again* row inside `⋯`.
 */
describe('coming back to a run the phone interrupted', () => {
  function hide(hidden: boolean): void {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (hidden ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }

  afterEach(() => {
    hide(false);
  });

  it('names a control that is on the screen', async () => {
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-play');
    hide(true);
    hide(false);
    const said = document.querySelector('#score-status')?.textContent ?? '';
    expect(said).toContain('Paused');
    expect(said).toContain('Start again');
    expect(said).not.toContain('⏮');
    // …and it is a control, not a form of words: the row it names is in `⋯`.
    expect(document.querySelector('#score-restart')?.textContent).toBe('Start again');
  });
});

describe('the end of a Free play run', () => {
  it('says the piece has ended, because nothing else on the screen does', async () => {
    await open(`#/score/${SONG_ID}?mode=free`);
    click('score-play');
    const finish = onFinishedRef.current;
    expect(finish).not.toBeNull();
    finish?.(
      { mode: 'free', accuracy: 0, hits: 0, correctSteps: 0, wrongNotesTotal: 0 } as SessionScore,
      false,
    );
    // Free judges nothing and opens no summary, so without a sentence the
    // page simply stops turning under an improviser still playing.
    expect(document.querySelector('#score-status')?.textContent).toBe('End of the piece.');
  });
});
