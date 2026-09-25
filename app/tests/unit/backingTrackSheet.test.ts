// @vitest-environment jsdom
/**
 * The backing-track drill's sheet claims nothing it did not measure (T41).
 *
 * A loop to play over has nothing to be right about (`05` §7), and the sheet
 * said *Not passed yet* over *Accuracy 0%* and *Answered 0 of 1* anyway — and
 * under them, from the general coaching rule reading that zero, *Fast, but 0%
 * right. Slow down until you are getting them right.* Four claims about a
 * measurement nobody took. What this drill does measure is how many notes
 * were played (and it keeps them for *Listen back*), so that is the one
 * number on the sheet.
 *
 * **Nothing here is heard.** jsdom has no audio; every assertion is about what
 * the sheet says.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const LOOP_ID = 'drill.improv.loop-i-iv-v';

function loopItem(): CatalogItem {
  return {
    id: LOOP_ID,
    type: 'drill',
    title: 'Improvise over a I-IV-V loop',
    level: 3.1,
    hands: 'both',
    tracks: ['improv-compose'],
    concepts: ['improvisation'],
    drill: {
      kind: 'backing-track',
      params: { progression: ['C', 'C', 'C', 'C', 'F', 'F', 'G', 'G'], bpm: 72, scored: false },
    },
  } as unknown as CatalogItem;
}

const { findItemSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return {
    ...original,
    findItem: findItemSpy,
    loadCurriculum: vi.fn(() => Promise.reject(new Error('no curriculum here'))),
  };
});

vi.mock('../../src/data/progressStore', () => ({
  recordRun: vi.fn(() => Promise.resolve()),
  sessionsForItem: vi.fn(() => Promise.resolve([])),
  getProgress: vi.fn(() => Promise.resolve({ bestAccuracy: 0 })),
}));

const { DrillScreen } = await import('../../src/ui/screens/DrillScreen');
const { screenKeyboardSource } = await import('../../src/app/services');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout here */
};
// The loop's stage asks whether motion is reduced; jsdom has no media queries.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

let mounted: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  findItemSpy.mockResolvedValue(loopItem());
  const section = DrillScreen(
    {
      navigate: vi.fn(),
      navigateScore: vi.fn(),
      navigateDrill: vi.fn(),
      navigateLesson: vi.fn(),
      route: { tab: 'plan' },
    } as unknown as Router,
    LOOP_ID,
  );
  mounted = section;
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.drill).not.toBe('loading');
  });
  return section;
}

beforeEach(() => {
  localStorage.clear();
  findItemSpy.mockReset();
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
});

describe('the backing-track sheet', () => {
  it('says it was practice, prints the notes played, and no verdict or accuracy', async () => {
    const section = await mount();
    expect(section.dataset.kind).toBe('backing-track');
    screenKeyboardSource.noteOn(64, 90);
    screenKeyboardSource.noteOff(64);
    document.querySelector<HTMLButtonElement>('#drill-end')?.click();
    expect(section.dataset.drill).toBe('finished');

    expect(document.querySelector('#drill-outcome')?.textContent).toBe('Practice');
    expect(document.querySelector('#drill-outcome-note')?.textContent).toContain('Nothing here is judged');
    expect(document.querySelector('[data-stat="accuracy"]'), 'an accuracy nobody measured').toBeNull();
    expect(document.querySelector('[data-stat="answered"]'), 'answers to a loop that asks nothing').toBeNull();
    expect(document.querySelector('[data-stat="notes-played"]')?.textContent).toBe('1');
    const sheet = document.querySelector('#drill-summary')?.textContent ?? '';
    expect(sheet).not.toContain('Not passed');
    expect(sheet).not.toContain('keep going');

    // The coaching line reads the history first; the store is mocked to
    // answer at once, so one turn of the event loop has seen it decide.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const coaching = document.querySelector<HTMLElement>('#drill-coaching');
    expect(coaching?.hidden, `coached on an accuracy nobody measured: "${coaching?.textContent ?? ''}"`).toBe(true);
  });
});
