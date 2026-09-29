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


// PROBE (U96, not a test of the change; moved to docs/prompts/runs/U96/ after its run): what the sheet and
// the record get for a set nobody answered.
const statLine = (): string => [...document.querySelectorAll('#drill-stats [data-stat]')].map((d) => `${(d as HTMLElement).dataset.stat ?? ''}=${d.textContent ?? ''}`).join('|');
const keptOf = (): string => {
  const kept = recordRunSpy.mock.calls[0]?.[0] ?? {};
  return JSON.stringify({ accuracy: kept.accuracy, wrongNotes: kept.wrongNotes, missed: kept.missed, passed: kept.passed });
};
describe('probe: an unanswered set, on the sheet and in the record', () => {
  it('Count this set after End drill with no answer', async () => {
    await mount(flashItem());
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    console.log('PROBE end-then-count record', keptOf());
  });
  it('Skip on every card: the set runs out and records itself', async () => {
    const section = await mount(flashItem());
    for (let i = 0; i < 200 && section.dataset.drill !== 'finished'; i += 1) {
      document.querySelector<HTMLButtonElement>('#drill-skip')?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    console.log('PROBE skip-all sheet', document.querySelector('#drill-outcome')?.textContent, '|', statLine());
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    console.log('PROBE skip-all record', keptOf());
  });
  it('dynamics: Next on both halves with nothing played', async () => {
    const section = await mount(dynamicsItem());
    for (let i = 0; i < 10 && section.dataset.drill !== 'finished'; i += 1) {
      document.querySelector<HTMLButtonElement>('#drill-next')?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    console.log('PROBE dynamics-next-next sheet', section.dataset.drill, document.querySelector('#drill-outcome')?.textContent, '|', document.querySelector('#drill-outcome-note')?.textContent, '|', statLine());
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    console.log('PROBE dynamics-next-next record', keptOf());
  });
});
