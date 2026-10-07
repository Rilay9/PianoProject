// @vitest-environment jsdom
/**
 * The swap sheet wears the learner's project state (G94; the reviewer's ruling, `responses/9fce3792.md`:29–31;
 * U63, Entry 170). The sheet is the learner's own menu, so a piece they paused or put away may be listed
 * there (`swapOptions` reads no project), but it must not look like an ordinary automatic alternative: beside
 * it, the state in the project sheet's words — *Paused*, *Put away* — and nothing else marked. Chosen on
 * purpose, it is honoured as any swap is, and the project is not resumed: only the project sheet acts
 * (`projectLifecycle.test.ts`).
 *
 * The real Today screen over `todaySessionRun.test.ts`'s harness (copied, not shared: that file is X1's):
 * `buildSession` mocked with a fixed card, `swapOptions` real, a fake IndexedDB. The piece's row offers the
 * lesson's other song, `song.test.other`, whose project is seeded straight into the store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionSlot } from '../../src/curriculum/session';
import type { ProjectRow, ProjectState } from '../../src/data/db';

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
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'u1', title: 'Unit', track: 'core', lessons: [lesson('1.2', ['drill.test.warm'], ['song.test.piece', 'song.test.other'])] }] }],
} as unknown as Curriculum;

const MEASURED = { measurement: { status: 'measured', definitions: 1, located: {}, bars: 4, steps: 16, notes: 16, established: [] }, demands: [] } as unknown as Partial<CatalogItem>;
function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: id.startsWith('song') ? 'song' : 'exercise', title: `Title of ${id}`, level: 1, hands: 'right', tracks: ['core'], concepts: [], tags: [], file: `scores/${id}.mxl`, ...MEASURED, ...over } as unknown as CatalogItem;
}

const WARM = item('drill.test.warm', { type: 'drill', file: undefined, drill: { kind: 'note-flash', params: {} } } as unknown as Partial<CatalogItem>);
const PIECE = item('song.test.piece');
/** The lesson's other song, on no row: what the swap sheet offers for the piece. */
const OTHER = item('song.test.other');
const ITEMS = [WARM, PIECE, OTHER];

const { buildSpy } = vi.hoisted(() => ({ buildSpy: vi.fn() }));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve(ITEMS),
}));

vi.mock('../../src/curriculum/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/session')>();
  return { ...original, buildSession: buildSpy };
});

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');
const { SESSION_TEMPLATES } = await import('../../src/curriculum/session');
const { PROJECT_TEXT } = await import('../../src/ui/help');
const { openDatabase } = await import('../../src/data/db');
const { allProjects, resetProjectsForTest } = await import('../../src/data/projectStore');
const sessionRun = await import('../../src/data/sessionRun');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

/** The card: a drill warm-up and a piece, both activities the runner can finish. */
function card(): { template: (typeof SESSION_TEMPLATES)[number]; slots: SessionSlot[]; reached: string[] } {
  const slots: SessionSlot[] = [
    { kind: 'technique', minutes: 5, item: WARM, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', contact: 'none' },
    { kind: 'new', minutes: 10, item: PIECE, lessonId: '1.2', reason: 'This lesson asks for it — not counted yet', contact: 'met' },
  ];
  return { template: SESSION_TEMPLATES[2] as (typeof SESSION_TEMPLATES)[number], slots, reached: ['1.2'] };
}

let router: Router;
let navigateDrill: ReturnType<typeof vi.fn>;

beforeEach(() => {
  useFakeIndexedDb();
  resetProjectsForTest();
  sessionRun.resetSessionRunForTest();
  buildSpy.mockReset();
  buildSpy.mockImplementation(() => card());
  navigateDrill = vi.fn();
  router = { route: { tab: 'today' }, navigate: vi.fn(), navigateScore: vi.fn(), navigateDrill, navigatePdf: vi.fn(), navigateLesson: vi.fn() } as unknown as Router;
  updateSettings({ weekdaySessionMinutes: 60, weekendSessionMinutes: 60 });
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
  updateSettings({ weekdaySessionMinutes: DEFAULT_SETTINGS.weekdaySessionMinutes, weekendSessionMinutes: DEFAULT_SETTINGS.weekendSessionMinutes });
});

/** A project row for the other song, as the sheet keeps an id's row (`projects.spec.ts` seeds the same shape). */
async function seedProject(state: ProjectState): Promise<void> {
  const at = new Date().toISOString();
  const row: ProjectRow = { id: `id:${OTHER.id}`, material: { kind: 'id', itemId: OTHER.id }, itemId: OTHER.id, state, since: at, history: [{ state, at, why: 'pause' }] } as unknown as ProjectRow;
  const db = await openDatabase();
  await db?.put('projects', row);
}

async function openToday(): Promise<HTMLElement> {
  const section = TodayScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#today-card [data-item]')).not.toBeNull());
  await vi.waitFor(() => expect(section.querySelector('#today-actions .button--primary')).not.toBeNull());
  return section;
}

/** Opens the piece row's swap sheet (the card's, or the running card's) and returns the other song's option. */
async function otherOption(section: HTMLElement, rowSelector: string): Promise<HTMLElement> {
  section.querySelector<HTMLButtonElement>(`${rowSelector} .list-row__actions button`)?.click();
  await vi.waitFor(() => expect(document.querySelector(`#today-swap [data-swap="${OTHER.id}"]`)).not.toBeNull());
  return document.querySelector<HTMLElement>(`#today-swap [data-swap="${OTHER.id}"]`) as HTMLElement;
}

const marks = (option: HTMLElement): { text: string; state: string | undefined }[] =>
  [...option.querySelectorAll<HTMLElement>('.badge')].map((badge) => ({ text: badge.textContent ?? '', state: badge.dataset.project }));

describe('the swap sheet wears Paused / Put away beside a piece the learner paused or put away (G94)', () => {
  it('paused: Paused beside the option, the state in data-project', async () => {
    await seedProject('paused');
    const option = await otherOption(await openToday(), `#today-card [data-item="${PIECE.id}"]`);
    expect(marks(option)).toEqual([{ text: PROJECT_TEXT.states.paused, state: 'paused' }]);
    expect(PROJECT_TEXT.states.paused).toBe('Paused');
  });

  it('put away: Put away beside the option', async () => {
    await seedProject('retired');
    const option = await otherOption(await openToday(), `#today-card [data-item="${PIECE.id}"]`);
    expect(marks(option)).toEqual([{ text: PROJECT_TEXT.states.retired, state: 'retired' }]);
    expect(PROJECT_TEXT.states.retired).toBe('Put away');
  });

  it('a project in any other state, or none, marks nothing, and nothing is omitted or reordered', async () => {
    const order = async (): Promise<string[]> => {
      const section = await openToday();
      await otherOption(section, `#today-card [data-item="${PIECE.id}"]`);
      return [...document.querySelectorAll<HTMLElement>('#today-swap [data-swap]')].map((row) => row.dataset.swap ?? '');
    };
    const none = await order();
    expect(marks(document.querySelector<HTMLElement>(`#today-swap [data-swap="${OTHER.id}"]`) as HTMLElement)).toEqual([]);
    for (const state of ['learning', 'maintaining', 'saved'] as const) {
      await seedProject(state);
      expect(await order(), state).toEqual(none);
      expect(marks(document.querySelector<HTMLElement>(`#today-swap [data-swap="${OTHER.id}"]`) as HTMLElement), state).toEqual([]);
    }
    await seedProject('paused');
    expect(await order()).toEqual(none);
  });

  it('the paused option chosen: on the card as the learner’s choice, and the project still paused', async () => {
    await seedProject('paused');
    const section = await openToday();
    (await otherOption(section, `#today-card [data-item="${PIECE.id}"]`)).click();
    await vi.waitFor(() => expect(section.querySelector(`#today-card [data-item="${OTHER.id}"]`)).not.toBeNull());
    expect(section.querySelector(`#today-card [data-item="${OTHER.id}"] .list-row__sub`)?.textContent).toBe('You chose this one — from the same lesson');
    const rows = await allProjects();
    expect(rows.map((row) => [row.itemId, row.state, row.history.length])).toEqual([[OTHER.id, 'paused', 1]]);
  });

  it('the running card’s sheet: the same mark, and the choice honoured without resuming the project', async () => {
    await seedProject('paused');
    const first = await openToday();
    first.querySelector<HTMLButtonElement>('#today-start')?.click();
    await vi.waitFor(() => expect(navigateDrill).toHaveBeenCalledTimes(1));
    const section = await openToday();
    const option = await otherOption(section, '#today-card [data-activity="1"]');
    expect(marks(option)).toEqual([{ text: 'Paused', state: 'paused' }]);
    option.click();
    await vi.waitFor(async () => {
      const read = await sessionRun.readSessionRun();
      expect(read.kind === 'run' ? read.run.activities[1]?.slot.itemId : undefined).toBe(OTHER.id);
    });
    const read = await sessionRun.readSessionRun();
    expect(read.kind === 'run' ? read.run.activities[1]?.reason : undefined).toBe('You chose this one — from the same lesson');
    const rows = await allProjects();
    expect(rows.map((row) => [row.itemId, row.state, row.history.length])).toEqual([[OTHER.id, 'paused', 1]]);
  });
});
