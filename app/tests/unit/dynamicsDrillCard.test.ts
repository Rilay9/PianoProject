// @vitest-environment jsdom
/**
 * The dynamics card, met the way a learner meets it (T23).
 *
 * Two claims, and they are the two halves of the same walk. The card asks for
 * a four-note phrase *piano* and then the same phrase *forte*, and it draws a
 * `Next` button because — in `drawControls`' own words — these kinds "have no
 * per-answer settle, so the learner says when they are done".
 *
 *  1. **The card waits for the phrase.** `onNote` settles every kind that is
 *     not in `MANUAL_ADVANCE`, and `dynamics` was not in it, so
 *     `DynamicsDrill.result().answered` going from 0 to 1 on the **first**
 *     note of the phrase settled the card and flipped it to *forte* 450 ms
 *     later — while the learner was still playing notes two, three and four,
 *     which then landed in the forte bucket. The `Next` button said the
 *     opposite of what the screen did.
 *  2. **A run the instrument could not measure says so**, rather than
 *     printing `1.00× — aim for 1.6×` over two bars of the same height.
 *
 * **Nothing here is heard.** jsdom has no audio; every assertion is about what
 * the card says back.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const DYNAMICS_ID = 'drill.technique.dynamics-c';

/** The drill's own default phrase, which `buildDynamics` uses when none is given. */
const PHRASE = [60, 62, 64, 65];

function dynamicsItem(): CatalogItem {
  return {
    id: DYNAMICS_ID,
    type: 'drill',
    title: 'Loud and soft',
    level: 2.1,
    hands: 'right',
    tracks: ['core'],
    concepts: ['dynamics'],
    drill: { kind: 'dynamics', params: {} },
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
// The strip's own source: a tap here arrives by the path a tap on the keys
// arrives by, and at the velocity the glass actually sends.
const { screenKeyboardSource } = await import('../../src/app/services');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const { TOUCH_VELOCITY } = await import('../../src/ui/KeyboardStrip');

Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout here */
};

let mounted: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  findItemSpy.mockResolvedValue(dynamicsItem());
  const section = DrillScreen(
    {
      navigate: vi.fn(),
      navigateScore: vi.fn(),
      navigateDrill: vi.fn(),
      navigateLesson: vi.fn(),
      route: { tab: 'plan' },
    } as unknown as Router,
    DYNAMICS_ID,
  );
  mounted = section;
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.drill).not.toBe('loading');
  });
  return section;
}

/** The phrase, played on the glass — one velocity for every note, as it sends. */
function playPhrase(velocity: number = TOUCH_VELOCITY): void {
  for (const midi of PHRASE) {
    screenKeyboardSource.noteOn(midi, velocity);
    screenKeyboardSource.noteOff(midi);
  }
}

function promptText(): string {
  return document.querySelector('#drill-prompt')?.textContent ?? '';
}

function ratioLine(): HTMLElement | null {
  return document.querySelector('#drill-ratio');
}

beforeEach(() => {
  localStorage.clear();
  findItemSpy.mockReset();
});

afterEach(() => {
  disposeScreen(mounted);
  mounted = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('the dynamics card', () => {
  it('stays on the soft phrase until the learner says Next', async () => {
    const section = await mount();
    expect(section.dataset.kind).toBe('dynamics');
    expect(promptText()).toContain('piano');
    playPhrase();
    // Not a settle, and therefore not a card about to flip under the learner:
    // this kind has a `Next` button precisely because the learner says when
    // the phrase is done.
    expect(section.dataset.feedback ?? '').toBe('');
    // Long enough for `FEEDBACK_MS`, which is what used to move it.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(promptText(), 'the card moved to forte on its own').toContain('piano');
    document.querySelector<HTMLButtonElement>('#drill-next')?.click();
    expect(promptText()).toContain('forte');
  });

  it('says a pair of identical velocities was not measured, rather than failing it', async () => {
    await mount();
    playPhrase();
    document.querySelector<HTMLButtonElement>('#drill-next')?.click();
    playPhrase();
    const line = ratioLine();
    expect(line, 'the card drew no ratio line').not.toBeNull();
    expect(line?.dataset.measured).toBe('false');
    expect(line?.textContent).toContain('Not measured');
    // …and it does not print the arithmetic a learner reads as a verdict.
    expect(line?.textContent).not.toContain('aim for');
  });

  it('and prints the ratio when the instrument had something to say', async () => {
    await mount();
    playPhrase(40);
    document.querySelector<HTMLButtonElement>('#drill-next')?.click();
    playPhrase(100);
    const line = ratioLine();
    expect(line?.dataset.measured).toBe('true');
    expect(line?.textContent).toContain('2.50×');
    expect(line?.textContent).not.toContain('Not measured');
  });
});
