// @vitest-environment jsdom
/**
 * The session's end sheets say only what was measured (U96; X1's follow-ups 2 and 4).
 *
 * - **No answer, no number.** A drill set ended before any card was answered was headed *Not passed yet*
 *   over *Accuracy 0%* and *Answered 0 of N*: a verdict and a share for a measurement nobody took, which the
 *   Score screen already refuses to print for a run it heard nothing of (T40). It is headed *Not measured*
 *   (T40's heading, reused), says why in the learner's words, and prints no *Accuracy*; *Answered 0 of N*
 *   stays, because it is true. A set with one answer is judged as before. In a session the transition under
 *   the numbers is unchanged.
 * - **One way forward.** In a session the placement test's end sheet drew two filled boxes, its own *Start
 *   here* and the transition's *Start* (`04` §0 R3: one per screen). With the transition drawn, *Start* is
 *   the one filled box and *Start here* is outlined, still there because it is the only thing that records
 *   the test's answer. Outside a session *Start here* stays filled.
 * - **Answered means answered** (U96a; the review of U96, `responses/c48857ca.md`). *Answered N of M* printed
 *   the right answers: four cards answered with three right read *Answered 3 of 10*. It now prints the drill's
 *   own count of the cards closed as answers, a skipped card among them where the drill counts a skip as a
 *   wrong answer, and how many were right stays in *Accuracy*. The record's answered is `total − missed`
 *   (`keep`), so the sheet and the record now say the same number. Rhythm prints no *Answered* row: its count
 *   is taps, the onsets hit and every extra tap, over the pattern's onsets, and two numbers that count
 *   different things are not a fraction. `N` is always read off the screen, never a constant.
 *
 * The real screen over a real session record (`fake-indexeddb`) and a recording router. **Nothing here is
 * heard**: the answers are screen-key events, and every assertion is about what the sheet says.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const FLASH_ID = 'drill.reading.note-flash-treble-c4-g4';
const PLACEMENT_ID = 'drill.placement.stage-0';
const NEXT_ID = 'song.folk.hot-cross-buns';

function flashItem(): CatalogItem {
  return {
    id: FLASH_ID,
    type: 'drill',
    title: 'Note flash — treble C4 to G4',
    level: 1.1,
    hands: 'right',
    tracks: ['core'],
    concepts: ['treble-clef', 'note-names'],
    drill: { kind: 'note-flash', params: { clef: 'treble', low: 'C4', high: 'G4' } },
  } as unknown as CatalogItem;
}

/** A kind whose own numbers are a ratio of what was played (`DynamicsDrill`). */
function dynamicsItem(): CatalogItem {
  return {
    id: 'drill.technique.dynamics-c',
    type: 'drill',
    title: 'Loud and soft',
    level: 2.1,
    hands: 'right',
    tracks: ['core'],
    concepts: ['dynamics'],
    drill: { kind: 'dynamics', params: {} },
  } as unknown as CatalogItem;
}

/** A kind scored on its chain, said in a line of its own (`chainLine`). */
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

/** A kind whose `answered` counts taps, not cards (`RhythmDrill`: the onsets hit and every extra tap). */
function rhythmItem(): CatalogItem {
  return {
    id: 'drill.rhythm.quarters-and-halves',
    type: 'drill',
    title: 'Tap the rhythm',
    level: 1.2,
    hands: 'right',
    tracks: ['core'],
    concepts: ['rhythm'],
    drill: { kind: 'rhythm', params: { values: ['quarter', 'half'], bars: 1, bpm: 80, timeSig: '4/4' } },
  } as unknown as CatalogItem;
}

function placementItem(): CatalogItem {
  return {
    id: PLACEMENT_ID,
    type: 'drill',
    title: 'Placement test',
    level: 0.4,
    hands: 'both',
    tracks: ['core'],
    concepts: ['placement'],
    drill: {
      kind: 'placement',
      params: {
        items: [
          { text: 'Name a note on the staff.', failUnit: '1.1' },
          { text: 'Clap a rhythm back.', failUnit: '1.2' },
        ],
        passUnit: '4.3',
      },
    },
  } as unknown as CatalogItem;
}

const { findItemSpy, recordRunSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  recordRunSpy: vi.fn((_record: Record<string, unknown>): Promise<void> => Promise.resolve()),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: vi.fn(() => Promise.reject(new Error('no curriculum here'))),
  };
});

// The store's own day key and session plumbing are real; only the run writer and the history reads are
// answered here, so a stored set completes its activity at once.
vi.mock('../../src/data/progressStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/progressStore')>();
  return {
    ...original,
    recordRun: recordRunSpy,
    sessionsForItem: vi.fn(() => Promise.resolve([])),
    getProgress: vi.fn(() => Promise.resolve({ bestAccuracy: 0 })),
  };
});

// No advice to fetch: `tipsFor` reads a markdown file over the network.
vi.mock('../../src/curriculum/tips', () => ({ tipsFor: () => Promise.resolve(null) }));

const { DrillScreen } = await import('../../src/ui/screens/DrillScreen');
const { screenKeyboardSource } = await import('../../src/app/services');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const { newRun, resetSessionRunForTest, startSessionRun } = await import('../../src/data/sessionRun');
const { dayKey } = await import('../../src/data/progressStore');
const { SUMMARY_TEXT } = await import('../../src/ui/help');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout here */
};
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

let mounted: HTMLElement | null = null;

/** A session whose first activity is `itemId` (token `u96first01`) and whose second is a piece. */
async function sessionWith(itemId: string): Promise<void> {
  await startSessionRun(
    newRun({
      day: dayKey(new Date()),
      sessionId: 'u96sess01',
      version: 'v',
      startedAt: new Date().toISOString(),
      activities: [
        { order: 0, token: 'u96first01', slot: { kind: 'new', itemId, title: 'The first one', minutes: 5 }, route: { target: 'drill', itemId }, reason: 'This lesson asks for it' },
        { order: 1, token: 'u96second02', slot: { kind: 'repertoire', itemId: NEXT_ID, title: 'Hot Cross Buns', minutes: 7 }, route: { target: 'score', itemId: NEXT_ID }, reason: 'More music from this lesson' },
      ],
      outside: [],
    }),
  );
}

async function mount(item: CatalogItem, session?: string): Promise<HTMLElement> {
  findItemSpy.mockResolvedValue(item);
  const section = DrillScreen(
    {
      navigate: vi.fn(),
      navigateScore: vi.fn(),
      navigateDrill: vi.fn(),
      navigateLesson: vi.fn(),
      route: { tab: 'plan', ...(session === undefined ? {} : { session }) },
    } as unknown as Router,
    item.id,
  );
  mounted = section;
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.drill).toBe('running');
  });
  return section;
}

const sheet = (): HTMLElement => document.querySelector<HTMLElement>('#drill-summary') as HTMLElement;
const heading = (): string => document.querySelector('#drill-outcome')?.textContent ?? '';
const filled = (): string[] => [...sheet().querySelectorAll<HTMLElement>('.button--primary')].filter((one) => !one.hidden && one.closest('[hidden]') === null).map((one) => one.id);

function answerOne(section: HTMLElement): void {
  const expected = (section.dataset.expects ?? '').split(',').filter(Boolean).map(Number);
  const midi = expected[0] ?? 60;
  screenKeyboardSource.noteOn(midi, 90);
  screenKeyboardSource.noteOff(midi);
}

const stat = (name: string): string | undefined => document.querySelector(`[data-stat="${name}"]`)?.textContent ?? undefined;
const end = (): void => document.querySelector<HTMLButtonElement>('#drill-end')?.click();
const skip = (): void => document.querySelector<HTMLButtonElement>('#drill-skip')?.click();

/** The set's own size, off the running counter (`at of total · correct right`), never a constant. */
function setSize(): number {
  const text = document.querySelector('#drill-counter')?.textContent ?? '';
  const size = /\bof (\d+)/.exec(text)?.[1];
  if (size === undefined) throw new Error(`no set size on the counter: "${text}"`);
  return Number(size);
}

/**
 * One answer on a one-note card, right or wrong (a key outside `data-expects`, in no octave of it), and the
 * card's own mark checked, so a count below is a count of answers the screen took.
 */
function answer(section: HTMLElement, right: boolean): void {
  const expected = (section.dataset.expects ?? '').split(',').filter(Boolean).map(Number);
  let midi = expected[0] ?? 60;
  if (!right) {
    midi = 61;
    while (expected.some((wanted) => (((wanted - midi) % 12) + 12) % 12 === 0)) midi += 1;
  }
  screenKeyboardSource.noteOn(midi, 90);
  screenKeyboardSource.noteOff(midi);
  expect(section.dataset.feedback, 'the card took the answer').toBe(right ? 'correct' : 'wrong');
}

/** A miss holds its card until a tap; a right answer moves on after a beat (`engine/drills/feedback.ts`). */
async function nextCard(section: HTMLElement): Promise<void> {
  if (section.dataset.paused) section.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await vi.waitFor(() => expect(section.dataset.feedback).toBe(''), { timeout: 3000 });
}

/** What `keep` handed the record writer, the last time it was called. */
function lastRecord(): Record<string, unknown> {
  const call = recordRunSpy.mock.calls.at(-1);
  if (call === undefined) throw new Error('nothing was recorded');
  return call[0];
}

beforeEach(() => {
  localStorage.clear();
  useFakeIndexedDb();
  resetSessionRunForTest();
  findItemSpy.mockReset();
  recordRunSpy.mockClear();
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
  clearFakeIndexedDb();
});


// ---------------------------------------------------------------------------------------------------------
// U96a's record probe (not for the commit). The harness above is `drillSheetsSayWhatWasMeasured.test.ts`'s,
// copied. Each case drives one adversary to a stored record and keeps what `keep` handed the record writer,
// with the duration (a clock reading) blanked, plus what the sheet printed. Run on the committed
// `DrillScreen.ts` and on the change; the two files are compared by `scripts-compare-probe.py`.
import { writeFileSync } from 'node:fs';

const kept: Record<string, { record: Record<string, unknown>; sheet: Record<string, string> }> = {};

function capture(label: string): void {
  const record = { ...lastRecord() };
  record.durationMs = '<clock>';
  const sheetStats: Record<string, string> = {};
  for (const row of document.querySelectorAll<HTMLElement>('#drill-stats [data-stat]')) {
    sheetStats[row.dataset.stat ?? ''] = row.textContent ?? '';
  }
  sheetStats.heading = heading();
  sheetStats.counterTotal = String(probeTotal);
  kept[label] = { record, sheet: sheetStats };
}

let probeTotal = 0;

afterAll(() => {
  writeFileSync(process.env.U96A_PROBE_OUT ?? 'u96a-probe.json', `${JSON.stringify(kept, null, 2)}\n`);
});

describe('U96a record probe', () => {
  it('1: four answered, three right, kept', async () => {
    const section = await mount(flashItem());
    probeTotal = setSize();
    for (let card = 0; card < 3; card += 1) {
      answer(section, true);
      await nextCard(section);
    }
    answer(section, false);
    end();
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    capture('1-four-answered-three-right');
  });

  it('2: nothing answered, kept', async () => {
    await mount(flashItem());
    probeTotal = setSize();
    end();
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    capture('2-nothing-answered');
  });

  it('3: one skipped, one right, one wrong, kept', async () => {
    const section = await mount(flashItem());
    probeTotal = setSize();
    skip();
    answer(section, true);
    await nextCard(section);
    answer(section, false);
    end();
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    capture('3-skip-right-wrong');
  });

  it('3b: every card skipped, ran out', async () => {
    const section = await mount(flashItem());
    probeTotal = setSize();
    for (let card = 0; card < probeTotal; card += 1) skip();
    expect(section.dataset.drill).toBe('finished');
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    capture('3b-every-card-skipped');
  });

  it('rhythm: tapped two more times than it has onsets, kept', async () => {
    await mount(rhythmItem());
    probeTotal = setSize();
    await new Promise((resolve) => setTimeout(resolve, 50));
    for (let tap = 0; tap < probeTotal + 2; tap += 1) {
      screenKeyboardSource.noteOn(60, 90);
      screenKeyboardSource.noteOff(60);
    }
    end();
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    capture('rhythm-tapped');
  });

  it('rhythm: not tapped, kept', async () => {
    await mount(rhythmItem());
    probeTotal = setSize();
    end();
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    capture('rhythm-not-tapped');
  });

  it('Simon: first card skipped, ran out', async () => {
    await mount(simonItem());
    probeTotal = setSize();
    skip();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    capture('simon-skipped');
  });

  it('Simon: one chain right, then skipped, ran out', async () => {
    const section = await mount(simonItem());
    probeTotal = setSize();
    await vi.waitFor(() => expect(document.querySelector('#drill-status')?.textContent).toContain('Your turn'), { timeout: 5000 });
    answer(section, true);
    await nextCard(section);
    skip();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    capture('simon-one-right-then-skipped');
  });
});
