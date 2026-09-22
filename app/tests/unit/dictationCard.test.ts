// @vitest-environment jsdom
/**
 * The melodic-dictation card names nothing until the attempt is judged
 * (`04` §5c, built 2026-09-21).
 *
 * `callResponseDrill` labels each prompt with the note names of the phrase it
 * is about to play, and the drill screen printed that label across the card
 * before a key had been pressed — so the ear drill on `theory.4` and the
 * *Answer the phrase* drill on `improv.4` could not be got wrong by anyone
 * who looked at the screen. `04` §5c forbids it whatever a lesson says.
 *
 * Two claims, and they are different: that the *drill* marks the label as the
 * answer, and that the *screen* obeys that mark. The second is the one that
 * was broken, so it is driven through the real screen rather than through a
 * copy of its decision.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callResponseDrill } from '../../src/engine/drills/factories';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import type { CatalogItem } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const EAR_GLYPH = '🎧';
const DICTATION_ID = 'drill.theory.melodic-dictation';

function dictationItem(): CatalogItem {
  return {
    id: DICTATION_ID,
    type: 'drill',
    title: 'Melodic dictation',
    level: 4.4,
    hands: 'right',
    tracks: ['theory'],
    concepts: ['melodic-dictation'],
    drill: { kind: 'call-response', params: { bars: 2 } },
  } as unknown as CatalogItem;
}

/** A five-finger pattern, which is also built as a `call-response` drill. */
function patternItem(): CatalogItem {
  return {
    id: 'exercise.five-finger.c.right',
    type: 'exercise',
    title: 'Five-finger walk',
    level: 1.1,
    hands: 'right',
    tracks: ['core'],
    concepts: ['five-finger'],
    drill: { kind: 'five-finger', params: { key: 'C', hands: 'right' } },
  } as unknown as CatalogItem;
}

const { findItemSpy } = vi.hoisted(() => ({
  findItemSpy: vi.fn((): Promise<CatalogItem | undefined> => Promise.resolve(undefined)),
}));

vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...original, findItem: findItemSpy, loadCurriculum: vi.fn(() => Promise.reject(new Error('no curriculum here'))) };
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

beforeEach(() => {
  localStorage.clear();
  findItemSpy.mockReset();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('the drill marks the label that is the answer', () => {
  it('sets labelIsAnswer on a dictation prompt, whose label is the note names', () => {
    const prompt = callResponseDrill({ seed: 3 }).next();
    expect(prompt).not.toBeNull();
    // The label really is the answer: four note names, one per expected pitch.
    expect(prompt?.label.split(' ')).toHaveLength(prompt?.expected.length ?? 0);
    expect(prompt?.labelIsAnswer).toBe(true);
  });

  it('leaves it off a five-finger pattern, whose label gives nothing away', () => {
    const drill = drillFromCatalog(patternItem(), { seed: 1 });
    const prompt = drill?.next();
    expect(prompt?.labelIsAnswer).toBeUndefined();
    expect(prompt?.label).not.toMatch(/\d(?!\s|$)/);
  });
});

describe('the drill screen keeps the answer off the card', () => {
  it('draws the ear glyph, not the note names, before the phrase is played back', async () => {
    const section = await mount(dictationItem());
    expect(section.dataset.kind).toBe('call-response');
    const names = (document.querySelector('#drill-symbol')?.textContent ?? '').trim();
    expect(names, 'the note names are printed on the card').toBe('');
    expect(document.querySelector('#drill-ear-card')?.textContent).toBe(EAR_GLYPH);
    // Nothing anywhere on the card says which notes are coming.
    const expected = (section.dataset.expects ?? '').split(',').filter(Boolean);
    expect(expected.length).toBeGreaterThan(0);
    const shown = section.textContent ?? '';
    for (const midi of expected) {
      const letter = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][
        Number(midi) % 12
      ] as string;
      const octave = String(Math.floor(Number(midi) / 12) - 1);
      expect(shown, `${letter}${octave} is on screen`).not.toContain(`${letter}${octave}`);
    }
  });

  it('still shows a pattern card its own label', async () => {
    const section = await mount(patternItem());
    expect(section.dataset.kind).toBe('call-response');
    expect((document.querySelector('#drill-symbol')?.textContent ?? '').trim()).not.toBe('');
  });

  it('offers the replay that lets the phrase be heard again', async () => {
    await mount(dictationItem());
    expect(document.querySelector('#drill-replay')).not.toBeNull();
    // And not the two buttons that would forfeit the mark: `call-response` is
    // not a revealable kind, so hearing it again costs nothing.
    expect(document.querySelector('#drill-hear')).toBeNull();
    expect(document.querySelector('#drill-show')).toBeNull();
  });
});
