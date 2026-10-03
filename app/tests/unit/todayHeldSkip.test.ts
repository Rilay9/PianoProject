// @vitest-environment jsdom
/**
 * Today's row for a piece the learner withdrew after *Start session* (G90a; the reviewer's required change on
 * G90, `docs/review/responses/1c75de8d.md`): the real Today screen over a real store (`fake-indexeddb`), the
 * session builder's card fixed as `todayHeldPiece.test.ts` fixes it.
 *
 * - **The reason, on the row.** The transition says why a piece was stepped past once; Today is the durable view
 *   of what happened, so the skipped row says it too, in the learner's own words: *Skipped — you paused it*,
 *   *Skipped — you put it away*. The row keeps the composition's words for every other skip.
 * - **Reload and readback.** The row is drawn from the stored record, not from the project as it stands: a piece
 *   the learner brought back afterwards is still the one they once withdrew, and the row says so.
 * - **Swap and pause, ordered by when each happened,** through Today's own swap sheet and the project store's own
 *   actions on the real clock: a pause or put-away from before the swap leaves the piece offered (the learner
 *   chose it knowing), one from after the swap steps past it at its turn. A row the learner taps is theirs and
 *   opens whatever the order was, and an activity underway is never interrupted.
 *
 * The sentences are written out here, not read from `SESSION_TEXT`: they are what the reviewer checks.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionSlot } from '../../src/curriculum/session';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

function lesson(id: string, exerciseOptions: string[], songOptions: string[]): Lesson {
  return { id, title: `Rung ${id}`, concepts: [], textFile: `lessons/${id}.md`, exerciseOptions, songOptions, mastery: { minAccuracy: 0.95, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] };
}

const CURRICULUM = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'u1', title: 'Unit', track: 'core', lessons: [lesson('1.2', ['drill.test.warm'], ['song.test.piece', 'song.test.other', 'song.test.fourth', 'song.test.third'])] }] }],
} as unknown as Curriculum;

const MEASURED = { measurement: { status: 'measured', definitions: 1, located: {}, bars: 4, steps: 16, notes: 16, established: [] }, demands: [] } as unknown as Partial<CatalogItem>;
function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: id.startsWith('song') ? 'song' : 'exercise', title: `Title of ${id}`, level: 1, hands: 'right', tracks: ['core'], concepts: [], tags: [], file: `scores/${id}.mxl`, ...MEASURED, ...over } as unknown as CatalogItem;
}

const WARM = item('drill.test.warm', { type: 'drill', file: undefined, drill: { kind: 'note-flash', params: {} } } as unknown as Partial<CatalogItem>);
const PIECE = item('song.test.piece');
const OTHER = item('song.test.other');
const FOURTH = item('song.test.fourth');
/** The lesson's song on no row: what the swap sheet offers in place of the new piece. */
const THIRD = item('song.test.third');
const ITEMS = [WARM, PIECE, OTHER, FOURTH, THIRD];

const { buildSpy } = vi.hoisted(() => ({ buildSpy: vi.fn() }));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve(ITEMS),
  findItem: (id: string) => Promise.resolve(ITEMS.find((one) => one.id === id)),
}));

vi.mock('../../src/curriculum/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/session')>();
  return { ...original, buildSession: buildSpy };
});

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
const { SESSION_TEMPLATES } = await import('../../src/curriculum/session');
const store = await import('../../src/data/sessionRun');
const { applyProjectAction, resetProjectsForTest } = await import('../../src/data/projectStore');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

const claim = (kind: string, demand?: string): SessionSlot['claim'] => ({ kind, ...(demand === undefined ? {} : { demand }) }) as unknown as SessionSlot['claim'];

/** The card: a warm-up drill, the review piece, the new piece, one more piece, the free prompt — each item slot with its claim. */
function card(slots?: SessionSlot[]): { template: (typeof SESSION_TEMPLATES)[number]; slots: SessionSlot[]; reached: string[] } {
  const made: SessionSlot[] = slots ?? [
    { kind: 'technique', minutes: 5, item: WARM, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', claim: claim('asked'), contact: 'none' },
    { kind: 'review', minutes: 5, item: PIECE, lessonId: '1.2', reason: 'Keeping this piece playable — last played on 1 Oct', claim: claim('piece-retention'), contact: 'met' },
    { kind: 'new', minutes: 7, item: OTHER, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', claim: claim('asked'), contact: 'none' },
    { kind: 'repertoire', minutes: 6, item: FOURTH, lessonId: '1.2', reason: 'More music from this lesson', claim: claim('rung'), contact: 'none' },
    { kind: 'free', minutes: 4, reason: 'Play anything you like — no scoring, no cursor' },
  ];
  return { template: SESSION_TEMPLATES[2] as (typeof SESSION_TEMPLATES)[number], slots: made, reached: ['1.2'] };
}

let navigateScore: ReturnType<typeof vi.fn>;
let navigateDrill: ReturnType<typeof vi.fn>;
let router: Router;

beforeEach(() => {
  useFakeIndexedDb();
  store.resetSessionRunForTest();
  resetProjectsForTest();
  buildSpy.mockReset();
  buildSpy.mockImplementation(() => card());
  navigateScore = vi.fn();
  navigateDrill = vi.fn();
  router = { route: { tab: 'today' }, navigate: vi.fn(), navigateScore, navigateDrill, navigatePdf: vi.fn(), navigateLesson: vi.fn() } as unknown as Router;
  updateSettings({ weekdaySessionMinutes: 60, weekendSessionMinutes: 60 });
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
  updateSettings({ weekdaySessionMinutes: DEFAULT_SETTINGS.weekdaySessionMinutes, weekendSessionMinutes: DEFAULT_SETTINGS.weekendSessionMinutes });
});

async function openToday(): Promise<HTMLElement> {
  const section = TodayScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#today-card [data-item]')).not.toBeNull());
  await vi.waitFor(() => expect(section.querySelector('#today-actions .button--primary')).not.toBeNull());
  return section;
}

async function stored(): Promise<import('../../src/data/sessionRun').SessionRun> {
  const read = await store.readSessionRun();
  if (read.kind !== 'run') throw new Error(`no run: ${read.kind}`);
  return read.run;
}

/** An event on the activity at `index`, as its screen reports it. */
async function on(index: number, event: import('../../src/data/sessionRun').RunEvent): Promise<void> {
  const run = await stored();
  const result = await store.applySessionEvent({ sessionId: run.sessionId, version: run.version, token: run.activities[index]?.token ?? '' }, event);
  if (!result.ok) throw new Error(`refused: ${result.why}`);
}

/** *Start session*, then the first `done` activities finished the way their screens report them. */
async function startedAndFinished(done: number): Promise<import('../../src/data/sessionRun').SessionRun> {
  const section = await openToday();
  section.querySelector<HTMLButtonElement>('#today-start')?.click();
  await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
  for (let index = 0; index < done; index += 1) await on(index, { kind: 'completed', outcome: 'unknown' });
  navigateDrill.mockClear();
  navigateScore.mockClear();
  return stored();
}

type Say = 'pause' | 'retire';
const SENTENCE: Record<Say, string> = { pause: 'Skipped — you paused it', retire: 'Skipped — you put it away' };
const KEPT: Record<Say, 'paused' | 'retired'> = { pause: 'paused', retire: 'retired' };
const SAYS: readonly Say[] = ['pause', 'retire'];

const sayOnSheet = async (itemId: string, last: Say): Promise<void> => {
  await applyProjectAction({ itemId, material: undefined }, 'learn');
  await applyProjectAction({ itemId, material: undefined }, last);
};

/** Real time passes between two things the learner does; the order under test is the order they did them in. */
const later = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

const rowOf = (section: HTMLElement, index: number): HTMLElement => section.querySelector<HTMLElement>(`#today-card [data-activity="${String(index)}"]`) as HTMLElement;
const sub = (section: HTMLElement, index: number): string | null => rowOf(section, index).querySelector('.list-row__sub')?.textContent ?? null;

/** The learner swaps the row's piece for the lesson's third song, through Today's swap sheet. */
async function swapForThird(section: HTMLElement, index: number): Promise<void> {
  section.querySelector<HTMLButtonElement>(`#today-card [data-activity="${String(index)}"] .list-row__actions button`)?.click();
  await vi.waitFor(() => expect(document.querySelector(`#today-swap [data-swap="${THIRD.id}"]`)).not.toBeNull());
  document.querySelector<HTMLElement>(`#today-swap [data-swap="${THIRD.id}"]`)?.click();
  await vi.waitFor(async () => expect((await stored()).activities[index]?.slot.itemId).toBe(THIRD.id));
}

describe('Today’s skipped row says why the piece was withdrawn', () => {
  for (const say of SAYS) {
    it(`${KEPT[say]}: the row reads “${SENTENCE[say]}” in place of the composition’s words, with its mark, and the record holds the kind`, async () => {
      await startedAndFinished(1);
      await sayOnSheet(PIECE.id, say);
      const section = await openToday();
      await vi.waitFor(() => expect(rowOf(section, 1).dataset.state).toBe('skipped'));
      expect(sub(section, 1)).toBe(SENTENCE[say]);
      expect(rowOf(section, 1).querySelector('.list-row__badges')?.textContent).toContain('skipped');
      expect(rowOf(section, 1).textContent).not.toContain('Keeping this piece playable');
      // The rows that were not withdrawn keep what they said.
      expect(sub(section, 2)).toBe('This lesson asks for it — not counted yet');
      const after = await stored();
      expect(after.activities[1]?.adaptations).toEqual([{ kind: 'withdrawn', held: KEPT[say], why: `Title of ${PIECE.id} is skipped — you ${say === 'pause' ? 'paused it' : 'put it away'}` }]);
    });
  }

  it('read back from the record, not from the project: brought back since, the row still says what the learner did, and Continue still skips it', async () => {
    await startedAndFinished(1);
    await sayOnSheet(PIECE.id, 'pause');
    const first = await openToday();
    await vi.waitFor(() => expect(rowOf(first, 1).dataset.state).toBe('skipped'));
    const written = await stored();
    await applyProjectAction({ itemId: PIECE.id, material: undefined }, 'bring-back');
    store.resetSessionRunForTest();
    const again = await openToday();
    expect(rowOf(again, 1).dataset.state).toBe('skipped');
    expect(sub(again, 1)).toBe('Skipped — you paused it');
    expect(await stored(), 'drawing Today again rewrote the record').toEqual(written);
    again.querySelector<HTMLButtonElement>('#today-continue')?.click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    expect(navigateScore.mock.calls[0]?.[0]).toBe(OTHER.id);
  });

  it('a skip for another reason keeps the composition’s words on its row: only a withdrawn piece says it was withdrawn', async () => {
    const demandStep = (): ReturnType<typeof card> =>
      card([
        { kind: 'technique', minutes: 5, item: WARM, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', claim: claim('ready', 'rhythm.eighths'), contact: 'none' },
        { kind: 'review', minutes: 5, item: PIECE, lessonId: '1.2', reason: 'The practice that follows', claim: claim('demand', 'rhythm.eighths'), contact: 'met' },
        { kind: 'new', minutes: 7, item: OTHER, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', claim: claim('asked'), contact: 'none' },
        { kind: 'free', minutes: 4, reason: 'Play anything you like — no scoring, no cursor' },
      ]);
    buildSpy.mockImplementation(demandStep);
    const section = await openToday();
    section.querySelector<HTMLButtonElement>('#today-start')?.click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
    await on(0, { kind: 'completed', outcome: 'passed-full' });
    const again = await openToday();
    await vi.waitFor(() => expect(rowOf(again, 1).dataset.state).toBe('skipped'));
    expect((await stored()).activities[1]?.adaptations.map((one) => one.kind)).toEqual(['skipped-redundant']);
    expect(sub(again, 1)).toBe('The practice that follows');
  });

  it('an activity underway is not taken from the learner: opened, then paused, its row is not skipped and keeps its words', async () => {
    await startedAndFinished(1);
    await on(1, { kind: 'opened' });
    await sayOnSheet(PIECE.id, 'pause');
    const section = await openToday();
    expect(rowOf(section, 1).dataset.state).toBe('active');
    expect(sub(section, 1)).toBe('Keeping this piece playable — last played on 1 Oct');
    expect((await stored()).activities[1]?.adaptations).toEqual([]);
  });
});

describe('a swap and a pause or put-away, ordered by when each happened, through Today', () => {
  for (const say of SAYS) {
    it(`swapped in, then ${KEPT[say]}: the later word steps past it at its turn, said on its row, and Continue opens the one after`, async () => {
      await startedAndFinished(2);
      const section = await openToday();
      await swapForThird(section, 2);
      await later();
      await sayOnSheet(THIRD.id, say);
      const again = await openToday();
      await vi.waitFor(() => expect(rowOf(again, 2).dataset.state).toBe('skipped'));
      expect(sub(again, 2)).toBe(SENTENCE[say]);
      expect(rowOf(again, 3).dataset.current).toBe('true');
      again.querySelector<HTMLButtonElement>('#today-continue')?.click();
      await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
      expect(navigateScore.mock.calls[0]?.[0], 'Continue opened the piece the learner withdrew after choosing it').toBe(FOURTH.id);
      const run = await stored();
      expect(run.activities[2]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'withdrawn', held: KEPT[say] }] });
      expect(run.activities[2]?.swappedAt, 'the swap kept its moment').toEqual(expect.any(String));
    });

    it(`${KEPT[say]}, then swapped in: the learner chose it knowing, so it stays and Continue opens it`, async () => {
      await startedAndFinished(2);
      await sayOnSheet(THIRD.id, say);
      await later();
      const section = await openToday();
      await swapForThird(section, 2);
      const again = await openToday();
      expect(rowOf(again, 2).dataset.state).toBe('pending');
      expect(rowOf(again, 2).dataset.current).toBe('true');
      expect(sub(again, 2)).not.toBe(SENTENCE[say]);
      again.querySelector<HTMLButtonElement>('#today-continue')?.click();
      await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
      expect(navigateScore.mock.calls[0]?.[0]).toBe(THIRD.id);
      expect((await stored()).activities[2]?.adaptations).toEqual([]);
    });
  }

  it('a row the learner taps is theirs: the swapped piece they withdrew after choosing it opens when they tap it', async () => {
    await startedAndFinished(2);
    const section = await openToday();
    await swapForThird(section, 2);
    await later();
    await sayOnSheet(THIRD.id, 'pause');
    const again = await openToday();
    await vi.waitFor(() => expect(rowOf(again, 2).dataset.state).toBe('skipped'));
    again.querySelector<HTMLButtonElement>('#today-card [data-activity="2"] button[aria-label^="Open"]')?.click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    expect(navigateScore.mock.calls[0]?.[0]).toBe(THIRD.id);
    expect((await stored()).current).toBe(2);
  });

  it('the swapped piece the learner is in is not taken from them by a pause that comes after the swap', async () => {
    await startedAndFinished(2);
    const section = await openToday();
    await swapForThird(section, 2);
    await on(2, { kind: 'opened' });
    await later();
    await sayOnSheet(THIRD.id, 'pause');
    const again = await openToday();
    expect(rowOf(again, 2).dataset.state).toBe('active');
    expect((await stored()).activities[2]?.state).toBe('active');
  });
});
