// @vitest-environment jsdom
/**
 * The lesson page's heading never carries the lesson's id (T20; `00` §1: no internal identifier on screen).
 *
 * Until G90 the page drew *Lesson classical.3* in its `h1` the moment the route resolved, and kept it for as
 * long as the curriculum took to arrive (a first launch on a slow phone: the whole wait); only then was it
 * replaced by the lesson's title. So the heading is read in the three states the screen has no lesson to name:
 * the curriculum still being fetched (held back by the test), the fetch failed, and an id the curriculum does
 * not have. In each the heading is a word and the id is nowhere in the page's text outside the status line's
 * own sentence about a lesson that does not exist (the learner typed that id into the address; recorded, not
 * changed here). Then the curriculum arrives and the heading is the title.
 *
 * Nothing here is about music: every assertion is a string on a screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem, Lesson } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const { loadCurriculumSpy, allItemsSpy, fetchMarkdownSpy, rung, gate } = vi.hoisted(() => {
  const lesson: Lesson = {
    id: 'classical.3',
    title: 'A singing melody',
    concepts: [],
    textFile: 'lessons/classical.3.md',
    exerciseOptions: [],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [{ kind: 'runs', from: 'exercises', count: 2 }],
  };
  const curriculum = {
    version: 1,
    tracks: [],
    stages: [{ number: 3, title: 'Three', units: [{ id: 'u1', track: 'core', lessons: [lesson] }] }],
  };
  const gate: { open: (value?: unknown) => void; fail: (cause: Error) => void; held: Promise<unknown> } = {
    open: () => undefined,
    fail: () => undefined,
    held: Promise.resolve(),
  };
  return {
    rung: lesson,
    gate,
    loadCurriculumSpy: vi.fn((): Promise<unknown> => gate.held),
    allItemsSpy: vi.fn((): Promise<CatalogItem[]> => Promise.resolve([])),
    fetchMarkdownSpy: vi.fn((): Promise<string> => Promise.reject(new Error('no lesson text in this fixture'))),
    curriculum,
  };
});

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: loadCurriculumSpy,
  allItems: allItemsSpy,
  fetchMarkdown: fetchMarkdownSpy,
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');

let router: { navigate: ReturnType<typeof vi.fn> };

/** The curriculum fetch, held until the test lets it go or fails it. */
function holdTheCurriculum(): void {
  gate.held = new Promise((resolve, reject) => {
    gate.open = resolve;
    gate.fail = reject;
  });
}

const curriculumWith = (lessons: Lesson[]): unknown => ({
  version: 1,
  tracks: [],
  stages: [{ number: 3, title: 'Three', units: [{ id: 'u1', track: 'core', lessons }] }],
});

beforeEach(() => {
  useFakeIndexedDb();
  router = { navigate: vi.fn() };
  holdTheCurriculum();
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

const mount = (id: string): HTMLElement => {
  const section = LessonScreen(router as unknown as Router, id);
  document.body.replaceChildren(section);
  return section;
};
const heading = (section: HTMLElement): string => section.querySelector('h1')?.textContent ?? '';
/** Every turn the screen's promise chains need to settle (nothing here waits on a timer). */
const settle = async (): Promise<void> => {
  for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('the lesson heading carries no id (T20)', () => {
  it('while the curriculum is still being fetched, the heading says a word and the id is nowhere on the page', async () => {
    const section = mount('classical.3');
    await settle();
    expect(loadCurriculumSpy, 'the curriculum was not being held back').toHaveBeenCalled();
    expect(heading(section)).toBe('Lesson');
    expect(section.textContent ?? '', 'the lesson’s id is on the screen').not.toContain('classical.3');
    expect(section.getAttribute('data-lesson'), 'the route resolved to a lesson before the curriculum said so').toBeNull();
  });

  it('then the curriculum arrives and the heading is the lesson’s title, the id kept on the element for tests', async () => {
    const section = mount('classical.3');
    await settle();
    gate.open(curriculumWith([rung]));
    await vi.waitFor(() => expect(section.getAttribute('data-lesson')).toBe('classical.3'));
    expect(heading(section)).toBe('A singing melody');
    expect(section.textContent ?? '').not.toContain('classical.3');
  });

  it('a curriculum that fails to load leaves the word, not the id', async () => {
    const section = mount('classical.3');
    gate.fail(new Error('offline'));
    await vi.waitFor(() => expect(section.querySelector('#lesson-status')?.textContent).toContain('could not be opened'));
    expect(heading(section)).toBe('Lesson');
    expect(heading(section)).not.toContain('classical.3');
  });

  it('an id the curriculum does not have keeps the word as well; the status line’s own sentence names what was asked for', async () => {
    const section = mount('9.9');
    gate.open(curriculumWith([rung]));
    await vi.waitFor(() => expect(section.querySelector('#lesson-status')?.textContent).toContain('There is no lesson'));
    expect(heading(section)).toBe('Lesson');
    expect(heading(section)).not.toContain('9.9');
  });
});
