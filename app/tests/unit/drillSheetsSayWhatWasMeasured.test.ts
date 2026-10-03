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

  // U96a: rhythm prints no *Answered* row at all (its count is taps, not cards), so a rhythm set nobody tapped
  // is the heading and the reason, with no number.
  it('rhythm: Not measured, the reason, and no number at all', async () => {
    const section = await mount(rhythmItem());
    end();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(heading()).toBe(SUMMARY_TEXT.notMeasuredHeading);
    expect.soft(document.querySelector('#drill-outcome-note')?.textContent).toBe(SUMMARY_TEXT.notAnswered);
    expect.soft(stats(), 'a count of taps under Answered').toEqual([]);
    expect.soft(sheet().textContent ?? '').not.toContain('Answered');
  });
});

describe('a drill set with one answer', () => {
  it('is judged as before: a verdict, and an Accuracy line', async () => {
    const section = await mount(flashItem());
    const n = setSize();
    answerOne(section);
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    expect(section.dataset.drill).toBe('finished');
    expect(['Passed', 'Not passed yet']).toContain(heading());
    expect(document.querySelector('[data-stat="accuracy"]')?.textContent).toMatch(/^\d+%$/);
    // Was `/^[01] of \d+$/`, which let the row print the right answers (U96a): one card was answered.
    expect(document.querySelector('[data-stat="answered"]')?.textContent).toBe(`1 of ${String(n)}`);
    expect(document.querySelector('#drill-outcome-note'), 'a reason for a set that was measured').toBeNull();
  });
});

describe('Answered counts the cards answered; Accuracy says how many were right (U96a)', () => {
  // The reviewer's three adversaries (`responses/c48857ca.md` :33–36). The second, nothing answered, is
  // U96's first case above, kept as it is: *Answered 0 of N* and no *Accuracy*.

  it('four answered, three right: Answered 4 of N, Accuracy 75%, and the record says four', async () => {
    const section = await mount(flashItem());
    const n = setSize();
    expect(n, 'a set long enough to answer four and stop').toBeGreaterThan(4);
    for (let card = 0; card < 3; card += 1) {
      answer(section, true);
      await nextCard(section);
    }
    answer(section, false);
    end();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(stat('answered'), 'the right answers printed under Answered').toBe(`4 of ${String(n)}`);
    expect.soft(stat('accuracy'), 'how many were right').toBe('75%');
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    const record = lastRecord();
    // The record's answered is `total − missed` (`keep`), unchanged by U96a.
    expect.soft(record.missed, 'the record’s cards not answered').toBe(n - 4);
    expect.soft(record.wrongNotes).toBe(1);
    expect.soft(record.accuracy).toBe(0.75);
  });

  it('a skipped card is answered, wrong, as the drill counts it: Answered 3 of N, and the record agrees', async () => {
    const section = await mount(flashItem());
    const n = setSize();
    skip();
    answer(section, true);
    await nextCard(section);
    answer(section, false);
    end();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(stat('answered'), 'a skip is an answer the drill marks wrong (`PromptDrill.next`)').toBe(`3 of ${String(n)}`);
    expect.soft(stat('accuracy')).toBe('33%');
    document.querySelector<HTMLButtonElement>('#drill-keep')?.click();
    const record = lastRecord();
    expect.soft(record.missed, 'the record counts the skip as answered').toBe(n - 3);
    expect.soft(record.wrongNotes, 'the skip and the miss').toBe(2);
  });

  it('every card skipped: the set runs out and records itself — Answered N of N, Accuracy 0%, Not passed yet', async () => {
    const section = await mount(flashItem());
    const n = setSize();
    for (let card = 0; card < n; card += 1) skip();
    expect(section.dataset.drill).toBe('finished');
    // U96's reading, approved: skips are judged wrong, not unanswered.
    expect.soft(heading(), 'skips are wrong answers, not no answers').toBe('Not passed yet');
    expect.soft(stat('answered'), 'every card closed as an answer').toBe(`${String(n)} of ${String(n)}`);
    expect.soft(stat('accuracy')).toBe('0%');
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    const record = lastRecord();
    expect.soft(record.missed).toBe(0);
    expect.soft(record.wrongNotes).toBe(n);
  });

  it('Simon counts its cards the same way: a skipped first card is Answered 1 of N, and the record agrees', async () => {
    // `SimonDrill.next` pushes a skipped card as a wrong answer that breaks the chain, and its `answered` is
    // bounded by the card budget, `total` (`simon.ts`, the cap in `next`), so the row is a count of cards.
    const section = await mount(simonItem());
    const n = setSize();
    skip();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(stat('answered'), 'the chain printed under Answered').toBe(`1 of ${String(n)}`);
    expect.soft(document.querySelector<HTMLElement>('#drill-chain')?.dataset.chain).toBe('0');
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    const record = lastRecord();
    expect.soft(record.missed).toBe(n - 1);
    expect.soft(record.wrongNotes).toBe(1);
  });

  it('Simon: one chain right and the next card skipped is Answered 2 of N, with the chain line saying one', async () => {
    const section = await mount(simonItem());
    const n = setSize();
    // The chain plays first; a key before the turn is playing along, not answering (T23).
    await vi.waitFor(() => expect(document.querySelector('#drill-status')?.textContent).toContain('Your turn'), { timeout: 5000 });
    answer(section, true);
    await nextCard(section);
    skip();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(stat('answered')).toBe(`2 of ${String(n)}`);
    expect.soft(document.querySelector<HTMLElement>('#drill-chain')?.dataset.chain, 'the chain is the chain line’s').toBe('1');
  });

  it('rhythm: no Answered row on a set that was tapped — its count is taps, not cards — and its own rows stay', async () => {
    const section = await mount(rhythmItem());
    const onsets = setSize();
    // No audio here, so the count-in is silent and the first tap starts the pattern (T8); a turn for the audio
    // to fail first. Two more taps than the pattern has onsets: however they land, `answered` (hits plus extra
    // taps) passes the onsets. Taps the drill refused would leave the set unanswered, and the heading below
    // would say so.
    await new Promise((resolve) => setTimeout(resolve, 50));
    for (let tap = 0; tap < onsets + 2; tap += 1) {
      screenKeyboardSource.noteOn(60, 90);
      screenKeyboardSource.noteOff(60);
    }
    end();
    expect(section.dataset.drill).toBe('finished');
    expect.soft(['Passed', 'Not passed yet'], 'a tapped set is judged').toContain(heading());
    expect.soft(stat('answered'), 'taps printed as a count of the set').toBeUndefined();
    expect.soft(sheet().textContent ?? '').not.toContain('Answered');
    expect.soft(stat('accuracy'), 'the onsets hit, over the pattern').toMatch(/^\d+%$/);
    expect.soft(Number(stat('taps-too-many')), 'the extra taps, on a row of their own').toBeGreaterThanOrEqual(2);
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
