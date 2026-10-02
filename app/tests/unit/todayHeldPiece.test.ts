// @vitest-environment jsdom
/**
 * Today, while a session runs, after the learner paused the piece that is next (G90; the reviewer's ruling,
 * `docs/review/responses/d59f2ef8.md` question 2): the real Today screen over a real store (`fake-indexeddb`),
 * the session builder's card fixed, as `todaySessionRun.test.ts` fixes it — with every item slot carrying the
 * claim that chose it, as the composition's slots do.
 *
 * The snapshot stays and the card is not rebuilt; what Today draws and what *Continue* opens is the run as it
 * stands when the learner comes back, with the piece they paused already stepped past. A row the learner taps
 * is their own word about that piece and opens whatever its project says; a swapped-in piece carries no claim,
 * which is how the runner knows nobody but the learner chose it.
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
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'u1', title: 'Unit', track: 'core', lessons: [lesson('1.2', ['drill.test.warm'], ['song.test.piece', 'song.test.other', 'song.test.third'])] }] }],
} as unknown as Curriculum;

const MEASURED = { measurement: { status: 'measured', definitions: 1, located: {}, bars: 4, steps: 16, notes: 16, established: [] }, demands: [] } as unknown as Partial<CatalogItem>;
function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: id.startsWith('song') ? 'song' : 'exercise', title: `Title of ${id}`, level: 1, hands: 'right', tracks: ['core'], concepts: [], tags: [], file: `scores/${id}.mxl`, ...MEASURED, ...over } as unknown as CatalogItem;
}

const WARM = item('drill.test.warm', { type: 'drill', file: undefined, drill: { kind: 'note-flash', params: {} } } as unknown as Partial<CatalogItem>);
const PIECE = item('song.test.piece');
const OTHER = item('song.test.other');
/** The lesson's third song, on no row: what the swap sheet offers for the new piece. */
const THIRD = item('song.test.third');
const ITEMS = [WARM, PIECE, OTHER, THIRD];

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
const { SESSION_TEXT } = await import('../../src/ui/help');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

const claim = (kind: string): SessionSlot['claim'] => ({ kind }) as unknown as SessionSlot['claim'];

/** The card: a warm-up drill, the review piece, the new piece, the free prompt — each item slot with its claim. */
function card(): { template: (typeof SESSION_TEMPLATES)[number]; slots: SessionSlot[]; reached: string[] } {
  const slots: SessionSlot[] = [
    { kind: 'technique', minutes: 5, item: WARM, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', claim: claim('asked'), contact: 'none' },
    { kind: 'review', minutes: 5, item: PIECE, lessonId: '1.2', reason: 'Keeping this piece playable — last played on 1 Oct', claim: claim('piece-retention'), contact: 'met' },
    { kind: 'new', minutes: 7, item: OTHER, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', claim: claim('asked'), contact: 'none' },
    { kind: 'free', minutes: 4, reason: 'Play anything you like — no scoring, no cursor' },
  ];
  return { template: SESSION_TEMPLATES[2] as (typeof SESSION_TEMPLATES)[number], slots, reached: ['1.2'] };
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

/** *Start session*, then the warm-up finished the way its screen reports it: the review piece is next. */
async function startedAndWarmedUp(): Promise<import('../../src/data/sessionRun').SessionRun> {
  const section = await openToday();
  section.querySelector<HTMLButtonElement>('#today-start')?.click();
  await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
  const run = await stored();
  await store.applySessionEvent({ sessionId: run.sessionId, version: run.version, token: run.activities[0]?.token ?? '' }, { kind: 'completed', outcome: 'unknown' });
  navigateDrill.mockClear();
  navigateScore.mockClear();
  return stored();
}

const pause = async (itemId: string): Promise<void> => {
  await applyProjectAction({ itemId, material: undefined }, 'learn');
  await applyProjectAction({ itemId, material: undefined }, 'pause');
};

describe('the piece that is next was paused after Start session', () => {
  it('Today draws it skipped, names the one after as next, and Continue opens that one — never the piece', async () => {
    const run = await startedAndWarmedUp();
    expect(run.current).toBe(1);
    await pause(PIECE.id);
    const section = await openToday();
    const row = (index: number): HTMLElement => section.querySelector<HTMLElement>(`#today-card [data-activity="${String(index)}"]`) as HTMLElement;
    await vi.waitFor(() => expect(row(1).dataset.state, 'the paused piece is still waiting at its turn').toBe('skipped'));
    expect(row(1).querySelector('.list-row__badges')?.textContent).toContain(SESSION_TEXT.stateSkipped);
    expect(row(2).dataset.current).toBe('true');
    expect(section.querySelector('#today-continue-line')?.textContent).toContain(`next: Title of ${OTHER.id}`);
    section.querySelector<HTMLButtonElement>('#today-continue')?.click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    expect(navigateScore.mock.calls[0]?.[0], 'Continue opened the paused piece').toBe(OTHER.id);
    // What is written is what is drawn, and the composition is the one Start session kept.
    const after = await stored();
    expect(after.activities[1]).toMatchObject({ state: 'skipped', adaptations: [{ kind: 'skipped-redundant', why: 'Title of song.test.piece is skipped — you paused it' }] });
    expect(after.current).toBe(2);
    expect(after.activities.map((one) => one.slot.itemId)).toEqual(run.activities.map((one) => one.slot.itemId));
    expect(after.version).toBe(run.version);
  });

  it('a row the learner taps is their own word: the skipped piece opens, whatever its project says', async () => {
    await startedAndWarmedUp();
    await pause(PIECE.id);
    const section = await openToday();
    const row = section.querySelector<HTMLElement>('#today-card [data-activity="1"]') as HTMLElement;
    await vi.waitFor(() => expect(row.dataset.state).toBe('skipped'));
    section.querySelector<HTMLButtonElement>('#today-card [data-activity="1"] button[aria-label^="Open"]')?.click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    expect(navigateScore.mock.calls[0]?.[0]).toBe(PIECE.id);
    expect((await stored()).current).toBe(1);
  });

  it('what the runner skipped is not undone by the next card: a new composition is handed the same projects as before', async () => {
    await startedAndWarmedUp();
    await pause(PIECE.id);
    const section = await openToday();
    await vi.waitFor(() => expect(section.querySelector('#today-card [data-activity="1"]')?.getAttribute('data-state')).toBe('skipped'));
    buildSpy.mockClear();
    section.querySelector<HTMLButtonElement>('#today-end')?.click();
    await vi.waitFor(() => expect(section.querySelector('#today-finish')).not.toBeNull());
    section.querySelector<HTMLButtonElement>('#today-shuffle')?.click();
    await vi.waitFor(() => expect(buildSpy).toHaveBeenCalled());
    const input = buildSpy.mock.calls.at(-1)?.[0] as { projects?: { itemId: string; state: string }[] };
    expect(input.projects?.map((one) => [one.itemId, one.state])).toEqual([[PIECE.id, 'paused']]);
  });
});

describe('the claim the runner reads', () => {
  it('every item slot the composition chose reaches the record with its claim; a swapped-in piece has none', async () => {
    const section = await openToday();
    section.querySelector<HTMLButtonElement>('#today-start')?.click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
    const run = await stored();
    expect(run.activities.map((one) => one.slot.claim?.kind)).toEqual(['asked', 'piece-retention', 'asked']);
    // The learner swaps the new piece for the lesson's third song: nothing but the learner chose it.
    const again = await openToday();
    again.querySelector<HTMLButtonElement>('#today-card [data-activity="2"] .list-row__actions button')?.click();
    await vi.waitFor(() => expect(document.querySelector(`#today-swap [data-swap="${THIRD.id}"]`)).not.toBeNull());
    document.querySelector<HTMLElement>(`#today-swap [data-swap="${THIRD.id}"]`)?.click();
    await vi.waitFor(async () => expect((await stored()).activities[2]?.slot.itemId).toBe(THIRD.id));
    expect((await stored()).activities[2]?.slot.claim, 'a swap kept the composition’s claim').toBeUndefined();
  });
});
