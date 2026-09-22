// @vitest-environment jsdom
/**
 * Simon says whose turn it is (`04` §5c-2; `pending-review` Entry 38, FAULT 7b).
 *
 * The lights, the note name and the play-along staff all go out on one timer
 * at the end of the chain, so that the display cannot be a crib. That is
 * right, and it left the learner's turn announced by **the absence of
 * everything else**: the one positive cue on the screen was the prompt line,
 * which reads *Play the chain back* from the first moment of the card to the
 * last and therefore says exactly the same thing while the app is playing.
 *
 * So the status line — under the prompt, above the buttons, which is where
 * `04` §0 R6 puts this screen's messages, and where the rhythm drill already
 * says *Tap the rhythm on any key* — says which half of the exchange we are
 * in. Two claims here, and the second is the one that matters: the cue arrives
 * **after** the chain rather than with it, and it **names no note**, so the
 * crib rule is untouched.
 *
 * Driven through the real screen rather than through a copy of its decision,
 * for the reason `dictationCard.test.ts` gives: the claim is about the screen.
 *
 * **Nothing here is heard.** jsdom has no audio; the piano load fails and the
 * screen says so on the same line, which is why the assertions below are about
 * the cue arriving and not about the line being empty before it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const SIMON_ID = 'drill.ear.simon-c-major';

/** One note per card to begin with, which is how Simon opens. */
function simonItem(help?: string): CatalogItem {
  return {
    id: SIMON_ID,
    type: 'drill',
    title: 'Simon',
    level: 1.2,
    hands: 'right',
    tracks: ['core'],
    concepts: ['simon'],
    drill: {
      kind: 'simon',
      params: { key: 'C', notes: 8, ...(help === undefined ? {} : { help }) },
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

// jsdom has no layout, so it has no `scrollIntoView`; the screen calls it.
Element.prototype.scrollIntoView = function scrollIntoView(): void {
  /* no layout here */
};

function newRouter(): Record<string, unknown> {
  return {
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateDrill: vi.fn(),
    navigateLesson: vi.fn(),
    route: { tab: 'plan' },
  };
}

async function mount(item: CatalogItem): Promise<HTMLElement> {
  findItemSpy.mockResolvedValue(item);
  const section = DrillScreen(newRouter() as unknown as Router, item.id);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.dataset.drill).not.toBe('loading');
  });
  return section;
}

function statusText(): string {
  return document.querySelector('#drill-status')?.textContent ?? '';
}

beforeEach(() => {
  localStorage.clear();
  findItemSpy.mockReset();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('the chain hands over in words, not only by going quiet', () => {
  it('says it is the learner’s turn once the chain has finished', async () => {
    const section = await mount(simonItem());
    expect(section.dataset.kind).toBe('simon');
    // Not yet: the app is still playing, and a cue that arrived with the chain
    // would be telling the learner to answer over the top of it.
    expect(statusText(), 'the turn cue arrived while the app was still playing').not.toContain(
      'Your turn',
    );
    // The chain is one note at the first card, so this is one step of sound
    // and a step of quiet — a second is room enough for it without pinning a
    // number this machine measured.
    await vi.waitFor(
      () => {
        expect(statusText()).toContain('Your turn');
      },
      { timeout: 4_000, interval: 50 },
    );
  });

  it('names no note in it, so the cue is not a crib', async () => {
    const section = await mount(simonItem());
    await vi.waitFor(
      () => {
        expect(statusText()).toContain('Your turn');
      },
      { timeout: 4_000, interval: 50 },
    );
    const expected = (section.dataset.expects ?? '').split(',').filter(Boolean);
    expect(expected.length, 'the card expects nothing, so this proves nothing').toBeGreaterThan(0);
    const line = statusText();
    for (const midi of expected) {
      const letter = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][
        Number(midi) % 12
      ] as string;
      expect(line, `${letter} is in the turn cue`).not.toContain(letter);
    }
  });

  /**
   * All three rungs of the help ladder, named one at a time.
   *
   * "Every rung" is three claims (`00` §1a), and the code makes it true by
   * construction — `playPromptWithHelp` cues on `drill.kind` and not on the
   * help level — which is an argument and not evidence. *Ear only* is the one
   * that most needs the cue, because the lit rungs at least have the keys
   * going out to mark the hand-over and that rung has nothing on the screen at
   * all; it is still only one of the three.
   *
   * Each case checks the chip as well, because an unrecognised `help` falls
   * back rather than throwing (`toSimonHelp`), so a typo would quietly have
   * tested the default rung three times.
   */
  for (const help of ['show-keys', 'keys-after-miss', 'ear-only'] as const) {
    it(`says it on the ${help} rung`, async () => {
      const section = await mount(simonItem(help));
      expect(section.dataset.kind).toBe('simon');
      expect(
        document.querySelector(`#drill-simon-help-${help}`)?.getAttribute('aria-pressed'),
        `the ${help} rung is not the one this mounted`,
      ).toBe('true');
      await vi.waitFor(
        () => {
          expect(statusText()).toContain('Your turn');
        },
        { timeout: 4_000, interval: 50 },
      );
    });
  }
});
