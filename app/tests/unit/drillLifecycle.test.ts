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
 * Driven through the real screen with a faked clock and a forged
 * `document.visibilityState`, the way `sessionClock.test.ts` forges it.
 * **Nothing here is heard**: the piano is a spy, so what is asserted is when a
 * note was asked for, never what it sounded like.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const { findItemSpy, recordRunSpy, piano } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  recordRunSpy: vi.fn((_record: Record<string, unknown>): Promise<void> => Promise.resolve()),
  piano: {
    playChord: vi.fn((_midi: readonly number[], _durationSec?: number) => undefined),
    start: vi.fn((_note: unknown) => () => undefined),
    stop: vi.fn(),
  },
}));

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
  return { ...original, getPiano: () => Promise.resolve(piano) };
});

const { DrillScreen } = await import('../../src/ui/screens/DrillScreen');
const { screenKeyboardSource } = await import('../../src/app/services');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const { ChordDictationDrill } = await import('../../src/engine/drills/harmony');

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

beforeEach(() => {
  localStorage.clear();
  findItemSpy.mockReset();
  recordRunSpy.mockReset();
  recordRunSpy.mockResolvedValue(undefined);
  piano.playChord.mockClear();
  piano.start.mockClear();
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
