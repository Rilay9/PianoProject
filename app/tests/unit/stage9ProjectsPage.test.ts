// @vitest-environment jsdom
/**
 * Stage 9's page shows projects, never a rung to pass (G1b item 7; L86; the reviewer's ruling 2).
 *
 * Stage 9 says of itself "Nothing here is a rung to pass", yet its units carry ordinary `runs`
 * requirements, and until G1b the lesson page counted them: *What the app counts — 1 of 2*, a state
 * badge that could read *complete*, and *Mark done*. The page now reads the projects store for a
 * unit whose stage is 9: each song option with the learner's project state, or *not started*, the
 * sentence "A project: there is no rung to pass here.", and no count or completion. The
 * requirements stay in the data (F's), and the rung state reads them as before — the page stops
 * presenting them; nothing else changes. The acceptance the reviewer set, case by case: the page
 * shows a project state or *not started*; no "x of y met" or completion claim; changing one
 * project's state changes only that project's presentation; the same action changes no rung state,
 * evidence, eligibility or skill state.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem, Lesson } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import type { Identity } from '../../src/review/record';
import type { ProjectRow } from '../../src/data/projectStore';

const file = (c: string): Identity => ({ kind: 'file', sha256: c.repeat(64) });

const { curriculum } = vi.hoisted(() => {
  const rung = (id: string, extra: Partial<Lesson>): Lesson => ({
    id,
    title: id === '1.1' ? 'Right hand C position' : 'Choosing one piece and staying with it',
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [`exercise.${id}`],
    songOptions: [`song.${id}`],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [
      { kind: 'runs', from: 'exercises', count: 1 },
      { kind: 'runs', from: 'songs', count: 1 },
    ],
    ...extra,
  });
  return {
    curriculum: {
      version: 1,
      tracks: [{ id: 'classical', title: 'Classical' }],
      stages: [
        { number: 1, title: 'One', units: [{ id: 'u1', track: 'core', lessons: [rung('1.1', {})] }] },
        {
          number: 9,
          title: 'Projects',
          units: [
            {
              id: 'classical.9.1',
              title: 'Classical: the long pieces',
              track: 'classical',
              lessons: [rung('classical.9', { songOptions: ['song.ballade', 'song.campanella', 'song.impromptu'], exerciseOptions: ['exercise.classical.9'] })],
            },
          ],
        },
      ],
    },
  };
});

const MATERIAL: Record<string, Identity> = {
  'song.ballade': file('b'),
  'song.campanella': file('c'),
  'song.impromptu': file('i'),
  'song.1.1': file('1'),
  'exercise.1.1': file('e'),
  'exercise.classical.9': file('x'),
};
const ITEMS = Object.keys(MATERIAL).map(
  (id) =>
    ({
      id,
      type: id.startsWith('song') ? 'song' : 'exercise',
      title: `Title of ${id.split('.').at(-1) ?? id}`,
      level: 8,
      tracks: ['classical'],
      concepts: [],
      tags: [],
      file: `scores/${id}.mxl`,
      provenance: { source: 'pdmx', facts: {}, review: { score: null, teaching: null }, identity: MATERIAL[id] },
    }) as unknown as CatalogItem,
);

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    loadCurriculum: () => Promise.resolve(curriculum),
    allItems: () => Promise.resolve(ITEMS),
    fetchMarkdown: () => Promise.reject(new Error('no lesson text in this fixture')),
  };
});

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');
const { recordRun, resetProgressForTest, rungRows } = await import('../../src/data/progressStore');
const { resetPlanForTest } = await import('../../src/data/planStore');
const { applyProjectAction, resetProjectsForTest } = await import('../../src/data/projectStore');
const { loadRungStates } = await import('../../src/data/rungStates');
const { skillLadders } = await import('../../src/evidence/rungState');
const { VOCABULARY_V0 } = await import('../../src/evidence/vocabulary');
const { admittedForTeaching } = await import('../../src/curriculum/eligibility');
const { openDatabase } = await import('../../src/data/db');
const { PROJECT_TEXT } = await import('../../src/ui/help');

const router = { navigate: vi.fn(), navigateLesson: vi.fn(), navigateScore: vi.fn() };

async function mount(lessonId: string): Promise<HTMLElement> {
  document.body.replaceChildren();
  const section = LessonScreen(router as unknown as Router, lessonId);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.lesson).toBe(lessonId);
    expect(section.querySelector('#lesson-songs .list-row')).not.toBeNull();
  });
  return section;
}

function songRow(section: HTMLElement, id: string): HTMLElement {
  const row = section.querySelector<HTMLElement>(`#lesson-songs [data-item="${id}"]`);
  expect(row, `${id} has no row`).not.toBeNull();
  return row as HTMLElement;
}

function stateOf(section: HTMLElement, id: string): { word: string; state: string | undefined } {
  const row = songRow(section, id);
  return { word: row.querySelector('.badge')?.textContent ?? '', state: row.dataset.projectState };
}

/** What a stage-9 page must never say: a count of requirements, or that a rung is complete or in progress. */
function rungClaims(section: HTMLElement): string[] {
  const said = section.textContent ?? '';
  return [/What the app counts/, /\b\d+ of \d+\b/, /\bcomplete\b/, /\bin progress\b/, /marked done/].filter((pattern) => pattern.test(said)).map(String);
}

function run(itemId: string, lessonId: string): Parameters<typeof recordRun>[0] {
  return {
    itemId,
    lessonId,
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
    material: MATERIAL[itemId],
  };
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  resetPlanForTest();
  resetProjectsForTest();
});
afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('a Stage 9 unit’s page', () => {
  it('shows each song option as a project — not started — says there is no rung to pass, and counts nothing', async () => {
    const section = await mount('classical.9');
    expect(section.querySelector('#lesson-project')?.textContent).toBe('A project: there is no rung to pass here.');
    for (const id of ['song.ballade', 'song.campanella', 'song.impromptu']) expect(stateOf(section, id)).toEqual({ word: 'not started', state: 'none' });
    expect(rungClaims(section)).toEqual([]);
    expect(section.querySelector('#lesson-counts')?.hasAttribute('hidden')).toBe(true);
    // The learner's word about a rung has no place on a page that says there is no rung to pass.
    expect(section.querySelector('#lesson-done')).toBeNull();
    expect(section.querySelector('#lesson-know')).toBeNull();
  });

  it('runs that meet the unit’s requirements change nothing there: the page reads projects, not runs', async () => {
    await recordRun(run('song.ballade', 'classical.9'));
    await recordRun(run('exercise.classical.9', 'classical.9'));
    // The rung state reads the requirements as it always did (item 7: unchanged, never shown here).
    expect((await loadRungStates(curriculum as never)).byRung.get('classical.9')?.status).toBe('met');
    const section = await mount('classical.9');
    expect(rungClaims(section)).toEqual([]);
    expect(stateOf(section, 'song.ballade')).toEqual({ word: 'not started', state: 'none' });
  });

  it('changing one project’s state changes only that project’s row, and no rung state, evidence, eligibility or skill state', async () => {
    await recordRun(run('song.campanella', 'classical.9'));
    const read = async (): Promise<unknown> => {
      const rows = await rungRows();
      return {
        rungs: [...(await loadRungStates(curriculum as never)).byRung.entries()],
        skills: [...skillLadders(rows, VOCABULARY_V0, new Date('2026-09-29T19:00:00.000Z')).entries()],
        evidence: rows.map((row) => row.evidence ?? null),
        admitted: ITEMS.map((item) => admittedForTeaching(item)),
        stores: await (async () => {
          const db = await openDatabase();
          const out: Record<string, unknown> = {};
          for (const name of [...(db?.objectStoreNames ?? [])].filter((one) => one !== 'projects').sort()) out[name] = await db?.getAll(name as never);
          return out;
        })(),
      };
    };
    const before = await read();
    const first = await mount('classical.9');
    const rowsBefore = ['song.campanella', 'song.impromptu'].map((id) => songRow(first, id).outerHTML);

    await applyProjectAction({ itemId: 'song.ballade', material: file('b') }, 'learn', { at: new Date('2026-09-29T12:00:00.000Z') });
    const second = await mount('classical.9');
    expect(stateOf(second, 'song.ballade')).toEqual({ word: 'Learning', state: 'learning' });
    expect(['song.campanella', 'song.impromptu'].map((id) => songRow(second, id).outerHTML)).toEqual(rowsBefore);
    expect(rungClaims(second)).toEqual([]);
    resetProgressForTest();
    expect(await read()).toEqual(before);

    await applyProjectAction({ itemId: 'song.ballade', material: file('b') }, 'retire', { at: new Date('2026-09-29T13:00:00.000Z') });
    expect(stateOf(await mount('classical.9'), 'song.ballade')).toEqual({ word: 'Put away', state: 'retired' });
  });

  // G87 (G1b's follow-up 3): the page says there is no rung to pass, and the Start line under it
  // said *Opens "X", the first thing on this rung.* — a sentence contradicting the one above it.
  // A project stage's line names what Start opens and no more, read through the same
  // `PROJECT_STAGES` the page's other presentation reads.
  it('its Start line names what Start opens and no more — never “the first thing on this rung”', async () => {
    const section = await mount('classical.9');
    expect(section.querySelector('#lesson-start'), 'Start is drawn on the project page').not.toBeNull();
    // The fixture's first option is the one Start opens, the case that drew the long line.
    expect(section.querySelector('#lesson-start-what')?.textContent).toBe('Opens “Title of 9”.');
    expect(section.textContent).not.toContain('the first thing on this rung');
  });

  // G87 item 3 (found by G85's builder; the reviewer's Library ruling: a project badge is a stated
  // intention, never a pass). The row's badge was drawn in the `passed` style, whose tick made a
  // paused or put-away piece read "✓ Paused": an achievement mark on a plan. Every project state
  // now wears the neutral style, as *not started* already did.
  it('a paused project’s badge says Paused with no tick: the neutral style, never the pass style', async () => {
    await applyProjectAction({ itemId: 'song.ballade', material: file('b') }, 'learn', { at: new Date('2026-09-29T12:00:00.000Z') });
    await applyProjectAction({ itemId: 'song.ballade', material: file('b') }, 'pause', { at: new Date('2026-09-29T13:00:00.000Z') });
    const mark = songRow(await mount('classical.9'), 'song.ballade').querySelector<HTMLElement>('.badge');
    expect({ word: mark?.textContent, kind: mark?.dataset.kind }).toEqual({ word: 'Paused', kind: 'neutral' });
  });

  it('no project state wears the tick: each is its words in the neutral style, as not started is', async () => {
    const db = await openDatabase();
    const at = '2026-09-29T12:00:00.000Z';
    const said: unknown[] = [];
    for (const state of Object.keys(PROJECT_TEXT.states) as ProjectRow['state'][]) {
      // The Ballade's project as the sheet keys it (`material.materialKey`), in each state in turn.
      const row: ProjectRow = { id: `file:${'b'.repeat(64)}`, material: { kind: 'file', sha256: 'b'.repeat(64) }, itemId: 'song.ballade', state, since: at, history: [{ state, at, why: 'learn' }] };
      await db?.put('projects', row);
      const mark = songRow(await mount('classical.9'), 'song.ballade').querySelector<HTMLElement>('.badge');
      said.push({ state, word: mark?.textContent, kind: mark?.dataset.kind });
    }
    expect(said).toEqual(Object.entries(PROJECT_TEXT.states).map(([state, word]) => ({ state, word, kind: 'neutral' })));
    const untouched = songRow(await mount('classical.9'), 'song.campanella').querySelector<HTMLElement>('.badge');
    expect({ word: untouched?.textContent, kind: untouched?.dataset.kind }).toEqual({ word: 'not started', kind: 'neutral' });
  });
});

describe('an ordinary rung’s page is as it was', () => {
  it('its state, its count and its learner’s-word buttons, and no project sentence', async () => {
    const section = await mount('1.1');
    expect(section.querySelector('#lesson-state')?.textContent).toContain('not started');
    expect(section.querySelector('#lesson-counts summary')?.textContent).toBe('What the app counts — 0 of 2');
    expect(section.querySelector('#lesson-done')).not.toBeNull();
    expect(section.querySelector('#lesson-know')).not.toBeNull();
    expect(section.querySelector<HTMLElement>('#lesson-project')?.hidden ?? true, 'the project sentence on an ordinary rung').toBe(true);
    expect(songRow(section, 'song.1.1').dataset.projectState).toBeUndefined();
  });

  it('its Start line still calls its first option the first thing on this rung (G87: every other stage unchanged)', async () => {
    const section = await mount('1.1');
    expect(section.querySelector('#lesson-start-what')?.textContent).toBe('Opens “Title of 1”, the first thing on this rung.');
  });
});
