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
 *
 * The real screen over a real session record (`fake-indexeddb`) and a recording router. **Nothing here is
 * heard**: the answers are screen-key events, and every assertion is about what the sheet says.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('a drill set ended before any answer', () => {
  it('is headed Not measured with the reason, prints no Accuracy and no verdict, and keeps Answered 0 of N', async () => {
    const section = await mount(flashItem());
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    expect(section.dataset.drill).toBe('finished');

    // Soft, so a red shows every claim the sheet makes at once.
    expect.soft(heading(), 'a verdict over a set nobody answered').toBe(SUMMARY_TEXT.notMeasuredHeading);
    expect.soft(document.querySelector('#drill-outcome-note'), 'the reason under the heading').not.toBeNull();
    expect.soft(document.querySelector('#drill-outcome-note')?.textContent, 'the reason, in the learner’s words').toBe(SUMMARY_TEXT.notAnswered);
    expect.soft(document.querySelector('[data-stat="accuracy"]')?.textContent, 'an accuracy nobody measured').toBeUndefined();
    expect.soft(document.querySelector('[data-stat="answered"]')?.textContent).toMatch(/^0 of \d+$/);
    const said = sheet().textContent ?? '';
    expect.soft(said).not.toContain('Not passed');
    expect.soft(said).not.toContain('keep going');
    expect.soft(said).not.toContain('Accuracy');
  });

  it('in a session: the same sheet, and the transition under it unchanged — Start the one filled box', async () => {
    await sessionWith(FLASH_ID);
    await mount(flashItem(), 'u96first01');
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>('#session-next')?.hidden).toBe(false));
    expect.soft(heading()).toBe(SUMMARY_TEXT.notMeasuredHeading);
    expect.soft(document.querySelector('[data-stat="accuracy"]')?.textContent, 'an accuracy nobody measured').toBeUndefined();
    expect.soft(document.querySelector('#session-next')?.textContent).toContain('Next: Hot Cross Buns, 7 min — More music from this lesson');
    expect.soft(filled()).toEqual(['session-start-next']);
    expect.soft(document.querySelector<HTMLElement>('#drill-done')?.hidden).toBe(true);
  });
});

describe('a kind’s own numbers, on a set ended before any answer', () => {
  // Every one of them is taken over the answers, so with none they are a mean or a ratio of nothing: the
  // dynamics sheet printed *Loud against soft 0* and the chain line *Longest chain: 0 notes* under a heading
  // that now says nothing was measured. *Answered 0 of N* is the one line, because it is true.
  const stats = (): string[] => [...document.querySelectorAll<HTMLElement>('#drill-stats [data-stat]')].map((one) => one.dataset.stat ?? '');

  it('dynamics: Not measured, and no ratio or velocity of notes nobody played', async () => {
    const section = await mount(dynamicsItem());
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(heading()).toBe(SUMMARY_TEXT.notMeasuredHeading);
    expect.soft(stats(), 'numbers for a set nobody answered').toEqual(['answered']);
  });

  it('Simon: Not measured, and no chain line', async () => {
    const section = await mount(simonItem());
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(heading()).toBe(SUMMARY_TEXT.notMeasuredHeading);
    expect.soft(document.querySelector('#drill-chain')?.textContent, 'a chain nobody played').toBeUndefined();
    expect.soft(stats(), 'numbers for a set nobody answered').toEqual(['answered']);
  });
});

describe('a drill set with one answer', () => {
  it('is judged as before: a verdict, and an Accuracy line', async () => {
    const section = await mount(flashItem());
    answerOne(section);
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    expect(section.dataset.drill).toBe('finished');
    expect(['Passed', 'Not passed yet']).toContain(heading());
    expect(document.querySelector('[data-stat="accuracy"]')?.textContent).toMatch(/^\d+%$/);
    expect(document.querySelector('[data-stat="answered"]')?.textContent).toMatch(/^[01] of \d+$/);
    expect(document.querySelector('#drill-outcome-note'), 'a reason for a set that was measured').toBeNull();
  });
});

describe('the placement test’s end sheet', () => {
  it('in a session: the transition’s Start is the one filled box, and Start here is outlined', async () => {
    await sessionWith(PLACEMENT_ID);
    await mount(placementItem(), 'u96first01');
    document.querySelector<HTMLButtonElement>('#drill-placement-fail')?.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>('#session-next')?.hidden).toBe(false));
    await vi.waitFor(() => expect(document.querySelector('#session-start-next')).not.toBeNull());
    expect.soft(filled(), 'two filled boxes on one sheet').toEqual(['session-start-next']);
    const startHere = document.querySelector<HTMLElement>('#drill-placement-start');
    expect(startHere, 'the only thing that records the test’s answer').not.toBeNull();
    expect.soft(startHere?.hidden).toBe(false);
    expect.soft(startHere?.classList.contains('button--secondary'), 'Start here outlined').toBe(true);
  });

  it('outside a session: Start here stays the one filled box', async () => {
    await mount(placementItem());
    document.querySelector<HTMLButtonElement>('#drill-placement-fail')?.click();
    await vi.waitFor(() => expect(document.querySelector('#drill-placement-start')).not.toBeNull());
    // The same turns the session's completion takes, so a late change would have happened by now.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.querySelector('#session-next')).toBeNull();
    expect(filled()).toEqual(['drill-placement-start']);
  });
});
