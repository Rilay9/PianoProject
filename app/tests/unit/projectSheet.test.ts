// @vitest-environment jsdom
/**
 * The project sheet (G1b item 5): the one place a learner states what they are doing with a piece.
 *
 * The piece's title; its state and since, or that it is not a project yet; the history's last line;
 * what the encounter history says of it (`encounterStore.familiarity`: "you last played it on …",
 * "you have never opened it"); the actions this state offers, each the learner's; and, once there is
 * a project, R18's three facts — this week's goal, the problem right now, the sections — as the
 * learner types them. Opening the sheet writes nothing. The real sheet, the real stores, a fake
 * IndexedDB; the catalogue stubbed.
 *
 * And *Reset progress* clears the projects with the rest of the learner's history (item 8).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Identity } from '../../src/review/record';

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });
const SONG = 'song.folk.hot-cross-buns';

function song(id: string, material: Identity): CatalogItem {
  return {
    id,
    type: 'song',
    title: 'Hot Cross Buns',
    level: 1,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    measurement: { status: 'measured', bars: 8 },
    provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: material },
  } as unknown as CatalogItem;
}
const ITEM = song(SONG, file('s'));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  const byId = new Map([[SONG, ITEM]]);
  return {
    ...original,
    catalogIndex: () => Promise.resolve({ items: [...byId.values()], byId }),
    allItems: () => Promise.resolve([...byId.values()]),
    loadCurriculum: () => Promise.reject(new Error('no curriculum in this test')),
  };
});

const { openProjectSheet } = await import('../../src/ui/projectSheet');
const { allProjects, applyProjectAction, resetProjectsForTest } = await import('../../src/data/projectStore');
const { recordRun, resetProgressForTest, dayKey } = await import('../../src/data/progressStore');
const { recordEncounter, resetEncountersForTest } = await import('../../src/data/encounterStore');
const { openDatabase } = await import('../../src/data/db');
const { RESET_STORES, resetPracticeHistory } = await import('../../src/ui/screens/SettingsScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const YESTERDAY = '2026-09-28T12:00:00.000Z';

function text(id: string): string {
  return document.getElementById(id)?.textContent ?? '';
}

function actions(): string[] {
  return [...document.querySelectorAll<HTMLElement>('#project-actions [data-action]')].map((node) => node.dataset.action ?? '');
}

function click(id: string): void {
  const control = document.getElementById(id);
  expect(control, `#${id} is not on the sheet`).not.toBeNull();
  (control as HTMLElement).click();
}

async function open(onChange = vi.fn()): Promise<ReturnType<typeof vi.fn>> {
  openProjectSheet({ item: ITEM, material: file('s'), bars: 8, onChange });
  await vi.waitFor(() => expect(text('project-met')).not.toMatch(/^$|Looking/));
  return onChange;
}

async function everyOtherStore(): Promise<Record<string, unknown>> {
  const db = await openDatabase();
  const out: Record<string, unknown> = {};
  for (const name of [...(db?.objectStoreNames ?? [])].filter((one) => one !== 'projects').sort()) {
    out[name] = await db?.getAll(name as never);
  }
  return out;
}

const run = {
  itemId: SONG,
  mode: 'tempo',
  tempoPct: 100,
  tempoMeasured: true,
  accuracy: 1,
  accuracyEstimated: false,
  wrongNotes: 0,
  missed: 0,
  durationMs: 60_000,
  passed: true,
  masterEligible: false,
  material: file('s'),
};

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  resetEncountersForTest();
  resetProjectsForTest();
  document.body.replaceChildren();
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('the sheet for a piece with no project', () => {
  it('names the piece, says it is no project yet, offers four ways in, says it was never opened, and writes nothing', async () => {
    await open();
    expect(document.querySelector('#project-sheet h2')?.textContent).toBe('Hot Cross Buns');
    expect(text('project-state')).toBe('Not a project yet');
    expect(actions()).toEqual(['save', 'learn', 'polish', 'keep']);
    expect([...document.querySelectorAll('#project-actions button')].map((node) => node.textContent)).toEqual([
      'Save for later',
      'Learn this',
      'Prepare it for performance',
      'Keep it playable',
    ]);
    expect(text('project-met')).toBe('You have never opened it.');
    expect(document.getElementById('project-notes')?.hidden ?? true, 'notes before any project').toBe(true);
    expect(document.getElementById('project-history')?.hidden).toBe(true);
    expect(await allProjects()).toEqual([]);
    // No internal identifiers on the sheet.
    expect(document.getElementById('project-sheet')?.textContent).not.toContain(SONG);
  });

  it('what the history says of it: played, listened to, opened', async () => {
    await recordEncounter({ kind: 'viewed', itemId: SONG, material: file('s'), source: { tab: 'library' }, visit: 'v1', at: new Date(YESTERDAY) });
    await open();
    expect(text('project-met')).toBe('You have opened it and not played it yet.');
    document.body.replaceChildren();
    await recordEncounter({ kind: 'heard', itemId: SONG, material: file('s'), source: { tab: 'library' }, visit: 'v2', at: new Date(YESTERDAY) });
    await open();
    expect(text('project-met')).toBe('You have listened to it and not played it yet.');
    document.body.replaceChildren();
    await recordRun(run, new Date(YESTERDAY));
    await open();
    expect(text('project-met')).toBe(`You last played it on ${dayKey(new Date(YESTERDAY))}.`);
  });
});

describe('the learner’s actions on the sheet', () => {
  it('Learn this makes the project, and the sheet then says so, offers learning’s actions and the notes', async () => {
    const onChange = await open();
    click('project-action-learn');
    await vi.waitFor(async () => expect((await allProjects()).map((row) => row.state)).toEqual(['learning']));
    await vi.waitFor(() => expect(text('project-state')).toBe(`Learning since ${dayKey(new Date())}`));
    expect(actions()).toEqual(['polish', 'performed', 'keep', 'pause', 'retire']);
    expect(document.getElementById('project-notes')?.hidden).toBe(false);
    expect(onChange).toHaveBeenCalled();
    const [row] = await allProjects();
    expect(row).toMatchObject({ itemId: SONG, material: file('s'), history: [{ state: 'learning', why: 'learn' }] });
  });

  it('Put it away, then Bring it back: the history line says what it came from; the encounter line still says played', async () => {
    await recordRun(run, new Date(YESTERDAY));
    await open();
    click('project-action-learn');
    await vi.waitFor(() => expect(actions()).toContain('retire'));
    click('project-action-retire');
    await vi.waitFor(() => expect(text('project-state')).toMatch(/^Put away since /));
    expect(actions()).toEqual(['bring-back']);
    click('project-action-bring-back');
    await vi.waitFor(() => expect(text('project-state')).toMatch(/^Bringing it back since /));
    const today = dayKey(new Date());
    expect(text('project-history')).toBe(`Before this: Put away, from ${today}.`);
    expect(text('project-met')).toBe(`You last played it on ${dayKey(new Date(YESTERDAY))}.`);
    const [row] = await allProjects();
    expect(row?.history.map((step) => step.state)).toEqual(['learning', 'retired', 'refreshing']);
  });

  it('I performed it, with the learner’s date: kept playable, the date on the history line, and nothing written but the project', async () => {
    await recordRun(run, new Date(YESTERDAY));
    await applyProjectAction({ itemId: SONG, material: file('s') }, 'learn', { at: new Date(YESTERDAY) });
    const stores = await everyOtherStore();
    await open();
    const date = document.getElementById('project-performed-on') as HTMLInputElement;
    expect(date.type).toBe('date');
    date.value = '2026-09-27';
    click('project-action-performed');
    await vi.waitFor(() => expect(text('project-state')).toMatch(/^Keeping it playable since /));
    expect(text('project-history')).toBe('You performed it on 2026-09-27.');
    expect(await everyOtherStore()).toEqual(stores);
  });

  it('the notes: the words typed are kept; a section outside the piece is refused in words and stores nothing', async () => {
    await applyProjectAction({ itemId: SONG, material: file('s') }, 'learn', { at: new Date(YESTERDAY) });
    await open();
    const goal = document.getElementById('project-goal') as HTMLInputElement;
    goal.value = 'Hands together to bar 4';
    goal.dispatchEvent(new Event('change'));
    const problem = document.getElementById('project-problem') as HTMLInputElement;
    problem.value = 'The jump in bar 3';
    problem.dispatchEvent(new Event('change'));
    await vi.waitFor(async () => expect((await allProjects())[0]).toMatchObject({ goal: 'Hands together to bar 4', problem: 'The jump in bar 3' }));

    const set = (id: string, value: string): void => {
      (document.getElementById(id) as HTMLInputElement).value = value;
    };
    set('project-section-from', '1');
    set('project-section-to', '4');
    set('project-section-label', 'The tune');
    click('project-section-add');
    await vi.waitFor(async () => expect((await allProjects())[0]?.sections).toEqual([{ from: 1, to: 4, label: 'The tune' }]));
    await vi.waitFor(() => expect(document.querySelectorAll('#project-sections [data-section]')).toHaveLength(1));
    set('project-section-from', '7');
    set('project-section-to', '12');
    set('project-section-label', 'Past the end');
    click('project-section-add');
    await vi.waitFor(() => expect(text('project-section-status')).toBe('Bars run from 1 to 8.'));
    expect((await allProjects())[0]?.sections).toHaveLength(1);
  });
});

/**
 * Every rule of the app's stylesheet as written: its selectors and its declarations in order, comments
 * stripped. A rule inside an at-rule is read as its own rule (the sheet's rules sit at the top level).
 */
function stylesheetRules(): { selectors: string[]; declarations: [string, string][] }[] {
  const css = readFileSync(join(process.cwd(), 'src', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, head = '', body = '']) => ({
    selectors: head.split(',').map((one) => one.trim().replace(/\s+/g, ' ')).filter(Boolean),
    declarations: body
      .split(';')
      .map((one) => one.trim())
      .filter((one) => one.includes(':'))
      .map((one) => [one.slice(0, one.indexOf(':')).trim(), one.slice(one.indexOf(':') + 1).trim().replace(/\s+/g, ' ')] as [string, string]),
  }));
}

/** What the stylesheet's rules that reach `node` declare, the later rule winning (specificity aside). */
function declaredFor(node: Element): Map<string, string> {
  const reaches = (selector: string): boolean => {
    try {
      return node.matches(selector);
    } catch {
      return false; // a selector the test's DOM cannot match (a pseudo-element, `:has`) reaches nothing here
    }
  };
  const out = new Map<string, string>();
  for (const rule of stylesheetRules()) if (rule.selectors.some(reaches)) for (const [property, value] of rule.declarations) out.set(property, value);
  return out;
}

describe('the date box beside I performed it wears the sheet’s input look (G87; G1b’s follow-up 6)', () => {
  // The sheet's rule named text and number boxes only, so the date box was the browser's own
  // control, the one raw box among the sheet's styled ones. The face itself (the browser draws a
  // date box in its own monospace) is the browser case's to measure: this DOM computes no fonts.
  it('a rule of the stylesheet reaches the date box and gives it the box, border, radius and type size of the sheet’s text box, and a face', async () => {
    await applyProjectAction({ itemId: SONG, material: file('s') }, 'learn', { at: new Date(YESTERDAY) });
    await open();
    const date = document.getElementById('project-performed-on') as HTMLInputElement;
    // Still the browser's own date control: its picker, today's date, and no day after today.
    expect(date.type).toBe('date');
    expect(date.value).toBe(dayKey(new Date()));
    expect(date.max).toBe(dayKey(new Date()));
    expect(date.closest('.sheet__body'), 'the date box is not in the sheet’s body').not.toBeNull();

    const dated = declaredFor(date);
    expect([...dated.keys()].filter((property) => property !== 'box-sizing'), 'no rule in style.css reaches the date box').not.toEqual([]);
    const text = declaredFor(document.getElementById('project-goal') as HTMLElement);
    for (const property of ['min-height', 'padding', 'border', 'border-radius', 'background', 'color', 'font-size']) {
      expect(dated.get(property), `the date box's ${property}`).toBe(text.get(property));
      expect(dated.get(property), `the sheet's text box declares no ${property}`).toBeDefined();
    }
    expect(dated.has('font') || dated.has('font-family'), 'the date box keeps the browser’s monospace face').toBe(true);
  });
});

describe('the sheet belongs to the screen that opened it', () => {
  // Found in the pictures (G1b's product look): opened from the finish sheet, the sheet stayed over
  // Progress and over a lesson page after the route changed, on top of a screen that never opened it.
  it('leaving that screen closes the sheet', async () => {
    const owner = document.createElement('section');
    document.body.append(owner);
    openProjectSheet({ item: ITEM, material: file('s'), bars: 8, owner });
    expect(document.getElementById('project-sheet')).not.toBeNull();
    disposeScreen(owner);
    expect(document.getElementById('project-sheet'), 'the sheet outlived the screen that opened it').toBeNull();
    expect(await allProjects()).toEqual([]);
  });
});

describe('Reset progress clears the projects with the rest of the learner’s history (item 8)', () => {
  it('the store is on the reset’s list, and the reset leaves it empty', async () => {
    expect(RESET_STORES).toEqual(expect.arrayContaining(['progress', 'sessions', 'encounters', 'contacts', 'projects']));
    await recordRun(run, new Date(YESTERDAY));
    await applyProjectAction({ itemId: SONG, material: file('s') }, 'learn', { at: new Date(YESTERDAY) });
    await resetPracticeHistory();
    const db = await openDatabase();
    expect(await db?.getAll('projects')).toEqual([]);
    expect(await db?.getAll('sessions')).toEqual([]);
    expect(await allProjects()).toEqual([]);
  });
});
