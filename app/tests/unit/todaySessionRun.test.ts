// @vitest-environment jsdom
/**
 * Today runs the composed session (X1; Part 18's fifteen cases, those Today holds): the real Today screen, the
 * session builder's card fixed (a drill warm-up, a piece, the transfer offer, the free prompt, a PDF the
 * runner cannot finish), and a real store (`fake-indexeddb`).
 *
 * - *Start session* opens execution state, not the first slot: the record is written from the card as composed
 *   — the free prompt and the PDF outside the cursor — and the first activity opens with its token.
 * - Leaving and reopening resumes: *Continue today's session · N of M min · next: …*, the one filled box, and
 *   *Continue* opens the current activity with its token; the card is the run's, a done row marked done and
 *   the current one marked next; a row tapped out of order becomes current and opens with its own token.
 * - The finish line after the last activity (states, no judgement, the free prompt counted nowhere); an early
 *   end says what waits, without guilt, and marks nothing failed; a card composed after the session marks the
 *   rows done today.
 * - Another day's run is closed as not finished on load, without a word; Shuffle recomposes and closes the
 *   running session; a corrupt record is discarded and the card shown as composed.
 * - U73: a transfer offer whose snapshot cannot be kept opens nothing, and Today says so. U71: the offer's line
 *   on the card is its skill and "something new", cut at the clause.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionSlot } from '../../src/curriculum/session';
import type { Relationship } from '../../src/curriculum/transfer';
import type { OfferSnapshot } from '../../src/data/offerSnapshot';

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
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'u1', title: 'Unit', track: 'core', lessons: [lesson('1.2', ['drill.test.warm', 'exercise.test.offer'], ['song.test.piece', 'song.test.other'])] }] }],
} as unknown as Curriculum;

const MEASURED = { measurement: { status: 'measured', definitions: 1, located: {}, bars: 4, steps: 16, notes: 16, established: [] }, demands: [] } as unknown as Partial<CatalogItem>;
function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: id.startsWith('song') ? 'song' : 'exercise', title: `Title of ${id}`, level: 1, hands: 'right', tracks: ['core'], concepts: [], tags: [], file: `scores/${id}.mxl`, ...MEASURED, ...over } as unknown as CatalogItem;
}

const WARM = item('drill.test.warm', { type: 'drill', file: undefined, drill: { kind: 'note-flash', params: {} } } as unknown as Partial<CatalogItem>);
const PIECE = item('song.test.piece');
const OFFERED = item('exercise.test.offer', {
  role: 'transfer',
  provenance: { identity: { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A' }, tempoBpm: 72 } },
} as unknown as Partial<CatalogItem>);
const PAGES = item('import.test.pdf', { kind: 'pdf', file: undefined, imported: true } as unknown as Partial<CatalogItem>);
/** The lesson's other song, on no row: what the swap sheet offers for the piece. */
const OTHER = item('song.test.other');
const ITEMS = [WARM, PIECE, OFFERED, PAGES, OTHER];

const RELATIONSHIP: Relationship = {
  skill: 'position-shift',
  shownOn: [{ itemId: 'drill.reading.sight-reading-2-right', material: { kind: 'generator', family: 'sight-reading', version: 2, seed: 101, recipe: { level: 2 }, tempoBpm: 72 } }],
  measured: [{ dimension: 'family', candidate: 'pentatonic', shownOn: ['sight-reading'], differs: true }],
  differsOn: ['family'],
};

const { buildSpy, writeFails } = vi.hoisted(() => ({ buildSpy: vi.fn(), writeFails: { current: false } }));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve(ITEMS),
}));

vi.mock('../../src/curriculum/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/session')>();
  return { ...original, buildSession: buildSpy };
});

vi.mock('../../src/data/offerSnapshot', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/offerSnapshot')>();
  return {
    ...original,
    writeOfferSnapshot: vi.fn(async (snapshot: OfferSnapshot) => {
      if (writeFails.current) throw new Error('quota');
      await original.writeOfferSnapshot(snapshot);
    }),
  };
});

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
const { SESSION_TEMPLATES } = await import('../../src/curriculum/session');
const store = await import('../../src/data/sessionRun');
const { dayKey } = await import('../../src/data/progressStore');
const { SESSION_TEXT } = await import('../../src/ui/help');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

const TRANSFER_WORDS = 'Shifting position: something new, for a skill you have shown — it should feel different';

/** The card: a drill warm-up, a piece, the transfer offer, a PDF the runner cannot finish, the free prompt. */
function card(order: 'offer-last' | 'offer-first' = 'offer-last'): { template: (typeof SESSION_TEMPLATES)[number]; slots: SessionSlot[]; reached: string[] } {
  const offer: SessionSlot = {
    kind: 'new',
    minutes: 10,
    item: OFFERED,
    lessonId: '1.2',
    reason: TRANSFER_WORDS,
    claim: { kind: 'transfer', skill: 'position-shift', relationship: structuredClone(RELATIONSHIP), contact: { contact: 'unmet', metById: false } },
    contact: 'first-contact',
  };
  const slots: SessionSlot[] = [
    { kind: 'technique', minutes: 5, item: WARM, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', contact: 'none' },
    { kind: 'review', minutes: 5, item: PIECE, lessonId: '1.2', reason: 'Nothing due for review — more from this lesson', contact: 'met' },
    offer,
    { kind: 'repertoire', minutes: 7, item: PAGES, reason: 'More music from this lesson' },
    { kind: 'free', minutes: 4, reason: 'Play anything you like — no scoring, no cursor' },
  ];
  if (order === 'offer-first') slots.unshift(slots.splice(2, 1)[0] as SessionSlot);
  return { template: SESSION_TEMPLATES[2] as (typeof SESSION_TEMPLATES)[number], slots, reached: ['1.2'] };
}

let navigateScore: ReturnType<typeof vi.fn>;
let navigateDrill: ReturnType<typeof vi.fn>;
let router: Router;

beforeEach(() => {
  useFakeIndexedDb();
  store.resetSessionRunForTest();
  writeFails.current = false;
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

async function startSession(): Promise<import('../../src/data/sessionRun').SessionRun> {
  const section = await openToday();
  section.querySelector<HTMLButtonElement>('#today-start')?.click();
  await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
  return stored();
}

const at = (run: import('../../src/data/sessionRun').SessionRun, index: number) => ({ sessionId: run.sessionId, version: run.version, token: run.activities[index]?.token ?? '' });

describe('Start session opens execution state, not the first slot', () => {
  it('the record is the card as composed: three activities with their words and contact, the PDF and the free prompt outside the cursor', async () => {
    const run = await startSession();
    expect(run.activities.map((a) => [a.slot.kind, a.slot.itemId, a.route.target, a.reason, a.contact?.assumed])).toEqual([
      ['technique', WARM.id, 'drill', 'This lesson asks for it — not counted yet', 'none'],
      ['review', PIECE.id, 'score', 'Nothing due for review — more from this lesson', 'met'],
      ['new', OFFERED.id, 'score', TRANSFER_WORDS, 'first-contact'],
    ]);
    expect(run.outside.map((one) => [one.kind, one.itemId ?? null])).toEqual([
      ['repertoire', PAGES.id],
      ['free', null],
    ]);
    expect(run.activities[2]?.route.transfer?.relationship).toEqual(RELATIONSHIP);
    expect(run.current).toBe(0);
    expect(store.plannedMinutes(run)).toBe(20);
    // The first activity opened with its own token, and the rung that judges it.
    expect(navigateDrill).toHaveBeenCalledWith(WARM.id, { rung: '1.2', session: run.activities[0]?.token });
    expect(navigateScore).not.toHaveBeenCalled();
  });
});

describe('leaving and reopening resumes today’s session', () => {
  it('Continue, the one filled box, with where the session is; it opens the current activity with its token', async () => {
    const run = await startSession();
    navigateDrill.mockClear();
    const section = await openToday();
    expect(section.querySelector('#today-start')).toBeNull();
    const filled = section.querySelectorAll('#today-actions .button--primary');
    expect(filled).toHaveLength(1);
    expect(filled[0]?.id).toBe('today-continue');
    expect(section.querySelector('#today-continue-line')?.textContent).toBe(SESSION_TEXT.continueLine(0, 20, `Title of ${WARM.id}`));
    (filled[0] as HTMLButtonElement).click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledWith(WARM.id, { rung: '1.2', session: run.activities[0]?.token }));
  });

  it('the card is the run’s: a done row says done, the current one says next and is marked, the prompts stay outside', async () => {
    const run = await startSession();
    await store.applySessionEvent(at(run, 0), { kind: 'completed', outcome: 'unknown' });
    const section = await openToday();
    const rows = [...section.querySelectorAll<HTMLElement>('#today-card [data-activity]')];
    expect(rows.map((row) => [row.dataset.item, row.dataset.state, row.dataset.current])).toEqual([
      [WARM.id, 'completed', 'false'],
      [PIECE.id, 'pending', 'true'],
      [OFFERED.id, 'pending', 'false'],
    ]);
    expect(rows[0]?.querySelector('.list-row__badges')?.textContent).toContain(SESSION_TEXT.stateDone);
    expect(rows[1]?.classList.contains('today-row--current')).toBe(true);
    expect(rows[1]?.querySelector('.list-row__badges')?.textContent).toContain(SESSION_TEXT.stateNext);
    expect(section.querySelector('#today-card [data-outside="true"][data-item="import.test.pdf"]')).not.toBeNull();
    expect(section.querySelector('#today-card .today-prompt[data-outside="true"]')?.textContent).toContain('Free play');
    expect(section.querySelector('#today-continue-line')?.textContent).toContain(`next: Title of ${PIECE.id}`);
  });

  it('a row tapped out of order becomes current and opens with its own token; a done row opens outside the session', async () => {
    const run = await startSession();
    await store.applySessionEvent(at(run, 0), { kind: 'completed', outcome: 'unknown' });
    const section = await openToday();
    navigateScore.mockClear();
    navigateDrill.mockClear();
    section.querySelector<HTMLButtonElement>(`#today-card [data-activity="2"] button[aria-label^="Open"]`)?.click();
    await vi.waitFor(() => expect(navigateScore).toHaveBeenCalledTimes(1));
    expect((await stored()).current).toBe(2);
    expect(navigateScore.mock.calls[0]?.[1]).toMatchObject({ slot: 'new', session: run.activities[2]?.token, intent: { intent: 'transfer', skill: 'position-shift', offer: run.activities[2]?.token } });
    const again = await openToday();
    again.querySelector<HTMLButtonElement>(`#today-card [data-activity="0"] button[aria-label^="Open"]`)?.click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledWith(WARM.id, { rung: '1.2' }));
  });
});

describe('the running session is the run’s (Part 20)', () => {
  it('a row swapped on the card before Start is the activity Start writes', async () => {
    const section = await openToday();
    section.querySelector<HTMLButtonElement>(`#today-card [data-item="${PIECE.id}"] .list-row__actions button`)?.click();
    await vi.waitFor(() => expect(document.querySelector(`#today-swap [data-swap="${OTHER.id}"]`)).not.toBeNull());
    document.querySelector<HTMLElement>(`#today-swap [data-swap="${OTHER.id}"]`)?.click();
    await vi.waitFor(() => expect(section.querySelector(`#today-card [data-item="${OTHER.id}"]`)).not.toBeNull());
    section.querySelector<HTMLButtonElement>('#today-start')?.click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
    const run = await stored();
    expect(run.activities[1]).toMatchObject({ slot: { itemId: OTHER.id }, reason: 'You chose this one — from the same lesson' });
  });

  it('changed evidence does not rebuild the running session: a card composed since is not drawn while it runs', async () => {
    const run = await startSession();
    buildSpy.mockImplementation(() => ({ ...card(), slots: card().slots.slice(1) }));
    const section = await openToday();
    expect([...section.querySelectorAll<HTMLElement>('#today-card [data-activity]')].map((row) => row.dataset.item)).toEqual(run.activities.map((a) => a.slot.itemId));
  });

  it('a running activity swapped on the card is replaced with a new token: the learner’s change, never the runner’s', async () => {
    const run = await startSession();
    const section = await openToday();
    section.querySelector<HTMLButtonElement>(`#today-card [data-activity="1"] .list-row__actions button`)?.click();
    await vi.waitFor(() => expect(document.querySelector(`#today-swap [data-swap="${OTHER.id}"]`)).not.toBeNull());
    document.querySelector<HTMLElement>(`#today-swap [data-swap="${OTHER.id}"]`)?.click();
    await vi.waitFor(async () => expect((await stored()).activities[1]?.slot.itemId).toBe(OTHER.id));
    const after = await stored();
    expect(after.activities[1]?.token).not.toBe(run.activities[1]?.token);
    expect(after.activities[1]).toMatchObject({ state: 'pending', reason: 'You chose this one — from the same lesson', adaptations: [] });
    expect(after.sessionId).toBe(run.sessionId);
  });

  it('the doors stay while a session runs: exploration is reachable, and nothing requires it', async () => {
    await startSession();
    const section = await openToday();
    await vi.waitFor(() => expect(section.querySelectorAll('#today-doors button').length).toBeGreaterThanOrEqual(3));
    expect(section.querySelector('#today-play')).not.toBeNull();
    expect(section.querySelector('#today-lab')).not.toBeNull();
  });
});

describe('the finish line, and an early end', () => {
  it('after the last activity: done and the time from the clock, what each came to, nothing judged; the free prompt counted nowhere', async () => {
    let run = await startSession();
    await store.applySessionEvent(at(run, 0), { kind: 'accrue', ms: 50_000 });
    await store.applySessionEvent(at(run, 0), { kind: 'completed', outcome: 'unknown' });
    run = await stored();
    await store.applySessionEvent(at(run, 1), { kind: 'attempted' });
    await store.applySessionEvent(at(run, 1), { kind: 'advance' });
    run = await stored();
    await store.applySessionEvent(at(run, 2), { kind: 'advance' });
    expect((await stored()).closed?.why).toBe('finished');
    const section = await openToday();
    expect(section.querySelector('.today-finish__head')?.textContent).toBe(SESSION_TEXT.finishedHead(1));
    expect(section.querySelector('.today-finish__detail')?.textContent).toBe('Warm-up done · Review played · New skipped');
    expect(section.querySelector('#today-start')).not.toBeNull();
    // The card composed after it marks the warm-up done today: a completed activity is never offered as untouched.
    const warm = section.querySelector(`#today-card [data-item="${WARM.id}"]`);
    expect(warm?.querySelector('.list-row__badges')?.textContent).toContain(SESSION_TEXT.doneToday);
  });

  it('ended on purpose: says what waits for another day, marks nothing failed', async () => {
    const run = await startSession();
    await store.applySessionEvent(at(run, 0), { kind: 'completed', outcome: 'failed' });
    const section = await openToday();
    section.querySelector<HTMLButtonElement>('#today-end')?.click();
    await vi.waitFor(() => expect(section.querySelector('.today-finish__head')?.textContent).toBe(SESSION_TEXT.endedHead(0)));
    expect(section.querySelector('.today-finish__detail')?.textContent).toBe(`Warm-up played — ${SESSION_TEXT.deferred}: Review, New`);
    const after = await stored();
    expect(after.endedOnPurpose).toBe(true);
    expect(after.activities.map((a) => a.state)).toEqual(['attempted', 'pending', 'pending']);
  });
});

describe('another day, a recomposed card, a corrupt record', () => {
  it('yesterday’s open run is closed as not finished when today’s card is composed, and nothing is said of it', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await store.startSessionRun(
      store.newRun({
        day: dayKey(yesterday),
        sessionId: 'yesterday1',
        version: 'v',
        startedAt: yesterday.toISOString(),
        activities: [{ order: 0, token: 'yester001', slot: { kind: 'new', itemId: PIECE.id, title: 'P', minutes: 5 }, route: { target: 'score', itemId: PIECE.id }, reason: 'r' }],
        outside: [],
      }),
    );
    const section = await openToday();
    expect((await stored()).closed?.why).toBe('not-finished');
    expect(section.querySelector('#today-continue')).toBeNull();
    expect(section.querySelector('#today-finish')).toBeNull();
    expect(section.querySelector('#today-start')).not.toBeNull();
  });

  it('Shuffle recomposes the card: the running session is closed as recomposed and Start session is back', async () => {
    await startSession();
    const section = await openToday();
    section.querySelector<HTMLButtonElement>('#today-shuffle')?.click();
    await vi.waitFor(() => expect(section.querySelector('#today-start')).not.toBeNull());
    expect((await stored()).closed?.why).toBe('recomposed');
    expect(section.querySelector('#today-card [data-activity]')).toBeNull();
  });

  it('a corrupt record is discarded, and the card is shown as composed', async () => {
    const { openDatabase } = await import('../../src/data/db');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const db = await openDatabase();
    await db?.put('settings', { format: 1, day: dayKey(new Date()), sessionId: 7 }, store.SESSION_RUN_KEY);
    const section = await openToday();
    expect(section.querySelector('#today-start')).not.toBeNull();
    expect(section.querySelectorAll('#today-card [data-item]').length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('U73 and U71', () => {
  it('a transfer offer whose snapshot cannot be kept opens nothing, and Today says so (the live card and the session)', async () => {
    writeFails.current = true;
    const section = await openToday();
    section.querySelector<HTMLButtonElement>('#today-card [data-claim="transfer"] button[aria-label^="Open"]')?.click();
    await vi.waitFor(() => expect(section.querySelector('#today-status')?.textContent).toBe(SESSION_TEXT.offerNotKept));
    expect(navigateScore).not.toHaveBeenCalled();
    buildSpy.mockImplementation(() => card('offer-first'));
    const again = await openToday();
    again.querySelector<HTMLButtonElement>('#today-start')?.click();
    await vi.waitFor(() => expect(again.querySelector('#today-status')?.textContent).toBe(SESSION_TEXT.offerNotKept));
    expect(navigateScore).not.toHaveBeenCalled();
    // The session is kept, and Continue is there to try again.
    expect(again.querySelector('#today-continue')).not.toBeNull();
  });

  it('the offer’s line on the card is its skill and “something new”; the whole invitation is the composition’s words, kept for the transition', async () => {
    const section = await openToday();
    expect(section.querySelector('#today-card [data-claim="transfer"] .list-row__sub')?.textContent).toBe('Shifting position: something new');
    section.querySelector<HTMLButtonElement>('#today-start')?.click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalled());
    expect((await stored()).activities[2]?.reason).toBe(TRANSFER_WORDS);
  });
});
