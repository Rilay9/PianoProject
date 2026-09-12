// @vitest-environment jsdom
/**
 * The Plan screen's stage rows: the chevron has to close a stage as well as
 * suggest that it will (owner report: "in the plan the rungs expand but
 * don't shrink").
 *
 * `listRow` (`ui/widgets.ts`) puts a row's `actions` in their own container
 * and stops a click there from also reaching the row, so that pressing a real
 * button beside a row does not also count as pressing the row. The stage
 * row's chevron used to ride in `actions` for its position, which is exactly
 * backwards for it: it is not a second control, it is the thing a person aims
 * at once a stage is open and the chevron is pointing at what would close it
 * — and that tap was the one being swallowed. This drives the real screen and
 * clicks the chevron itself, not the row's title, so a fix that only worked
 * by accident (e.g. because the whole row still happens to toggle from a
 * click that lands elsewhere in it) would not pass it.
 *
 * Two stages, one per test: `expanded` (the set of open stages) is
 * module-level state in `PlanScreen.ts` that outlives any one screen mount,
 * so a test touching stage 1 must not leave stage 2's starting state (used by
 * the other test) in question, whichever order they run in.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { Curriculum, Lesson, Stage } from '../../src/curriculum/types';

function lesson(id: string): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    concepts: [],
    textFile: '',
    exerciseOptions: [],
    songOptions: [],
    mastery: { exercisesRequired: 0, songsRequired: 0, minAccuracy: 0, minTempoPct: 0 },
  };
}

function stage(number: number): Stage {
  return {
    number,
    title: `Stage ${String(number)}`,
    summary: 'Getting started',
    units: [{ id: `unit-${String(number)}`, title: 'Unit one', track: 'core', lessons: [lesson(`${String(number)}.1`)] }],
  };
}

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [stage(1), stage(2)],
};

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve([]),
}));

const { PlanScreen } = await import('../../src/ui/screens/PlanScreen');

const router = { navigateLesson: vi.fn(), navigate: vi.fn() } as unknown as Router;

async function mountPlan(stageNumber: number): Promise<HTMLElement> {
  const section = PlanScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector(`[data-stage="${String(stageNumber)}"]`)).toBeTruthy();
  });
  return section;
}

function stageRow(section: HTMLElement, stageNumber: number): HTMLElement {
  return section.querySelector(`[data-stage="${String(stageNumber)}"]`) as HTMLElement;
}

function chevronOf(section: HTMLElement, stageNumber: number): HTMLElement {
  const chevron = stageRow(section, stageNumber).querySelector('.plan-chevron');
  if (!chevron) throw new Error('stage row has no chevron');
  return chevron as HTMLElement;
}

describe('a stage row in the Plan screen', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('opens on a tap on the title, and the chevron then says "close"', async () => {
    const section = await mountPlan(1);
    expect(stageRow(section, 1).getAttribute('data-open')).toBe('false');
    expect(chevronOf(section, 1).textContent).toBe('›');

    section
      .querySelector('[data-stage="1"] .list-row__title')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(stageRow(section, 1).getAttribute('data-open')).toBe('true');
    expect(chevronOf(section, 1).textContent).toBe('⌄');
    // The lesson underneath is now visible.
    expect(section.querySelector('[data-lesson="1.1"]')).toBeTruthy();
  });

  it('closes on a tap on the chevron itself, not just elsewhere on the row', async () => {
    const section = await mountPlan(2);
    expect(stageRow(section, 2).getAttribute('data-open')).toBe('false');

    // Open it first, the same way the previous test does.
    stageRow(section, 2).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(stageRow(section, 2).getAttribute('data-open')).toBe('true');
    expect(section.querySelector('[data-lesson="2.1"]')).toBeTruthy();

    // Now the tap that was reportedly swallowed: on the chevron, which is
    // pointing down (closes) rather than on the title text beside it.
    chevronOf(section, 2).dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(stageRow(section, 2).getAttribute('data-open')).toBe('false');
    expect(section.querySelector('[data-lesson="2.1"]')).toBeNull();
    expect(chevronOf(section, 2).textContent).toBe('›');
  });
});
