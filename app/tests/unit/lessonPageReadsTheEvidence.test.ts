// @vitest-environment jsdom
/**
 * The lesson page says what the evidence says (C5 item 6; T2, T26).
 *
 * Its state badge, and its list *What the app counts*, are read from the
 * derived rung state (`rungState`) — not from the items marked passed, which
 * is what the page counted until C5 — and it says where a run has to be opened
 * from to count. "I already know this" and *Mark done* record the learner's
 * word about the rung, shown apart, and mark no item passed. The lock line
 * names the rung, never its id. The real screen, a real (fake) IndexedDB, the
 * real store; a small curriculum.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem, Lesson } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const { curriculum } = vi.hoisted(() => {
  const rung = (id: string, extra: Partial<Lesson>): Lesson => ({
    id,
    title: id === '1.1' ? 'Right hand C position' : 'Half notes and rests',
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
      tracks: [],
      stages: [
        {
          number: 1,
          title: 'One',
          units: [
            {
              id: 'u1',
              track: 'core',
              lessons: [
                rung('1.1', {}),
                rung('1.2', {
                  prerequisites: ['1.1'],
                  requirements: [
                    { kind: 'runs', from: 'exercises', count: 1 },
                    { kind: 'unjudged', rule: 'dynamics-contrast>=1.6', says: 'Loud and soft clearly different.', why: 'not measured' },
                  ],
                }),
              ],
            },
          ],
        },
      ],
    },
  };
});

const ITEMS = ['exercise.1.1', 'song.1.1', 'exercise.1.2', 'song.1.2'].map(
  (id) =>
    ({
      id,
      type: id.startsWith('song') ? 'song' : 'exercise',
      title: `Title of ${id}`,
      level: 1,
      tracks: ['core'],
      concepts: [],
      tags: [],
      file: `scores/${id}.mxl`,
    }) as unknown as CatalogItem,
);

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(curriculum),
  allItems: () => Promise.resolve(ITEMS),
  fetchMarkdown: () => Promise.reject(new Error('no lesson text in this fixture')),
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');
const { recordRun, resetProgressForTest, allProgress } = await import('../../src/data/progressStore');
const { resetPlanForTest, getPlan } = await import('../../src/data/planStore');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

let router: { navigate: ReturnType<typeof vi.fn>; navigateLesson: ReturnType<typeof vi.fn> };

async function mount(lessonId: string): Promise<HTMLElement> {
  const section = LessonScreen(router as unknown as Router, lessonId);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#lesson-state')).not.toBeNull();
    expect(section.querySelector('#lesson-counts')).not.toBeNull();
  });
  return section;
}

function run(itemId: string, lessonId: string | undefined): Parameters<typeof recordRun>[0] {
  return {
    itemId,
    ...(lessonId === undefined ? {} : { lessonId }),
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
  };
}

beforeEach(() => {
  useFakeIndexedDb();
  resetProgressForTest();
  resetPlanForTest();
  router = { navigate: vi.fn(), navigateLesson: vi.fn() };
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({ strictPrerequisites: DEFAULT_SETTINGS.strictPrerequisites });
  clearFakeIndexedDb();
});

describe('the state and the list come from the evidence', () => {
  it('a run judged by the rung is counted by name; a run from nowhere is not', async () => {
    await recordRun(run('exercise.1.1', '1.1'), new Date('2026-10-01T10:00:00Z'));
    await recordRun(run('song.1.1', undefined), new Date('2026-10-01T10:05:00Z'));
    const section = await mount('1.1');
    expect(section.querySelector('#lesson-state')?.textContent).toContain('in progress');
    const lines = [...section.querySelectorAll('#lesson-counts li')].map((li) => li.textContent ?? '');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('One exercise from this page at 90 % of the notes, in Keep tempo at 80 % of the written tempo or faster.');
    expect(lines[0]).toContain('counted: Title of exercise.1.1');
    expect(lines[1]).toContain('not yet');
    expect(section.querySelector('#lesson-counts')?.textContent).toContain('open it from this page');
  });

  it('complete once every requirement the app judges holds', async () => {
    await recordRun(run('exercise.1.1', '1.1'), new Date('2026-10-01T10:00:00Z'));
    await recordRun(run('song.1.1', '1.1'), new Date('2026-10-01T10:05:00Z'));
    const section = await mount('1.1');
    expect(section.querySelector('#lesson-state')?.textContent).toContain('complete');
  });

  it('prints the lesson’s rule the app cannot judge as the lesson’s, and never counts it', async () => {
    await recordRun(run('exercise.1.2', '1.2'), new Date('2026-10-01T10:00:00Z'));
    const section = await mount('1.2');
    const lines = [...section.querySelectorAll('#lesson-counts li')].map((li) => li.textContent ?? '');
    expect(lines[1]).toContain('Not judged by the app — the lesson’s rule: Loud and soft clearly different.');
    expect(section.querySelector('#lesson-state')?.textContent).toContain('complete');
  });
});

describe('the learner’s word', () => {
  it('"I already know this" is kept about the rung, apart, and marks no item passed', async () => {
    const section = await mount('1.1');
    section.querySelector<HTMLButtonElement>('#lesson-know')?.click();
    await vi.waitFor(() => expect(section.querySelector('#lesson-state')?.textContent).toContain('you said you know it'));
    expect((await getPlan()).rungWords?.['1.1']?.kind).toBe('known');
    const passed = (await allProgress()).filter((row) => row.status === 'passed' || row.status === 'mastered');
    expect(passed.map((row) => row.itemId), 'the word marked the rung’s items passed').toEqual([]);
  });

  it('Mark done too', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const section = await mount('1.2');
    section.querySelector<HTMLButtonElement>('#lesson-done')?.click();
    await vi.waitFor(() => expect(section.querySelector('#lesson-state')?.textContent).toContain('marked done'));
    expect((await getPlan()).rungWords?.['1.2']?.kind).toBe('done');
    expect(await allProgress()).toEqual([]);
  });
});

describe('the lock line (T26)', () => {
  it('names the rung that usually comes first, never its id', async () => {
    updateSettings({ strictPrerequisites: true });
    const section = await mount('1.2');
    const lock = section.querySelector('#lesson-lock');
    await vi.waitFor(() => expect(lock?.hasAttribute('hidden')).toBe(false));
    expect(lock?.textContent).toContain('Usually comes after Right hand C position.');
    expect(lock?.textContent, 'the lock line printed an internal id').not.toContain('1.1');
  });
});
