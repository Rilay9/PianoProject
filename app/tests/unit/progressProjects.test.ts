// @vitest-environment jsdom
/**
 * Progress lists the learner's projects (G1b item 6), the project sheet's second door.
 *
 * Under one heading, newest change first: the piece's title, its state and since, and the goal
 * where the learner typed one; a row opens the piece's sheet. A piece passed or mastered with no
 * project offers *Make it a project* — the learner's action, never automatic: the offer opens the
 * sheet and makes nothing until an action on it is chosen. Nothing else on Progress changes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import type { Identity } from '../../src/review/record';

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });

const TITLES: Record<string, string> = {
  'song.ballade': 'Ballade No. 1',
  'song.minuet': 'Minuet in G',
  'song.lamb': 'Mary Had a Little Lamb',
  'song.passed': 'Ode to Joy',
  'song.started': 'Twinkle',
  'exercise.scale.c': 'C major scale',
};
const ITEMS = Object.keys(TITLES).map(
  (id, index) =>
    ({
      id,
      type: id.startsWith('song') ? 'song' : 'exercise',
      title: TITLES[id],
      level: 2,
      tracks: ['core'],
      concepts: [],
      tags: [],
      file: `scores/${id}.mxl`,
      provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: file(String.fromCharCode(97 + index)) },
    }) as unknown as CatalogItem,
);
const BY_ID = new Map(ITEMS.map((item) => [item.id, item]));
const materialOf = (id: string): Identity => BY_ID.get(id)?.provenance?.identity as Identity;

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    allItems: () => Promise.resolve(ITEMS),
    catalogIndex: () => Promise.resolve({ items: ITEMS, byId: BY_ID }),
    loadCurriculum: () => Promise.reject(new Error('no curriculum in this test')),
  };
});

const { ProgressScreen } = await import('../../src/ui/screens/ProgressScreen');
const { allProjects, applyProjectAction, setProjectNotes, resetProjectsForTest } = await import('../../src/data/projectStore');
const { recordRun, resetProgressForTest, dayKey } = await import('../../src/data/progressStore');
const { resetEncountersForTest } = await import('../../src/data/encounterStore');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

const router = { navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  document.body.replaceChildren();
  const section = ProgressScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => expect(section.querySelector('#progress-projects[data-drawn="true"]')).not.toBeNull());
  return section;
}

/** A project's row: the title, the state and since (the second line), the goal where typed (the third). */
function projectRows(section: HTMLElement): { title: string; state: string; goal: string | undefined; item: string | undefined }[] {
  return [...section.querySelectorAll<HTMLElement>('#progress-projects [data-project]')].map((row) => ({
    title: row.querySelector('.list-row__title')?.textContent ?? '',
    state: row.querySelector('.list-row__sub')?.textContent ?? '',
    goal: row.querySelector('.list-row__metatext')?.textContent ?? undefined,
    item: row.dataset.item,
  }));
}

function offers(section: HTMLElement): string[] {
  return [...section.querySelectorAll<HTMLElement>('#progress-projects [data-offer]')].map((row) => row.dataset.item ?? '');
}

function run(itemId: string, passed: boolean): Parameters<typeof recordRun>[0] {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: passed ? 1 : 0.4,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    passed,
    masterEligible: false,
    material: materialOf(itemId),
  };
}

const at = (iso: string): { at: Date } => ({ at: new Date(iso) });

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  resetEncountersForTest();
  resetProjectsForTest();
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('Projects on Progress', () => {
  it('lists every project under one heading, newest change first: title, state, since, and the goal where one is typed', async () => {
    const minuet = await applyProjectAction({ itemId: 'song.minuet', material: materialOf('song.minuet') }, 'learn', at('2026-09-20T12:00:00.000Z'));
    await setProjectNotes(minuet.id, { goal: 'Hands together to bar 16' });
    await applyProjectAction({ itemId: 'song.lamb', material: materialOf('song.lamb') }, 'save', at('2026-09-25T12:00:00.000Z'));
    await applyProjectAction({ itemId: 'song.ballade', material: materialOf('song.ballade') }, 'polish', at('2026-09-28T12:00:00.000Z'));
    const section = await mount();
    expect(section.querySelector('#progress-projects')?.closest('section')?.querySelector('h2')?.textContent).toBe('Projects');
    expect(projectRows(section)).toEqual([
      { title: 'Ballade No. 1', state: `Preparing for performance since ${dayKey(new Date('2026-09-28T12:00:00.000Z'))}`, goal: undefined, item: 'song.ballade' },
      { title: 'Mary Had a Little Lamb', state: `Saved for later since ${dayKey(new Date('2026-09-25T12:00:00.000Z'))}`, goal: undefined, item: 'song.lamb' },
      { title: 'Minuet in G', state: `Learning since ${dayKey(new Date('2026-09-20T12:00:00.000Z'))}`, goal: 'Goal: Hands together to bar 16', item: 'song.minuet' },
    ]);
    // No internal identifiers on the screen: the ids are in data- attributes.
    expect(section.querySelector('#progress-projects')?.textContent).not.toMatch(/song\.|file:/);
  });

  it('a passed piece with no project offers Make it a project; a piece with one, a piece only started and an exercise do not', async () => {
    await recordRun(run('song.passed', true));
    await recordRun(run('song.started', false));
    await recordRun(run('song.minuet', true));
    await recordRun(run('exercise.scale.c', true));
    await applyProjectAction({ itemId: 'song.minuet', material: materialOf('song.minuet') }, 'keep', at('2026-09-28T12:00:00.000Z'));
    const section = await mount();
    expect(offers(section)).toEqual(['song.passed']);
    const offer = section.querySelector<HTMLElement>('#progress-projects [data-offer] button');
    expect(offer?.textContent).toBe('Make it a project');
  });

  it('the offer is the learner’s: it opens the sheet and makes nothing until an action is chosen', async () => {
    await recordRun(run('song.passed', true));
    const section = await mount();
    section.querySelector<HTMLElement>('#progress-projects [data-offer] button')?.click();
    await vi.waitFor(() => expect(document.querySelector('#project-sheet')).not.toBeNull());
    expect(document.getElementById('project-state')?.textContent).toBe('Not a project yet');
    expect(await allProjects()).toEqual([]);
    (document.getElementById('project-action-keep') as HTMLElement).click();
    await vi.waitFor(async () => expect((await allProjects()).map((row) => [row.itemId, row.state])).toEqual([['song.passed', 'maintaining']]));
    await vi.waitFor(() => expect(projectRows(section).map((row) => row.item)).toEqual(['song.passed']));
    expect(offers(section)).toEqual([]);
  });

  it('a project’s row opens its sheet', async () => {
    await applyProjectAction({ itemId: 'song.lamb', material: materialOf('song.lamb') }, 'learn', at('2026-09-25T12:00:00.000Z'));
    const section = await mount();
    section.querySelector<HTMLElement>('#progress-projects [data-project]')?.click();
    await vi.waitFor(() => expect(document.getElementById('project-state')?.textContent).toMatch(/^Learning since /));
    expect(document.querySelector('#project-sheet h2')?.textContent).toBe('Mary Had a Little Lamb');
    // Leaving Progress takes the sheet with it.
    disposeScreen(section);
    expect(document.querySelector('#project-sheet'), 'the sheet outlived Progress').toBeNull();
  });

  it('with no project and nothing passed, one sentence says how a project is made', async () => {
    const section = await mount();
    expect(section.querySelector('#progress-projects')?.textContent).toContain('What next with this piece?');
    expect(projectRows(section)).toEqual([]);
  });
});
