// @vitest-environment jsdom
/**
 * The guided tour of the practice modes (`04` §5c-1, `02` Stage 0.3).
 *
 * `drill.tour.app-basics` used to reach a screen that said it was "being
 * built". What replaces it is three steps of prose, each of which opens the
 * **real** Score screen already in the mode it is about and comes back to the
 * next step — so what this file asserts is the handover: the right mode, the
 * right loop, the right way back, and a position that survives the learner
 * leaving the screen entirely (which they must, on every step).
 *
 * It drives the real screen rather than a reimplementation of the decision:
 * the buttons are clicked and the router is watched.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const TOUR_ID = 'drill.tour.app-basics';
const SONG_ID = 'song.folk.hot-cross-buns';

function tourItem(steps: string[] = ['wait-mode', 'tempo-mode', 'loops']): CatalogItem {
  return {
    id: TOUR_ID,
    type: 'drill',
    title: 'Guided tour of the practice modes',
    level: 0.3,
    tracks: ['core'],
    concepts: ['wait-mode', 'tempo-mode', 'loops'],
    drill: { kind: 'walkthrough', params: { song: SONG_ID, steps } },
  } as unknown as CatalogItem;
}

/** A drill that is opened and left in one hop, for the Back comparison below. */
function checklistItem(): CatalogItem {
  return {
    id: 'drill.posture.checklist',
    type: 'drill',
    title: 'Posture checklist',
    level: 0.1,
    tracks: ['core'],
    concepts: [],
    drill: { kind: 'checklist', params: { items: ['Sit tall', 'Curved fingers'] } },
  } as unknown as CatalogItem;
}

const { findItemSpy, recordRunSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
  recordRunSpy: vi.fn((_record: Record<string, unknown>): Promise<void> => Promise.resolve()),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...original, findItem: findItemSpy };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: recordRunSpy,
  sessionsForItem: vi.fn(() => Promise.resolve([])),
}));

const { DrillScreen } = await import('../../src/ui/screens/DrillScreen');

// jsdom has no layout, so it has no `scrollIntoView` — and the result sheet
// calls it exactly as the checklist and the placement test do. Stubbed rather
// than guarded in the screen: scrolling the sheet into view is the behaviour a
// phone wants, and a test environment missing a DOM method is not a reason to
// take it out.
Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout here */
};

interface FakeRouter {
  navigate: ReturnType<typeof vi.fn>;
  navigateScore: ReturnType<typeof vi.fn>;
  navigateDrill: ReturnType<typeof vi.fn>;
  route: { tab: string };
}

let router: FakeRouter;

function newRouter(): FakeRouter {
  return {
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateDrill: vi.fn(),
    route: { tab: 'plan' },
  };
}

/** Mounts the screen the way the app does and waits for the first step. */
async function mount(id: string = TOUR_ID): Promise<HTMLElement> {
  const section = DrillScreen(router as unknown as Router, id);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.drill).not.toBe('loading');
  });
  return section;
}

function click(id: string): void {
  const node = document.querySelector<HTMLButtonElement>(`#${id}`);
  expect(node, id).not.toBeNull();
  (node as HTMLButtonElement).click();
}

function text(id: string): string {
  return document.querySelector(`#${id}`)?.textContent?.trim() ?? '';
}

/** The options the last `navigateScore` was given. */
function lastOpen(): { item: string; options: Record<string, unknown> } {
  const call = router.navigateScore.mock.calls.at(-1);
  expect(call, 'navigateScore was never called').toBeDefined();
  return {
    item: (call as unknown[])[0] as string,
    options: ((call as unknown[])[1] ?? {}) as Record<string, unknown>,
  };
}

beforeEach(() => {
  localStorage.clear();
  router = newRouter();
  findItemSpy.mockReset();
  findItemSpy.mockResolvedValue(tourItem());
  recordRunSpy.mockReset();
  recordRunSpy.mockResolvedValue(undefined);
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('the guided tour runs rather than announcing itself', () => {
  it('opens on the first step, running, with something to read and a way in', async () => {
    const section = await mount();
    expect(section.dataset.drill).toBe('running');
    expect(section.dataset.kind).toBe('walkthrough');
    // The state the old placeholder was in, and the sentence it said. Both are
    // what this whole change exists to remove.
    expect(section.dataset.drill).not.toBe('unavailable');
    expect(text('drill-status')).not.toMatch(/being built/i);
    expect(text('drill-counter')).toMatch(/1 of 3/);
    // Prose a person can read, not a label.
    expect(text('drill-prompt').length).toBeGreaterThan(60);
    expect(document.querySelector('#drill-walkthrough-open')).not.toBeNull();
  });

  it('keeps no room for a card it has nothing to draw in', async () => {
    // `.drill-stage` is `flex: 1` upright and spans five grid rows sideways,
    // because every other drill puts the thing to look at in it. A step with
    // an empty one started its sentence three-quarters of the way down the
    // phone, under a void, and sideways gave four tenths of the width to
    // nothing while the prose scrolled in the rest.
    await mount();
    const stage = document.querySelector('#drill-stage');
    expect(stage).not.toBeNull();
    expect(stage?.hasAttribute('hidden')).toBe(true);
    expect(stage?.childElementCount).toBe(0);
  });

  it('never asks the learner to import anything', async () => {
    await mount();
    const said = `${text('drill-status')} ${text('drill-prompt')} ${text('drill-hint')}`;
    expect(said).not.toMatch(/import needed|needs? import|import (?:your|a copy|it)/i);
  });
});

describe('each step opens the real Score screen in its own mode', () => {
  it('step one asks for Wait mode on the piece the catalog names', async () => {
    await mount();
    click('drill-walkthrough-open');
    const { item, options } = lastOpen();
    expect(item).toBe(SONG_ID);
    expect(options.mode).toBe('wait');
    // Without this the Score screen's Back goes to a tab and the tour is a
    // one-way door.
    expect(options.tour).toBe(TOUR_ID);
    expect(options.loop).toBeUndefined();
  });

  it('resumes on the next step when the learner comes back', async () => {
    await mount();
    click('drill-walkthrough-open');
    // Coming back is a fresh mount: the Score screen replaced this one.
    document.body.replaceChildren();
    router = newRouter();
    await mount();
    expect(text('drill-counter')).toMatch(/2 of 3/);
    click('drill-walkthrough-open');
    expect(lastOpen().options.mode).toBe('tempo');
  });

  it('the loops step arrives with two bars already looping', async () => {
    await mount();
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    expect(text('drill-counter')).toMatch(/3 of 3/);
    click('drill-walkthrough-open');
    const { options } = lastOpen();
    // Printed bars, which is the language `loopForPrintedBars` speaks.
    expect(options.loop).toEqual({ from: 1, to: 2 });
    expect(options.tour).toBe(TOUR_ID);
  });

  it('says what Back will do, which on the last step is finish rather than advance', async () => {
    await mount();
    expect(text('drill-hint')).toMatch(/next step/i);
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    expect(text('drill-counter')).toMatch(/3 of 3/);
    // There is no fourth step for it to promise.
    expect(text('drill-hint')).not.toMatch(/next step/i);
    expect(text('drill-hint')).toMatch(/finish/i);
  });

  it('advances even if the learner never comes back through Back', async () => {
    // The position is written before navigating, so the Android back gesture
    // and the screen's own Back land in the same place.
    await mount();
    click('drill-walkthrough-open');
    expect(localStorage.getItem(`pianopath:walkthrough:${TOUR_ID}`)).toBe('1');
  });
});

describe('there is a way out of every step, and it can be run again', () => {
  it('offers Start over once past the first step, and not before', async () => {
    await mount();
    expect(document.querySelector('#drill-walkthrough-restart')).toBeNull();
    click('drill-walkthrough-next');
    expect(document.querySelector('#drill-walkthrough-restart')).not.toBeNull();
    click('drill-walkthrough-restart');
    expect(text('drill-counter')).toMatch(/1 of 3/);
    expect(document.querySelector('#drill-walkthrough-restart')).toBeNull();
  });

  it('finishes, records the run, and starts from the top the next time', async () => {
    const section = await mount();
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    click('drill-walkthrough-next'); // "Finish" on the last step
    expect(section.dataset.drill).toBe('finished');
    expect(document.querySelector('#drill-summary')?.hasAttribute('hidden')).toBe(false);
    await vi.waitFor(() => {
      expect(recordRunSpy).toHaveBeenCalledTimes(1);
    });
    const record = recordRunSpy.mock.calls[0]?.[0];
    expect(record?.itemId).toBe(TOUR_ID);
    // `02` Stage 0.3: mastery is "tour completed".
    expect(record?.passed).toBe(true);
    // Nothing left behind, so opening it again is opening it again.
    expect(localStorage.getItem(`pianopath:walkthrough:${TOUR_ID}`)).toBeNull();

    document.body.replaceChildren();
    router = newRouter();
    await mount();
    expect(text('drill-counter')).toMatch(/1 of 3/);
  });

  it('Again on the sheet puts it back to the first step in place', async () => {
    await mount();
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    click('drill-walkthrough-next');
    click('drill-again');
    expect(text('drill-counter')).toMatch(/1 of 3/);
    expect(document.querySelector('#drill-summary')?.hasAttribute('hidden')).toBe(true);
  });

  it('a stored position past the end does not strand the tour', async () => {
    // A shortened `steps` list in a later edition, or junk in storage: the
    // tour must not open on a step that does not exist.
    localStorage.setItem(`pianopath:walkthrough:${TOUR_ID}`, '99');
    await mount();
    expect(text('drill-counter')).toMatch(/1 of 3/);
  });
});

describe('steps this version does not know', () => {
  it('skips an unknown id rather than drawing a blank step', async () => {
    findItemSpy.mockResolvedValue(tourItem(['wait-mode', 'sight-singing', 'loops']));
    await mount();
    expect(text('drill-counter')).toMatch(/1 of 2/);
    click('drill-walkthrough-next');
    click('drill-walkthrough-open');
    expect(lastOpen().options.loop).toEqual({ from: 1, to: 2 });
  });

  it('says so plainly when it knows none of them', async () => {
    findItemSpy.mockResolvedValue(tourItem(['sight-singing']));
    const section = await mount();
    expect(section.dataset.drill).toBe('unavailable');
    expect(text('drill-status')).not.toMatch(/import/i);
    expect(text('drill-status').length).toBeGreaterThan(20);
  });
});

describe('the header Back is a way out of the tour and not back into the piece', () => {
  /**
   * Every other drill is opened and left in one hop, so its Back is
   * `history.back()`. The tour is the exception: each step navigates *away* to
   * the Score screen and is navigated back to, so the entry behind the tour is
   * the piece the learner has just left — and Back walked into it, while the
   * score's own Back came here again. Two buttons pointing at each other, and
   * the only way out was the tab bar.
   */
  it('leaves for the tab it came from rather than stepping back into the score', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    try {
      await mount();
      click('drill-walkthrough-open');
      // Coming back from the score: a fresh mount of this screen, with the
      // score sitting one entry behind it.
      document.body.replaceChildren();
      router = newRouter();
      await mount();
      click('drill-back');
      expect(back).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith('plan');
    } finally {
      back.mockRestore();
    }
  });

  it('and a drill that was opened in one hop still goes back one hop', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    try {
      findItemSpy.mockResolvedValue(checklistItem());
      await mount('drill.posture.checklist');
      click('drill-back');
      expect(back).toHaveBeenCalledTimes(1);
      expect(router.navigate).not.toHaveBeenCalled();
    } finally {
      back.mockRestore();
    }
  });
});
