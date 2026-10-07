// @vitest-environment jsdom
/**
 * An unanswered drill set is not measured on the record either (U102; the review of U96,
 * `responses/c48857ca.md`: *record truth must follow*; the compatibility order, `responses/questions-bbd7f99a.md`
 * and `responses/questions-ecccffb7.md`).
 *
 * - **The record.** A set of a kind that judges, with nothing answered, was stored with the accuracy the model
 *   carries for "no answers", a 0 (`keep`: `accuracy: judged ? result.accuracy : …`), so Progress printed *0%*
 *   for a set whose sheet said *Not measured*. It is stored as `accuracy: 'not measured'` beside `answered: 0`,
 *   `wrongNotes` 0 and `missed` the set's unanswered count. One answer or more is measured as before, and a set
 *   of skips is answered, wrong (U96's approved reading).
 * - **Rhythm's misses** (U104's item at the same write, the reviewer's guard: extra taps must not erase missed
 *   onsets). A rhythm model's `answered` is the onsets hit plus every extra tap, so `total − answered` stored
 *   *missed 0* for a pattern with onsets never hit. A rhythm row's `missed` is the onsets not hit.
 * - **One stored reading** (`data/accuracyReading.ts`): *measured*, *nothing answered* or *not judged*, for a
 *   stored row or a run about to be stored. A row's own `answered` decides it; an older row without the field
 *   is read by the reviewer's order — only note-flash has a proven invariant (Entry 162 carries the proof), and
 *   every other kind's old 0 % stays as it was, legacy ambiguity, never reinterpreted.
 * - **Its readers** here: the rung state and the coaching history. Progress's line is read off the real screen
 *   in `progressHistoryLines.test.ts`.
 *
 * The real screen over a real session record (`fake-indexeddb`) and a recording writer, as U96's harness
 * (`drillSheetsSayWhatWasMeasured.test.ts`, copied, not edited). **Nothing here is heard**: the answers are
 * screen-key events, and every assertion is about what the record, the reading or a reader says.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import type { DrillResult } from '../../src/engine/drills/types';
import type { Vocabulary } from '../../src/evidence/vocabulary';
import type { Router } from '../../src/router';
import { accuracyReading } from '../../src/data/accuracyReading';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const NOT_MEASURED = 'not measured';
const FLASH_ID = 'drill.reading.note-flash-treble-c4-g4';

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

/** Loud and soft: two halves, each closed by *Next* whether or not anything was played. */
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

/** A kind whose `answered` counts taps, not onsets (`RhythmDrill`: the onsets hit and every extra tap). */
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

const { findItemSpy, recordRunSpy, sessionsForItemSpy, coachSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  recordRunSpy: vi.fn((_record: Record<string, unknown>): Promise<void> => Promise.resolve()),
  sessionsForItemSpy: vi.fn((_itemId: string, _limit?: number): Promise<SessionRow[]> => Promise.resolve([])),
  coachSpy: vi.fn((..._args: unknown[]): unknown => null),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: vi.fn(() => Promise.reject(new Error('no curriculum here'))),
  };
});

// The store's own day key and session plumbing are real; the run writer and the item's history are answered
// here, so a case can hand the coaching rule the history it needs.
vi.mock('../../src/data/progressStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/progressStore')>();
  return {
    ...original,
    recordRun: recordRunSpy,
    sessionsForItem: sessionsForItemSpy,
    getProgress: vi.fn(() => Promise.resolve({ bestAccuracy: 0 })),
  };
});

// The coaching rule itself runs; the spy only keeps what the screen handed it.
vi.mock('../../src/engine/drills/coaching', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/engine/drills/coaching')>();
  coachSpy.mockImplementation(original.coach as (...args: unknown[]) => unknown);
  return { ...original, coach: coachSpy };
});

// No advice to fetch: `tipsFor` reads a markdown file over the network.
vi.mock('../../src/curriculum/tips', () => ({ tipsFor: () => Promise.resolve(null) }));

const { DrillScreen, drillOutcome, drillRecordCounts } = await import('../../src/ui/screens/DrillScreen');
const { screenKeyboardSource } = await import('../../src/app/services');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const { resetSessionRunForTest } = await import('../../src/data/sessionRun');
const { meetsStandard, rungState } = await import('../../src/evidence/rungState');

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

async function mount(item: CatalogItem): Promise<HTMLElement> {
  findItemSpy.mockResolvedValue(item);
  const section = DrillScreen(
    {
      navigate: vi.fn(),
      navigateScore: vi.fn(),
      navigateDrill: vi.fn(),
      navigateLesson: vi.fn(),
      route: { tab: 'plan' },
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

const stat = (name: string): string | undefined => document.querySelector(`[data-stat="${name}"]`)?.textContent ?? undefined;
const end = (): void => document.querySelector<HTMLButtonElement>('#drill-end')?.click();
const keep = (): void => document.querySelector<HTMLButtonElement>('#drill-keep')?.click();

/** The set's own size, off the running counter (`at of total · correct right`), never a constant. */
function setSize(): number {
  const text = document.querySelector('#drill-counter')?.textContent ?? '';
  const size = /\bof (\d+)/.exec(text)?.[1];
  if (size === undefined) throw new Error(`no set size on the counter: "${text}"`);
  return Number(size);
}

/** One answer on a one-note card, right or wrong (a key in no octave of `data-expects`), its mark checked. */
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

/** A drill result as a model hands it over; the parts a case does not name are an empty set's. */
function result(partial: Partial<DrillResult> & Pick<DrillResult, 'kind'>): DrillResult {
  return { total: 0, answered: 0, correct: 0, accuracy: 0, meanReactionMs: 0, answers: [], ...partial };
}

/** What the record would store for `set`: the screen's own mapping, over the verdict the screen reaches. */
function recordOf(set: DrillResult): Record<string, unknown> {
  return { ...drillRecordCounts(set, drillOutcome(set, 90)) };
}

let minute = 0;
/** A stored drill row; the parts a case does not name are a one-minute note-flash set judged by no rung. */
function drillRow(partial: Record<string, unknown>): SessionRow {
  minute += 1;
  return {
    itemId: FLASH_ID,
    mode: 'drill:note-flash',
    tempoPct: 100,
    tempoMeasured: false,
    accuracy: 0,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 10,
    durationMs: 60_000,
    at: `2026-09-29T10:${String(minute).padStart(2, '0')}:00.000Z`,
    ...partial,
  };
}

beforeEach(() => {
  localStorage.clear();
  useFakeIndexedDb();
  resetSessionRunForTest();
  findItemSpy.mockReset();
  recordRunSpy.mockClear();
  sessionsForItemSpy.mockClear();
  sessionsForItemSpy.mockResolvedValue([]);
  coachSpy.mockClear();
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('what the record stores for a set, from the model’s own counts (the mapping)', () => {
  it('(a) note flash, ten cards, none answered: not measured, answered 0, no wrong notes, ten missed', () => {
    const record = recordOf(result({ kind: 'note-flash', total: 10 }));
    expect.soft(record.accuracy, 'a share of nothing').toBe(NOT_MEASURED);
    expect.soft(record.answered).toBe(0);
    expect.soft(record.wrongNotes).toBe(0);
    expect.soft(record.missed).toBe(10);
  });

  it('(b) four answered, three right: measured as before, 75 %, one wrong, six missed — and answered 4', () => {
    const record = recordOf(result({ kind: 'note-flash', total: 10, answered: 4, correct: 3, accuracy: 0.75 }));
    // The guard: these three are what the committed writer stored.
    expect.soft(record.accuracy).toBe(0.75);
    expect.soft(record.wrongNotes).toBe(1);
    expect.soft(record.missed).toBe(6);
    // The new field.
    expect.soft(record.answered).toBe(4);
  });

  it('(c) ten cards skipped: answered, wrong — a measured 0 %, ten wrong, none missed (U96’s reading)', () => {
    const record = recordOf(result({ kind: 'note-flash', total: 10, answered: 10, correct: 0, accuracy: 0 }));
    expect.soft(record.accuracy, 'skips are wrong answers, not no answers').toBe(0);
    expect.soft(record.answered).toBe(10);
    expect.soft(record.wrongNotes).toBe(10);
    expect.soft(record.missed).toBe(0);
  });

  it('(d) rhythm, eight onsets, six hit, four extra taps: 75 %, four wrong — and the two onsets never hit are missed', () => {
    const record = recordOf(result({ kind: 'rhythm', total: 8, answered: 10, correct: 6, accuracy: 0.75, detail: { extraTaps: 4 } }));
    expect.soft(record.accuracy, 'the onsets hit, over the pattern').toBe(0.75);
    expect.soft(record.wrongNotes, 'the extra taps').toBe(4);
    expect.soft(record.missed, 'extra taps do not erase missed onsets').toBe(2);
    expect.soft(record.answered, 'the model’s count: hits and extra taps').toBe(10);
  });

  it('(e) rhythm, no tap: not measured, answered 0, every onset missed', () => {
    const record = recordOf(result({ kind: 'rhythm', total: 8, detail: { extraTaps: 0 } }));
    expect.soft(record.accuracy).toBe(NOT_MEASURED);
    expect.soft(record.answered).toBe(0);
    expect.soft(record.wrongNotes).toBe(0);
    expect.soft(record.missed).toBe(8);
  });

  it('(f) rhythm, three taps off the beat and no hit: an observed failure, 0 %, three wrong, all eight missed', () => {
    const record = recordOf(result({ kind: 'rhythm', total: 8, answered: 3, correct: 0, accuracy: 0, detail: { extraTaps: 3 } }));
    expect.soft(record.accuracy, 'the learner tapped: measured').toBe(0);
    expect.soft(record.answered).toBe(3);
    expect.soft(record.wrongNotes).toBe(3);
    expect.soft(record.missed).toBe(8);
  });

  it('(g) loud and soft with nothing played, and Simon with nothing answered: not measured', () => {
    const dynamics = recordOf(result({ kind: 'dynamics', total: 2 }));
    expect.soft(dynamics.accuracy).toBe(NOT_MEASURED);
    expect.soft(dynamics.answered).toBe(0);
    expect.soft(dynamics.missed).toBe(2);
    const simon = recordOf(result({ kind: 'simon', total: 8, detail: { longestChain: 0 } }));
    expect.soft(simon.accuracy).toBe(NOT_MEASURED);
    expect.soft(simon.answered).toBe(0);
    expect.soft(simon.missed).toBe(8);
  });

  it('(h) a backing track: not judged, as before — no answered count, and the notes played kept', () => {
    const record = recordOf(result({ kind: 'backing-track', answered: 12, detail: { notesPlayed: 12 } }));
    expect.soft(record.accuracy).toBe(NOT_MEASURED);
    expect.soft(record.wrongNotes).toBe(NOT_MEASURED);
    expect.soft(record.missed).toBe(NOT_MEASURED);
    expect.soft(record.notesHeard).toBe(12);
    expect.soft('answered' in record, 'a kind that judges nothing writes no answered count').toBe(false);
  });
});

describe('through the screen', () => {
  it('(i) End drill at once, then Count this set: accuracy not measured, answered 0, missed N', async () => {
    const section = await mount(flashItem());
    const n = setSize();
    end();
    expect(section.dataset.drill).toBe('finished');
    keep();
    const record = lastRecord();
    expect.soft(record.accuracy, 'a 0 % for a set nobody answered').toBe(NOT_MEASURED);
    expect.soft(record.answered).toBe(0);
    expect.soft(record.missed, 'every card of the set').toBe(n);
    expect.soft(record.wrongNotes).toBe(0);
    expect.soft(record.passed).toBe(false);
    expect.soft(record.masterEligible).toBe(false);
  });

  it('(j) loud and soft run out with nothing played records itself the same way', async () => {
    const section = await mount(dynamicsItem());
    for (let press = 0; press < 10 && section.dataset.drill !== 'finished'; press += 1) {
      document.querySelector<HTMLButtonElement>('#drill-next')?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(section.dataset.drill).toBe('finished');
    const n = Number(/^0 of (\d+)$/.exec(stat('answered') ?? '')?.[1]);
    expect(n, 'the sheet’s own count of the set').toBeGreaterThan(0);
    await vi.waitFor(() => expect(recordRunSpy).toHaveBeenCalledTimes(1));
    const record = lastRecord();
    expect.soft(record.accuracy).toBe(NOT_MEASURED);
    expect.soft(record.answered).toBe(0);
    expect.soft(record.missed).toBe(n);
    expect.soft(record.wrongNotes).toBe(0);
  });

  it('a four-answered set is measured as before, with answered 4 on the record', async () => {
    const section = await mount(flashItem());
    const n = setSize();
    for (let card = 0; card < 3; card += 1) {
      answer(section, true);
      await nextCard(section);
    }
    answer(section, false);
    end();
    keep();
    const record = lastRecord();
    expect.soft(record.accuracy).toBe(0.75);
    expect.soft(record.wrongNotes).toBe(1);
    expect.soft(record.missed).toBe(n - 4);
    expect.soft(record.answered).toBe(4);
  });

  it('rhythm with more taps than onsets: the onsets not hit are missed, the extra taps are the wrong notes', async () => {
    const section = await mount(rhythmItem());
    const onsets = setSize();
    // No audio here, so the count-in is silent and the first tap starts the pattern (T8); a turn for the audio
    // to fail first, as U96a's rhythm case waits. Every tap lands at one instant: the first sets the start on
    // the first onset, and the rest are nearer no other onset than its window, so they are extra taps.
    await new Promise((resolve) => setTimeout(resolve, 50));
    for (let tap = 0; tap < onsets + 2; tap += 1) {
      screenKeyboardSource.noteOn(60, 90);
      screenKeyboardSource.noteOff(60);
    }
    end();
    expect(section.dataset.drill).toBe('finished');
    keep();
    const record = lastRecord();
    expect(typeof record.accuracy, 'a tapped set is measured').toBe('number');
    // The accuracy is the onsets hit over the pattern, and the wrong notes the extra taps, before and after.
    const hit = Math.round((record.accuracy as number) * onsets);
    const extra = record.wrongNotes as number;
    // The premise of the adversary: at least as many taps taken as onsets, and some onset never hit.
    expect(hit + extra, 'taps the drill took').toBeGreaterThanOrEqual(onsets);
    expect(hit, 'an onset left unhit').toBeLessThan(onsets);
    expect.soft(record.missed, 'extra taps do not erase missed onsets').toBe(onsets - hit);
    expect.soft(record.answered, 'the model’s count: hits and extra taps').toBe(hit + extra);
  });
});

describe('the one stored reading (data/accuracyReading.ts)', () => {
  it('(k) a new row: its own answered count decides — 0 is not measured, 3 with accuracy 0 is a measured 0 %', () => {
    expect.soft(accuracyReading(drillRow({ accuracy: NOT_MEASURED, answered: 0 }))).toEqual({ kind: 'nothing answered' });
    expect.soft(accuracyReading(drillRow({ accuracy: 0, wrongNotes: 3, missed: 7, answered: 3 }))).toEqual({ kind: 'measured', accuracy: 0 });
    expect.soft(accuracyReading(drillRow({ accuracy: 0.75, wrongNotes: 1, missed: 6, answered: 4 }))).toEqual({ kind: 'measured', accuracy: 0.75 });
  });

  it('(k) a run about to be stored reads the same as the row it becomes', () => {
    const unanswered = { mode: 'drill:note-flash', ...recordOf(result({ kind: 'note-flash', total: 10 })) };
    expect.soft(accuracyReading(unanswered as unknown as SessionRow)).toEqual({ kind: 'nothing answered' });
    const tapped = { mode: 'drill:rhythm', ...recordOf(result({ kind: 'rhythm', total: 8, answered: 3, accuracy: 0 })) };
    expect.soft(accuracyReading(tapped as unknown as SessionRow)).toEqual({ kind: 'measured', accuracy: 0 });
  });

  it('(k) a legacy note-flash row with accuracy 0 and no wrong notes: not measured — the proven invariant', () => {
    // Proof-dependent (the reviewer, `responses/questions-ecccffb7.md`), and proved in Entry 162 at every
    // version that could have written such a row (`git log -S` bounds each step): every `drill:note-flash` row
    // came from the one drill writer (`mode: \`drill:${result.kind}\``, 5941b644, never another) through
    // `recordRun`, which stored accuracy, wrongNotes and missed as given at every version; that writer stored
    // `wrongNotes = max(0, answered − correct)` and `missed = max(0, total − answered)` at all 36 versions of
    // DrillScreen.ts; a note-flash result is only ever `noteFlashDrill`'s `PromptDrill`, whose three versions
    // give `accuracy = answered > 0 ? correct / answered : 0`, `correct ≤ answered` and at most one answer a
    // card. So accuracy 0 with an answer means correct 0 and wrongNotes = answered ≥ 1: wrongNotes 0 beside
    // accuracy 0 happens only with nothing answered, which is exactly `missed === total`.
    expect.soft(accuracyReading(drillRow({ accuracy: 0, wrongNotes: 0, missed: 10 }))).toEqual({ kind: 'nothing answered' });
  });

  it('(k) a legacy measured failure stays a measured 0 %', () => {
    expect.soft(accuracyReading(drillRow({ accuracy: 0, wrongNotes: 3, missed: 7 }))).toEqual({ kind: 'measured', accuracy: 0 });
  });

  it('(k) a legacy row of a kind with no proven invariant keeps its 0 % — the withdrawn two-field rule never fires', () => {
    for (const mode of ['drill:find-key', 'drill:chord', 'drill:rhythm', 'drill:dynamics', 'drill:simon', 'drill:pedal', 'drill:harmonic-dictation']) {
      expect.soft(accuracyReading(drillRow({ mode, accuracy: 0, wrongNotes: 0, missed: 8 })), mode).toEqual({ kind: 'measured', accuracy: 0 });
    }
  });

  it('(k) a backing track, a checklist, a placement and a walkthrough row: not judged', () => {
    const unmeasured = { accuracy: NOT_MEASURED, wrongNotes: NOT_MEASURED };
    expect.soft(accuracyReading(drillRow({ mode: 'drill:backing-track', ...unmeasured, missed: NOT_MEASURED, notesHeard: 4 }))).toEqual({ kind: 'not judged' });
    // As T41 left a kept jam: the model's constant 0 (`BackingTrackDrill.result`, every version), never a measurement.
    expect.soft(accuracyReading(drillRow({ mode: 'drill:backing-track', accuracy: 0, wrongNotes: 4, missed: 0 }))).toEqual({ kind: 'not judged' });
    expect.soft(accuracyReading(drillRow({ mode: 'drill:checklist', ...unmeasured, missed: 1 }))).toEqual({ kind: 'not judged' });
    expect.soft(accuracyReading(drillRow({ mode: 'drill:placement', ...unmeasured, missed: 0 }))).toEqual({ kind: 'not judged' });
    expect.soft(accuracyReading(drillRow({ mode: 'drill:walkthrough', ...unmeasured, missed: 0 }))).toEqual({ kind: 'not judged' });
  });

  it('(k) a Score-screen run at accuracy 0 is measured: the tolerance is for drill rows only', () => {
    expect.soft(accuracyReading(drillRow({ itemId: 'song.folk.hot-cross-buns', mode: 'tempo', accuracy: 0, wrongNotes: 0, missed: 17 }))).toEqual({ kind: 'measured', accuracy: 0 });
    expect.soft(accuracyReading(drillRow({ itemId: 'song.folk.hot-cross-buns', mode: 'wait', accuracy: 0, wrongNotes: 0, missed: 17 }))).toEqual({ kind: 'measured', accuracy: 0 });
  });
});

describe('the readers', () => {
  const RUNG = 'u102.reading';
  const vocabulary = { skills: [], demands: [], conditions: [] } as unknown as Vocabulary;
  const today = new Date('2026-09-29T12:00:00.000Z');
  /** One rung whose one option is the note-flash drill, judged by `requirements`. */
  function curriculumWith(requirements: unknown[]): Curriculum {
    return {
      version: 1,
      tracks: [],
      stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: RUNG, title: 'Reading', track: 'core', lessons: [
        { id: RUNG, title: 'Reading', concepts: [], textFile: 'lessons/u102.md', exerciseOptions: [FLASH_ID], songOptions: [],
          mastery: { minAccuracy: 0.9, minTempoPct: 0 }, requirements },
      ] }] }],
    } as unknown as Curriculum;
  }
  const holds = (rows: SessionRow[], requirements: unknown[]): boolean | 'unjudged' | undefined =>
    rungState(rows, curriculumWith(requirements), vocabulary, today).byRung.get(RUNG)?.requirements[0]?.holds;
  const judged = { lessonId: RUNG };
  // The lowest bar a requirement can state: only "was anything measured?" is left for a row to fail on.
  const anyAccuracy = [{ kind: 'runs', from: 'exercises', count: 1, accuracy: 0 }];

  it('(m) the rung state: a set nobody answered, new or legacy, meets no standard — not even an accuracy of 0', () => {
    const fresh = drillRow({ ...judged, accuracy: NOT_MEASURED, answered: 0 });
    const legacy = drillRow({ ...judged, accuracy: 0, wrongNotes: 0, missed: 10 });
    const criteria = { passAccuracy: 0.9, passTempoPct: 0, masterAccuracy: 0.97, masterTempoPct: 100 };
    expect.soft(meetsStandard(fresh, criteria, 0), 'a new unanswered row').toBe(false);
    expect.soft(meetsStandard(legacy, criteria, 0), 'a legacy unanswered note-flash row').toBe(false);
    expect.soft(holds([fresh], anyAccuracy)).toBe(false);
    expect.soft(holds([legacy], anyAccuracy)).toBe(false);
  });

  it('(m) a measured 0 % — the learner answered, all wrong — still clears a bar of 0 (the tolerance does not widen)', () => {
    const answeredWrong = drillRow({ ...judged, accuracy: 0, wrongNotes: 3, missed: 7, answered: 3 });
    const legacyWrong = drillRow({ ...judged, accuracy: 0, wrongNotes: 3, missed: 7 });
    expect.soft(holds([answeredWrong], anyAccuracy)).toBe(true);
    expect.soft(holds([legacyWrong], anyAccuracy)).toBe(true);
  });

  it('(m) done stays unheld for an unanswered set: its missed is the set’s count, never 0', () => {
    const done = [{ kind: 'done', item: FLASH_ID }];
    expect.soft(holds([drillRow({ ...judged, accuracy: NOT_MEASURED, answered: 0, missed: 10 })], done)).toBe(false);
    expect.soft(holds([drillRow({ ...judged, accuracy: 0, wrongNotes: 0, missed: 10 })], done)).toBe(false);
  });

  it('(n) the coaching history: an unanswered row, new or legacy, is not in the plateau’s recent runs', async () => {
    const newUnanswered = drillRow({ accuracy: NOT_MEASURED, answered: 0 });
    const legacyUnanswered = drillRow({ accuracy: 0, wrongNotes: 0, missed: 10 });
    const legacyFailure = drillRow({ accuracy: 0, wrongNotes: 3, missed: 7 });
    const measured = drillRow({ accuracy: 0.75, wrongNotes: 1, missed: 6, answered: 4 });
    sessionsForItemSpy.mockResolvedValue([newUnanswered, legacyUnanswered, legacyFailure, measured]);
    const section = await mount(flashItem());
    for (let card = 0; card < 3; card += 1) {
      answer(section, true);
      await nextCard(section);
    }
    answer(section, false);
    end();
    await vi.waitFor(() => expect(coachSpy).toHaveBeenCalled());
    const recent = coachSpy.mock.calls.at(-1)?.[2];
    expect.soft(recent, 'only the runs that measured an accuracy').toEqual([
      { accuracy: 0, at: legacyFailure.at },
      { accuracy: 0.75, at: measured.at },
    ]);
  });
});
