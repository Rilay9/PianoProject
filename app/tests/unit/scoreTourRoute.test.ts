// @vitest-environment jsdom
/**
 * The Score screen opened by a hash that asks it for something (`04` §5, §5c-1).
 *
 * The guided tour is what this was written for and `?ladder=1` joined it on
 * 2026-09-22 (`04` §3d): the mocks below are what makes a route testable
 * without a renderer, and a second copy of them would be a second thing to keep
 * in step.
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
const SIGHT_READ_ID = 'drill.reading.sight-read-1';

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

/**
 * A model whose whole-item range cannot be built.
 *
 * `?ladder=1` asks for a loop over the whole piece, and `05` §6 says that where
 * there is no such loop the ladder must do nothing rather than turn on and
 * hope. `sourceMeasureCount` is what the screen asks the whole item's length
 * of, so a model that reports none is the shape of every piece the range comes
 * back empty for, without inventing a second failure in the stub.
 */
const UNLOOPABLE_MODEL = makeModel(
  [64, 62, 60, 62].map((midi, index) => ({ onset: index, notes: [note({ midi })] })),
  { sourceMeasureCount: 0 },
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
    /**
     * The screen refuses to start a run the learner has nothing to play in —
     * a Wait run on a hand this piece does not use would sit on its first step
     * for ever. The fixture is two hands of quarter notes, so the stub says
     * what the real session would say of it; without this every `▶` in this
     * file would stop at "Nothing to play in this piece".
     */
    learnerHasNotes = true;
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

/**
 * A sight-reading drill item, which the Score screen generates notation for
 * rather than fetching (`05` §8).
 */
function sightReadItem(): CatalogItem {
  return {
    id: SIGHT_READ_ID,
    type: 'drill',
    title: 'Sight-read',
    level: 1,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'sight-reading', params: { level: 1, hands: 'right', bars: 2 } },
  } as unknown as CatalogItem;
}

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
  navigateLesson: ReturnType<typeof vi.fn>;
  navigateScore: ReturnType<typeof vi.fn>;
  navigateChart: ReturnType<typeof vi.fn>;
}

function routerFor(hash: string): FakeRouter {
  return {
    // The real parser, so the test states a URL and not a route object — a
    // route the parser would never produce would prove nothing.
    route: { ...parseHash(hash), tab: 'plan' },
    navigate: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  };
}

async function open(hash: string): Promise<{ section: HTMLElement; router: FakeRouter }> {
  const router = routerFor(hash);
  const section = ScoreScreen(router as unknown as Router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.running).toBeDefined();
    expect(document.querySelector('#score-title')?.textContent).not.toBe('');
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

describe('the ladder in the hash', () => {
  /**
   * `?ladder=1` — the whole item is the loop, and the ladder climbs it.
   *
   * The seven rungs this is for are scales, arpeggios, Hanon and octaves: two
   * to thirty bars that repeat by nature, where looping the whole thing is not
   * a choice about which bars matter. Both controls end up showing their state,
   * which is what `05` §6 is protecting — what it forbids is a ladder left on
   * with nothing on screen having asked.
   */
  it('opens with the whole item looping and the Ladder switched on', async () => {
    const { section } = await open(`#/score/${SONG_ID}?ladder=1`);
    // The fixture is two full bars, so the whole of it is bars 1–2.
    expect(section.dataset.loop).toBe('1-2');
    expect(section.dataset.ladder).toBe('on');
    // …and the sheet says so in the same words a finger on the toggle would
    // leave behind, because it is the same state.
    expect(document.querySelector('#score-ladder')?.textContent).toBe('On');
    expect(document.querySelector<HTMLElement>('#score-ladder-row')?.hidden).toBe(false);
    expect(document.querySelector('#score-loop')?.textContent).not.toBe('Off');
  });

  it('brings the mode that has a clock to move with it', async () => {
    updateSettings({ defaultModeWithInput: 'wait', defaultModeWithoutInput: 'wait' });
    const { section } = await open(`#/score/${SONG_ID}?ladder=1`);
    expect(section.dataset.mode).toBe('tempo');
    expect(section.dataset.ladder).toBe('on');
  });

  it('leaves both alone when the hash does not ask', async () => {
    const { section } = await open(`#/score/${SONG_ID}`);
    expect(section.dataset.loop).toBe('');
    expect(section.dataset.ladder).toBe('off');
    expect(document.querySelector<HTMLElement>('#score-ladder-row')?.hidden).toBe(true);
  });

  it('fails closed in a mode the hash asked for that has no tempo to move', async () => {
    // Not "turn it on and hope": a ladder the Ladder row is not showing is the
    // fault `05` §6 records. No loop either — a loop nobody asked for is the
    // same control acting unasked, one step earlier.
    const { section } = await open(`#/score/${SONG_ID}?mode=wait&ladder=1`);
    expect(section.dataset.mode).toBe('wait');
    expect(section.dataset.ladder).toBe('off');
    expect(section.dataset.loop).toBe('');
  });

  it('fails closed in a performance, which is one pass and never repeats', async () => {
    const { section } = await open(`#/score/${SONG_ID}?performance=1&ladder=1`);
    expect(section.dataset.ladder).toBe('off');
    expect(section.dataset.loop).toBe('');
  });

  it('fails closed when the whole item is not a range the piece can loop', async () => {
    // Wait by default, so "it left the screen alone" is distinguishable from
    // "the default happened to be the mode the ladder wanted".
    updateSettings({ defaultModeWithInput: 'wait', defaultModeWithoutInput: 'wait' });
    modelRef.current = UNLOOPABLE_MODEL;
    const { section } = await open(`#/score/${SONG_ID}?ladder=1`);
    expect(section.dataset.loop).toBe('');
    expect(section.dataset.ladder).toBe('off');
    // Not the mode either: a refusal must not leave the learner somewhere they
    // did not ask to be.
    expect(section.dataset.mode).toBe('wait');
  });

  it('goes off with the loop, like one set by hand', async () => {
    // `05` §6's rule is what keeps the two in sync and the route gets no
    // exception from it: clearing the loop must still switch the ladder off.
    const { section } = await open(`#/score/${SONG_ID}?ladder=1`);
    expect(section.dataset.ladder).toBe('on');
    click('score-loop');
    expect(section.dataset.loop).toBe('');
    expect(section.dataset.ladder).toBe('off');
    expect(document.querySelector('#score-ladder')?.textContent).toBe('Off');
  });

  it('is not carried by Blind, which rebuilds the screen from the hash', async () => {
    // Deliberately not in the ride-along set with the mode and the hand: those
    // are things the learner chose and Blind must not drop. This one arms a
    // control that acts by itself, and re-arming it on a tap of something else
    // is the shape `05` §6 forbids.
    const { router } = await open(`#/score/${SONG_ID}?ladder=1`);
    click('score-blind');
    expect(router.navigateScore).toHaveBeenCalledWith(SONG_ID, {
      blind: true,
      performance: false,
    });
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

/**
 * A rhythm run says what it is, on the screen, while it is running (T17-2,
 * Entry 38 FAULT 7).
 *
 * `rhythmOnly` is a remembered setting, and during a run the bar's mode
 * selector reads *Keep tempo* — which is exactly what the run is not. The
 * state was on the section element, in the `⋯` sheet and in the summary's
 * heading, and nowhere in front of the learner while the run was going. The
 * screen already had the shape for it: *Playing the left hand for you*, said
 * once at the start of a run, for the same class of reason.
 */
describe('a rhythm run says so while it is running', () => {
  afterEach(() => {
    updateSettings({ rhythmOnly: DEFAULT_SETTINGS.rhythmOnly });
  });

  it('says it once, at the start of the run, not only in the sheet', async () => {
    updateSettings({ rhythmOnly: true });
    const { section } = await open(`#/score/${SONG_ID}?mode=tempo`);
    expect(section.dataset.rhythm).toBe('true');
    // Nothing yet: it is a line about the run, and no run has started.
    expect(document.querySelector('#score-status')?.textContent).toBe('');
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).toContain('Rhythm only');
  });

  it('and says nothing in a mode that has no rhythm run in it', async () => {
    // Wait has no timetable, so `rhythmRunFor` refuses it and the run is an
    // ordinary one — a line saying otherwise would be false.
    updateSettings({ rhythmOnly: true });
    const { section } = await open(`#/score/${SONG_ID}?mode=wait`);
    expect(section.dataset.rhythm).toBe('false');
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).not.toContain('Rhythm only');
  });

  it('and nothing at all when the setting is off', async () => {
    const { section } = await open(`#/score/${SONG_ID}?mode=tempo`);
    expect(section.dataset.rhythm).toBe('false');
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).not.toContain('Rhythm only');
  });

  it('says it once, not at every restart the ladder makes', async () => {
    updateSettings({ rhythmOnly: true });
    await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).toContain('Rhythm only');
    // Something else writes the line, the way the ladder's own verdict does…
    const status = document.querySelector('#score-status');
    if (status) status.textContent = 'Clean — up to 70 %';
    click('score-play');
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).toBe('Clean — up to 70 %');
  });

  it('and is worth saying again once the row itself has been touched', async () => {
    // Once per visit is right for a run restarting under the ladder and wrong
    // for a learner who has just changed what the next run judges.
    updateSettings({ rhythmOnly: true });
    const { section } = await open(`#/score/${SONG_ID}?mode=tempo`);
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).toContain('Rhythm only');
    click('score-rhythm');
    expect(section.dataset.rhythm).toBe('false');
    click('score-rhythm');
    expect(section.dataset.rhythm).toBe('true');
    const status = document.querySelector('#score-status');
    if (status) status.textContent = 'Clean — up to 70 %';
    click('score-play');
    expect(document.querySelector('#score-status')?.textContent).toContain('Rhythm only');
  });
});

/**
 * `?from=<rung>` — Back returns to the rung that opened this (T17-2, FAULT 9).
 *
 * `leaveScore()` had two answers, the tour and `route.tab`, so a learner who
 * pressed *Play it as a duet* on `2.1` — or tapped one of the rung's own song
 * rows — came out of the run on **Plan**, at whatever stage it happened to be
 * scrolled to, rather than on the page holding the rung's other options, its
 * lesson and its *Know it* buttons.
 *
 * All three exits, for the reason the tour has all three: a way back that
 * works from the header and not from the summary is one the learner loses by
 * finishing a run.
 */
describe('a rung in the hash', () => {
  const RUNG = '2.1';

  it('Back returns to the rung that opened it, not to the tab', async () => {
    const { router } = await open(`#/score/${SONG_ID}?from=${RUNG}`);
    click('score-back');
    expect(router.navigateLesson).toHaveBeenCalledWith(RUNG);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('so does the copy of Back the phone shows sideways', async () => {
    const { router } = await open(`#/score/${SONG_ID}?from=${RUNG}`);
    click('score-back-side');
    expect(router.navigateLesson).toHaveBeenCalledWith(RUNG);
  });

  it('and so does Done on the summary sheet at the end of a run', async () => {
    const { router } = await open(`#/score/${SONG_ID}?from=${RUNG}`);
    expect(onFinishedRef.current).not.toBeNull();
    onFinishedRef.current?.(emptyScore(), false);
    click('summary-done');
    expect(router.navigateLesson).toHaveBeenCalledWith(RUNG);
  });

  it('a track rung is a lesson id too, and is carried', async () => {
    // `classical.3` and `blues.7` start with a letter; the first version of
    // the lesson-id pattern required a leading digit and silently made 61 of
    // the 92 lesson pages unreachable by URL (`router.ts`).
    const { router } = await open(`#/score/${SONG_ID}?from=blues.7`);
    click('score-back');
    expect(router.navigateLesson).toHaveBeenCalledWith('blues.7');
  });

  it('the tour wins when both are in the hash', async () => {
    // The learner is inside a walkthrough with a next step in it; the rung is
    // still there when the walkthrough ends. Dropping somebody out of a tour
    // is the fault `?tour=` was added to fix.
    const { router } = await open(`#/score/${SONG_ID}?tour=${TOUR_ID}&from=${RUNG}`);
    click('score-back');
    expect(router.navigateDrill).toHaveBeenCalledWith(TOUR_ID);
    expect(router.navigateLesson).not.toHaveBeenCalled();
  });

  it('does not strand the learner on a from that is not a lesson id', async () => {
    const { router } = await open(`#/score/${SONG_ID}?from=../../etc/passwd`);
    click('score-back');
    expect(router.navigate).toHaveBeenCalledWith('plan');
    expect(router.navigateLesson).not.toHaveBeenCalled();
  });

  it('rides on into the chord chart, whose Back had the same fault', async () => {
    // The ⋯ sheet's *Open the chart* is the other door into `04` §3b, and
    // the chart's own Back is now `?from=` as well — so a chart opened from a
    // run that was opened from a rung comes back to that rung rather than to
    // the Library. The row is hidden unless the piece carries chord symbols
    // and this fixture does not, so the handler is called directly: what is
    // being tested is what the button *does*, and `chartDoor.test.ts` and
    // `doors.spec.ts` are what test whether it is drawn.
    const { router } = await open(`#/score/${SONG_ID}?from=${RUNG}`);
    click('score-chart');
    expect(router.navigateChart).toHaveBeenCalledWith(SONG_ID, { from: RUNG });
  });

  it('and opens the chart bare where no rung opened the run', async () => {
    const { router } = await open(`#/score/${SONG_ID}`);
    click('score-chart');
    expect(router.navigateChart).toHaveBeenCalledWith(SONG_ID);
  });

  it('rides along with Blind, which rebuilds the screen from the hash', async () => {
    // The same reason the hand rides: a control that has nothing to do with
    // where you came from must not change where Back goes.
    const { router } = await open(`#/score/${SONG_ID}?mode=wait&from=${RUNG}`);
    click('score-blind');
    expect(router.navigateScore).toHaveBeenCalledWith(SONG_ID, {
      mode: 'wait',
      from: RUNG,
      blind: true,
      performance: false,
    });
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

/**
 * Entry 29 found this in passing and left it: `ScoreScreen` sets Tempo for a
 * sight-read with the comment quoting `05` §8, and the line that reads the
 * learner's default mode runs *after* it and overwrites it. `defaultModeWithInput`
 * ships as `'wait'`, so Today's daily sight-read opened in Wait mode — which
 * `05` §8 calls decoding rather than reading — for anyone who had never touched
 * the setting.
 */
describe('a sight-read opens in the mode docs/05 §8 says', () => {
  beforeEach(() => {
    findItemSpy.mockResolvedValue(sightReadItem());
  });

  it('opens in Tempo for a learner who has not changed the setting', async () => {
    expect(DEFAULT_SETTINGS.defaultModeWithInput).toBe('wait');
    const { section } = await open(`#/score/${SIGHT_READ_ID}`);
    expect(section.dataset.mode).toBe('tempo');
    expect(document.querySelector<HTMLSelectElement>('#score-mode')?.value).toBe('tempo');
  });

  it('opens in Tempo even where the learner has chosen Wait as their default', async () => {
    updateSettings({ defaultModeWithInput: 'wait', defaultModeWithoutInput: 'wait' });
    const { section } = await open(`#/score/${SIGHT_READ_ID}`);
    expect(section.dataset.mode).toBe('tempo');
  });

  it('still lets an explicit ?mode= win, the way the tour needs it to', async () => {
    const { section } = await open(`#/score/${SIGHT_READ_ID}?mode=wait`);
    expect(section.dataset.mode).toBe('wait');
  });

  it('leaves an ordinary piece on the default the learner chose', async () => {
    findItemSpy.mockResolvedValue(songItem());
    updateSettings({ defaultModeWithInput: 'wait', defaultModeWithoutInput: 'wait' });
    const { section } = await open(`#/score/${SONG_ID}`);
    expect(section.dataset.mode).toBe('wait');
  });
});
