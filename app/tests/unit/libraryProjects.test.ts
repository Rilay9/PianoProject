// @vitest-environment jsdom
/**
 * The Library reads the learner's projects (G85; the reviewer's ruling on the G1b brief,
 * `docs/review/responses/a96395d.md`, question 3: after X3 the Library may expose the same project
 * state and open the same sheet, consuming the one `projectStore` truth).
 *
 * - `matches` takes the project filter as it takes `status`, with the projects handed in beside the
 *   progress rows: it never reads the store.
 * - A song row whose project exists wears one badge in `PROJECT_TEXT.states`' words, beside its status
 *   badge; a row with none wears none (exploring is the absence of a row). The identity is the store's
 *   own (`projectIn` over `materialOfItem`): the same file under another id finds the project, an
 *   import's project made on its loaded bytes is found by its id, another id's id-only row is not.
 * - A write to the store while the list is up redraws the row's badge and the filter's result, from one
 *   read. The row's actions are the ones it had: a door beside them did not fit at 342 px (Entry 147),
 *   so the row wears the state and spends no width on a door. The Library moves no project itself
 *   (`projectLifecycle.test.ts` holds the one actor).
 * - The door is inside the piece's Details (G85a; the reviewer's required change on G85,
 *   `docs/review/responses/ba4c6fea.md`): one row, *What next with this piece?* over the sheet's own
 *   state line, opening the one project sheet on the target the index resolved; shown wherever a
 *   project exists, and with none only where the sheet's offers from no project are honest for the
 *   piece (a song that opens on the Score screen) — never on a PDF or a placeholder without one.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';
import type { CatalogItem } from '../../src/curriculum/types';
import type { ProgressRow, ProjectRow, ProjectState } from '../../src/data/db';
import type { Identity } from '../../src/review/record';

const { items, file } = vi.hoisted(() => {
  const file = (c: string): { kind: 'file'; sha256: string } => ({ kind: 'file', sha256: c.repeat(64) });
  const song = (id: string, title: string, identity: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    id,
    type: 'song',
    title,
    level: 2,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity },
    ...extra,
  });
  return {
    file,
    items: [
      song('song.learning', 'Minuet in G', file('a')),
      song('song.paused', 'Arioso', file('b')),
      song('song.none', 'Ecossaise', file('c')),
      song('song.twin', 'Musette', file('d')),
      song('exercise.five', 'Five-finger pattern', file('e'), { type: 'exercise' }),
      // An import: the catalogue row names no material (`materialOfItem` is `none`), so its project is
      // found by its id — here one made on the Score screen, keyed by the bytes it loaded.
      { id: 'import.mine', type: 'song', title: 'My own waltz', level: 3, hands: 'both', tracks: [], concepts: [], tags: [], imported: true, kind: 'musicxml' },
      // A piece the catalogue wants and does not bundle (a placeholder, G85a): no file, not imported,
      // so it opens nowhere (`targetFor` is `none`) and its build identity is `none`.
      {
        id: 'song.wanted',
        type: 'song',
        title: 'A wanted piece',
        level: 3,
        hands: 'both',
        tracks: [],
        concepts: ['import-only'],
        tags: [],
        provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: { kind: 'none', why: 'a placeholder' } },
      },
      // A PDF import (G85a): a song in the catalogue (`isProjectable`), opened in the PDF viewer.
      { id: 'import.pdf', type: 'song', title: 'A page of mine', level: 3, hands: 'both', tracks: [], concepts: [], tags: [], imported: true, kind: 'pdf' },
    ],
  };
});

vi.mock('../../src/curriculum/load', () => ({
  allItems: () => Promise.resolve(items),
  loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
  // The encounter history's catalogue (G85a): the project sheet opened from Details reads what the
  // learner has played through it (`encounterStore.familiarity`), as `projectSheet.test.ts` stubs it.
  catalogIndex: () => Promise.resolve({ items, byId: new Map(items.map((one) => [one.id as string, one])) }),
}));

const { LibraryScreen, matches } = await import('../../src/ui/screens/LibraryScreen');
const { OFFERS, PROJECT_STATES, allProjects, applyProjectAction, resetProjectsForTest } = await import('../../src/data/projectStore');
const { dayKey, resetProgressForTest } = await import('../../src/data/progressStore');
const { resetEncountersForTest } = await import('../../src/data/encounterStore');
const { PROJECT_TEXT, projectSince } = await import('../../src/ui/help');

const navigateScore = vi.fn();
const router = { navigate: vi.fn(), navigateScore } as unknown as Router;

// --- matches, on constructed rows ---------------------------------------------------------------

const BROWSE = { query: '', type: 'all', track: 'all', status: 'all', hands: 'all', minLevel: 0, maxLevel: 10, importedOnly: false, sort: 'level' } as const;

function row(itemId: string, state: ProjectState): ProjectRow {
  const at = '2026-09-29T12:00:00.000Z';
  return { id: `id:${itemId}`, material: { kind: 'id', itemId }, itemId, state, since: at, history: [{ state, at, why: 'learn' }] };
}

function song(id: string): CatalogItem {
  return { id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], tags: [], file: `scores/${id}.mxl` } as unknown as CatalogItem;
}

describe('matches: the project filter, read like status (G85 item 3)', () => {
  const pieces = PROJECT_STATES.map((state) => song(`song.${state}`));
  const none = song('song.none');
  const projects = new Map(PROJECT_STATES.map((state) => [`song.${state}`, row(`song.${state}`, state)]));
  const progress = new Map<string, ProgressRow>();

  it('each state lists the piece whose project is in it, and no other piece', () => {
    for (const state of PROJECT_STATES) {
      const listed = [...pieces, none].filter((item) => matches(item, { ...BROWSE, project: state }, progress, projects)).map((item) => item.id);
      expect(listed, state).toEqual([`song.${state}`]);
    }
  });

  it('any project lists every piece with a project, in whatever state, and not the piece without one', () => {
    const listed = [...pieces, none].filter((item) => matches(item, { ...BROWSE, project: 'any' } as never, progress, projects)).map((item) => item.id);
    expect(listed).toEqual(pieces.map((item) => item.id));
  });

  it('all lists everything, projects or not', () => {
    for (const item of [...pieces, none]) expect(matches(item, { ...BROWSE, project: 'all' } as never, progress, projects), item.id).toBe(true);
  });

  it('a caller that sets no project filter and hands in no projects is answered as before', () => {
    for (const item of [...pieces, none]) expect(matches(item, BROWSE as never, progress), item.id).toBe(true);
    // And a project filter with no projects handed in finds nothing to list, rather than everything.
    expect(matches(pieces[1] as CatalogItem, { ...BROWSE, project: 'learning' } as never, progress)).toBe(false);
  });

  it('the project filter narrows alongside the others, never instead of them', () => {
    const learning = pieces[PROJECT_STATES.indexOf('learning')] as CatalogItem;
    expect(matches(learning, { ...BROWSE, project: 'learning', type: 'exercise' } as never, progress, projects)).toBe(false);
    expect(matches(learning, { ...BROWSE, project: 'learning', query: 'nothing like it' } as never, progress, projects)).toBe(false);
    expect(matches(learning, { ...BROWSE, project: 'learning', query: 'learning' } as never, progress, projects)).toBe(true);
  });
});

// --- the screen -----------------------------------------------------------------------------------

async function seed(): Promise<void> {
  const target = (itemId: string, material: Identity | undefined): { itemId: string; material: Identity | undefined } => ({ itemId, material });
  await applyProjectAction(target('song.learning', file('a')), 'learn');
  await applyProjectAction(target('song.paused', file('b')), 'learn');
  await applyProjectAction(target('song.paused', file('b')), 'pause');
  // The same file, made a project under an id the catalogue has since renamed.
  await applyProjectAction(target('song.twin.before', file('d')), 'save');
  // A project on an exercise's id (no door makes one; a row in the store, however it got there).
  await applyProjectAction(target('exercise.five', file('e')), 'learn');
  // The import's project, made on the Score screen on the bytes it loaded.
  await applyProjectAction(target('import.mine', file('f')), 'polish');
  // Another id's id-only row: never another piece's.
  await applyProjectAction(target('song.gone', undefined), 'learn');
}

async function mount(): Promise<HTMLElement> {
  const section = LibraryScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#library-list .list-row').length).toBe(items.length);
  });
  return section;
}

const rowOf = (section: HTMLElement, id: string): HTMLElement | null => section.querySelector<HTMLElement>(`#library-list .list-row[data-item="${id}"]`);
const projectBadgeOf = (section: HTMLElement, id: string): HTMLElement | null => rowOf(section, id)?.querySelector<HTMLElement>('.badge[data-project]') ?? null;
const shownIds = (section: HTMLElement): string[] => [...section.querySelectorAll<HTMLElement>('#library-list .list-row')].map((one) => one.dataset.item ?? '');

function choose(section: HTMLElement, value: string): void {
  const select = section.querySelector<HTMLSelectElement>('#library-project');
  if (!select) throw new Error('no project filter');
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

// Revised title (G85a): item 2, the door, was a question; it is inside Details now (the describe below).
describe('the Library row wears the learner’s project (G85 item 1; the door in Details, G85a)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    resetProjectsForTest();
    navigateScore.mockClear();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('a song with a project wears one badge in the state’s words; a song with none, and an exercise, wear none', async () => {
    await seed();
    const section = await mount();
    expect(projectBadgeOf(section, 'song.learning')?.textContent).toBe(PROJECT_TEXT.states.learning);
    expect(projectBadgeOf(section, 'song.paused')?.textContent).toBe(PROJECT_TEXT.states.paused);
    // The same file under another id: the store's own identity rule.
    expect(projectBadgeOf(section, 'song.twin')?.textContent).toBe(PROJECT_TEXT.states.saved);
    // The import's project on its loaded bytes, found by its id.
    expect(projectBadgeOf(section, 'import.mine')?.textContent).toBe(PROJECT_TEXT.states.polishing);
    // Exploring is the absence of a row: no *not started*, no badge at all.
    expect(projectBadgeOf(section, 'song.none')).toBeNull();
    expect(rowOf(section, 'song.none')?.textContent).not.toContain(PROJECT_TEXT.notStarted);
    // Not projectable: a row in the store for its id is not the Library's to show.
    expect(projectBadgeOf(section, 'exercise.five')).toBeNull();
    for (const id of ['song.learning', 'song.paused', 'song.twin', 'import.mine']) {
      expect(rowOf(section, id)?.querySelectorAll('.badge[data-project]'), id).toHaveLength(1);
      expect(rowOf(section, id)?.dataset.projectState, id).toBe(projectBadgeOf(section, id)?.dataset.project);
      // A plain badge: not the `passed` or `mastered` kinds, whose ✓ and ★ say something was achieved.
      expect(projectBadgeOf(section, id)?.dataset.kind, id).toBe('project');
    }
    expect(rowOf(section, 'song.none')?.dataset.projectState).toBeUndefined();
  });

  it('with no projects at all, no row wears a project badge', async () => {
    const section = await mount();
    expect(section.querySelectorAll('.badge[data-project]')).toHaveLength(0);
  });

  it('a project written while the list is up redraws the row’s badge; the row’s own tap opens the piece as it did', async () => {
    const section = await mount();
    expect(projectBadgeOf(section, 'song.none')).toBeNull();
    await applyProjectAction({ itemId: 'song.none', material: file('c') }, 'learn');
    await vi.waitFor(() => {
      expect(projectBadgeOf(section, 'song.none')?.textContent).toBe(PROJECT_TEXT.states.learning);
    });
    await applyProjectAction({ itemId: 'song.none', material: file('c') }, 'pause');
    await vi.waitFor(() => {
      expect(projectBadgeOf(section, 'song.none')?.textContent).toBe(PROJECT_TEXT.states.paused);
    });
    expect(section.querySelectorAll('.badge[data-project]')).toHaveLength(1);
    expect(navigateScore).not.toHaveBeenCalled();
    rowOf(section, 'song.none')?.click();
    expect(navigateScore).toHaveBeenCalledWith('song.none');
  });

  // Revised (G85a): the title called the door a question; the door is inside Details now, and the
  // row's actions are what this pins, unchanged.
  it('the row’s actions are the ones it had, a project or not: the door to the sheet is inside Details, never on the row (G85a; Entry 147)', async () => {
    await seed();
    const section = await mount();
    const actions = (id: string): string[] => [...(rowOf(section, id)?.querySelectorAll('.list-row__actions button') ?? [])].map((one) => one.textContent ?? '');
    for (const id of ['song.learning', 'song.paused', 'song.none', 'song.twin', 'exercise.five']) expect(actions(id), id).toEqual(['Details', '⋯']);
    expect(actions('import.mine')).toEqual(['Edit', 'Assign', 'Details', '⋯']);
    // The two rows G85a's fixtures add: no `⋯` where the modes mean nothing (a placeholder, a PDF).
    expect(actions('song.wanted')).toEqual(['Details']);
    expect(actions('import.pdf')).toEqual(['Edit', 'Assign', 'Details']);
    // Nothing the Library drew wrote a project: the seeded rows are the store's whole content.
    expect((await allProjects()).map((one) => one.itemId).sort()).toEqual(['exercise.five', 'import.mine', 'song.gone', 'song.learning', 'song.paused', 'song.twin.before']);
  });
});

describe('the Project filter (G85 item 3)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    resetProjectsForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('offers every piece, any project, and each state in the sheet’s words, beside the status filter', async () => {
    const section = await mount();
    const select = section.querySelector<HTMLSelectElement>('#library-project');
    expect(select?.getAttribute('aria-label')).toBe('Project');
    expect([...(select?.options ?? [])].map((option) => option.value)).toEqual(['all', 'any', ...PROJECT_STATES]);
    expect([...(select?.options ?? [])].map((option) => option.textContent)).toEqual([
      'Project or not',
      'Your projects',
      ...PROJECT_STATES.map((state) => PROJECT_TEXT.states[state]),
    ]);
    expect(select?.value).toBe('all');
    // Beside the status filter, in the same row of selects.
    expect(select?.previousElementSibling?.id).toBe('library-status-filter');
  });

  it('a state lists its pieces and hides the rest; any project lists every piece with one; the count line names it', async () => {
    await seed();
    const section = await mount();
    choose(section, 'learning');
    expect(shownIds(section)).toEqual(['song.learning']);
    expect(section.querySelector('#library-count')?.textContent).toContain(`· ${PROJECT_TEXT.states.learning}`);
    choose(section, 'any');
    expect(shownIds(section).sort()).toEqual(['import.mine', 'song.learning', 'song.paused', 'song.twin']);
    expect(section.querySelector('#library-count')?.textContent).toContain('· Your projects');
    choose(section, 'all');
    expect(shownIds(section)).toHaveLength(items.length);
  });

  it('a state with nothing in it empties the list with the sentence and the control, and Show everything clears it', async () => {
    await seed();
    const section = await mount();
    choose(section, 'retired');
    expect(shownIds(section)).toEqual([]);
    expect(section.querySelector('#library-empty')?.textContent).toContain(PROJECT_TEXT.states.retired);
    section.querySelector<HTMLButtonElement>('#library-show-everything')?.click();
    expect(section.querySelector<HTMLSelectElement>('#library-project')?.value).toBe('all');
    expect(shownIds(section)).toHaveLength(items.length);
  });

  it('a piece paused while Learning is chosen leaves the list, and one paused while Paused is chosen joins it', async () => {
    await seed();
    const section = await mount();
    choose(section, 'learning');
    expect(shownIds(section)).toEqual(['song.learning']);
    await applyProjectAction({ itemId: 'song.learning', material: file('a') }, 'pause');
    await vi.waitFor(() => {
      expect(shownIds(section)).toEqual([]);
    });
    choose(section, 'paused');
    expect(shownIds(section).sort()).toEqual(['song.learning', 'song.paused']);
  });
});

// --- the door (G85a) ------------------------------------------------------------------------------

/** Opens a row's Details, as a tap on its *Details* does; the sheet hangs from the body. */
function openDetails(section: HTMLElement, id: string): HTMLElement {
  const details = [...(rowOf(section, id)?.querySelectorAll<HTMLButtonElement>('.list-row__actions button') ?? [])].find((one) => one.textContent === 'Details');
  if (!details) throw new Error(`no Details on ${id}`);
  details.click();
  const sheet = document.getElementById('library-detail');
  if (!sheet) throw new Error(`no Details sheet for ${id}`);
  return sheet;
}
const doorIn = (sheet: HTMLElement): HTMLElement | null => sheet.querySelector<HTMLElement>('#library-detail-project');
const doorWords = (door: HTMLElement | null): [string, string] => [
  door?.querySelector('.list-row__title')?.textContent ?? '',
  door?.querySelector('.list-row__sub')?.textContent ?? '',
];
/** The sheet's state line, once its own read has answered with this. */
async function sheetSays(words: string): Promise<HTMLElement> {
  return vi.waitFor(() => {
    const sheet = document.getElementById('project-sheet');
    expect(sheet?.querySelector('#project-state')?.textContent).toBe(words);
    return sheet as HTMLElement;
  });
}
/** A project's state line in the sheet's words, from the store's own row for it. */
async function stateLineOf(itemId: string): Promise<string> {
  const stored = (await allProjects()).find((one) => one.itemId === itemId);
  if (!stored) throw new Error(`no project under ${itemId}`);
  return projectSince(stored.state, stored.since, dayKey);
}
const storeAsSeeded = async (): Promise<string> =>
  JSON.stringify((await allProjects()).map((one) => [one.id, one.itemId, one.state, one.history.length]).sort());

describe('the Details sheet is the door to the one project sheet (G85a)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
    resetProjectsForTest();
    navigateScore.mockClear();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('(a) a project: one door, the finish sheet’s words over the row’s state and since; tapped, Details closes and the one sheet opens on it', async () => {
    await seed();
    const section = await mount();
    const sheet = openDetails(section, 'song.learning');
    expect(sheet.querySelectorAll('#library-detail-project')).toHaveLength(1);
    const door = doorIn(sheet);
    const said = await stateLineOf('song.learning');
    expect(said.startsWith(`${PROJECT_TEXT.states.learning} since `)).toBe(true);
    expect(doorWords(door)).toEqual([PROJECT_TEXT.door, said]);
    // The same state the row's badge wears.
    expect(said.startsWith(`${projectBadgeOf(section, 'song.learning')?.textContent ?? '?'} since `)).toBe(true);
    // With the sheet's actions, directly above *Open*, which stays last and the only filled box.
    expect(door?.nextElementSibling?.id).toBe('library-detail-open');
    expect(sheet.querySelector('.sheet__body')?.lastElementChild?.id).toBe('library-detail-open');
    expect(sheet.querySelectorAll('.button--primary')).toHaveLength(1);
    door?.click();
    expect(document.getElementById('library-detail')).toBeNull();
    const opened = await sheetSays(said);
    expect(opened.dataset.item).toBe('song.learning');
    expect(document.querySelectorAll('#project-sheet')).toHaveLength(1);
    // The door opens a sheet; it does not open the piece.
    expect(navigateScore).not.toHaveBeenCalled();
  });

  it('(b) the same file under another id: the sheet finds that project, and an action there moves that one row; the Library’s badge follows', async () => {
    await seed();
    const section = await mount();
    const saved = await stateLineOf('song.twin.before');
    expect(saved.startsWith(`${PROJECT_TEXT.states.saved} since `)).toBe(true);
    expect(doorWords(doorIn(openDetails(section, 'song.twin')))).toEqual([PROJECT_TEXT.door, saved]);
    doorIn(document.getElementById('library-detail') as HTMLElement)?.click();
    const sheet = await sheetSays(saved);
    sheet.querySelector<HTMLButtonElement>('#project-action-learn')?.click();
    const learning = await vi.waitFor(async () => {
      const line = await stateLineOf('song.twin.before');
      expect(line.startsWith(`${PROJECT_TEXT.states.learning} since `)).toBe(true);
      return line;
    });
    await sheetSays(learning);
    // One row for file `d`, the one made under the old id, now Learning: no second project.
    const forD = (await allProjects()).filter((one) => one.material.kind === 'file' && one.material.sha256 === 'd'.repeat(64));
    expect(forD.map((one) => [one.itemId, one.state])).toEqual([['song.twin.before', 'learning']]);
    expect(await allProjects()).toHaveLength(6);
    // The listener's redraw, behind the sheet.
    await vi.waitFor(() => {
      expect(projectBadgeOf(section, 'song.twin')?.textContent).toBe(PROJECT_TEXT.states.learning);
    });
  });

  it('(c) the import’s project on its loaded bytes: the door and the sheet find it by its id', async () => {
    await seed();
    const section = await mount();
    const polishing = await stateLineOf('import.mine');
    expect(polishing.startsWith(`${PROJECT_TEXT.states.polishing} since `)).toBe(true);
    const door = doorIn(openDetails(section, 'import.mine'));
    expect(doorWords(door)).toEqual([PROJECT_TEXT.door, polishing]);
    door?.click();
    expect((await sheetSays(polishing)).dataset.item).toBe('import.mine');
  });

  it('(d) no project on a song that opens on the Score screen: the door says so, and the sheet opens on its four offers; opening wrote nothing', async () => {
    await seed();
    const section = await mount();
    const before = await storeAsSeeded();
    const door = doorIn(openDetails(section, 'song.none'));
    expect(doorWords(door)).toEqual([PROJECT_TEXT.door, PROJECT_TEXT.none]);
    door?.click();
    expect(document.getElementById('library-detail')).toBeNull();
    const sheet = await sheetSays(PROJECT_TEXT.none);
    expect(sheet.dataset.item).toBe('song.none');
    // Its own read and the history's line have answered: nothing played, nothing made.
    await vi.waitFor(() => {
      expect(sheet.querySelector('#project-met')?.textContent).toBe(PROJECT_TEXT.never);
    });
    expect([...sheet.querySelectorAll('#project-actions button')].map((one) => one.textContent)).toEqual(OFFERS.none.map((action) => PROJECT_TEXT.actions[action]));
    expect(await storeAsSeeded()).toBe(before);
    expect(projectBadgeOf(section, 'song.none')).toBeNull();
  });

  it('(e) no project and no honest offer: no door on a placeholder, a PDF, or an exercise with a row under its id', async () => {
    await seed();
    const section = await mount();
    for (const id of ['song.wanted', 'import.pdf', 'exercise.five']) {
      const sheet = openDetails(section, id);
      expect(doorIn(sheet), id).toBeNull();
      expect(sheet.textContent, id).not.toContain(PROJECT_TEXT.door);
      document.getElementById('library-detail-close')?.click();
      expect(document.getElementById('library-detail'), id).toBeNull();
    }
  });

  it('(e) a project that exists is shown whatever the item: a PDF’s door over its state, a placeholder’s at the end of its sheet', async () => {
    await applyProjectAction({ itemId: 'import.pdf', material: undefined }, 'save');
    await applyProjectAction({ itemId: 'song.wanted', material: undefined }, 'learn');
    const section = await mount();
    const pdf = doorIn(openDetails(section, 'import.pdf'));
    expect(doorWords(pdf)).toEqual([PROJECT_TEXT.door, await stateLineOf('import.pdf')]);
    expect(doorWords(pdf)[1].startsWith(`${PROJECT_TEXT.states.saved} since `)).toBe(true);
    document.getElementById('library-detail-close')?.click();
    const wanted = openDetails(section, 'song.wanted');
    const door = doorIn(wanted);
    expect(doorWords(door)).toEqual([PROJECT_TEXT.door, await stateLineOf('song.wanted')]);
    // A placeholder has no *Open*: the door goes after its import control, at the end of the sheet.
    expect(wanted.querySelector('#library-detail-open')).toBeNull();
    expect(wanted.querySelector('.sheet__body')?.lastElementChild).toBe(door);
  });
});

describe('the Library reads the store once and looks each row up in a map (G85 items 1, 4)', () => {
  // Extended (G85a item 4): one place opens the sheet, Details' door; the sheet's own read on open is
  // the sheet's, and the Library still reads the store once and moves no project.
  it('one read of the store, one identity rule, no per-row read, and no project moved here', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'ui', 'screens', 'LibraryScreen.ts'), 'utf8');
    expect(source.match(/allProjects\(/g), 'one place reads the store').toHaveLength(1);
    expect(source.match(/projectIn\(/g), 'one place applies the identity rule').toHaveLength(1);
    expect(source.match(/openProjectSheet\(/g), 'one place opens the one sheet').toHaveLength(1);
    expect(source).not.toMatch(/projectFor\(|applyProjectAction|setProjectNotes|addProjectSection|removeProjectSection/);
    expect(source).toMatch(/onProjectsChange\(/);
  });
});
