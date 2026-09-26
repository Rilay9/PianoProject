// @vitest-environment jsdom
/**
 * The chord-chart view has a way in (`04` §3b, built 2026-09-21).
 *
 * `#/chart/<itemId>` has parsed since P18 and `router.navigateChart` has
 * compiled since P18, and **nothing in the app called it**: the audit's grep
 * found only the definition, and a second search for `#/chart|chart/|chart:`
 * outside the router found no link either. A whole screen — a lead sheet with
 * a form tracker, a count-off, a comping loop and a swing toggle — was
 * reachable only by typing a URL, while `jam`'s lesson described it.
 *
 * Two doors now, both gated on the same measured fact: a *Chart* action on a
 * lesson's song row, and the piece's own ⋯ sheet on the Score screen. The
 * lesson door is driven here in the real screen; the gate itself is checked
 * against the real catalog, because a gate that opened on a piece with no
 * chord symbols would be the dead control `00` §1 forbids.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { hasChordSymbols } from '../../src/ui/openItem';
import type { CatalogItem, Lesson } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

const catalog = JSON.parse(
  readFileSync(resolve('public/content/catalog.json'), 'utf8'),
) as CatalogItem[];

const curriculum = JSON.parse(readFileSync(resolve('public/content/curriculum.json'), 'utf8')) as {
  stages: { units: { lessons: { id: string; songOptions: string[] }[] }[] }[];
};

function rung(id: string): { id: string; songOptions: string[] } {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) if (lesson.id === id) return lesson;
    }
  }
  throw new Error(`no rung ${id}`);
}

const WITH_CHORDS = 'song.with.chords';
const WITHOUT = 'song.without.chords';

function song(id: string, chordCount: number): CatalogItem {
  return {
    id,
    type: 'song',
    title: id,
    level: 4.4,
    hands: 'both',
    tracks: ['jam'],
    concepts: [],
    file: 'scores/whatever.mxl',
    notation: { chordCount, chords: chordCount > 0 ? ['C', 'F', 'G'] : [] },
  } as unknown as CatalogItem;
}

const { loadCurriculumSpy, allItemsSpy, fetchMarkdownSpy, LESSON } = vi.hoisted(() => {
  const lesson = {
    id: 'jam',
    title: 'Playing with other people',
    concepts: [],
    textFile: 'lessons/jam.md',
    exerciseOptions: [],
    songOptions: ['song.with.chords', 'song.without.chords'],
    optionsExempt: true,
    mastery: { minAccuracy: 0.9, minTempoPct: 0.85 }, requirements: [],
  } as unknown as Lesson;
  const built = {
    version: 1,
    tracks: [],
    stages: [{ number: 4, title: 'Four', units: [{ id: 'jam', track: 'jam', lessons: [lesson] }] }],
  };
  return {
    LESSON: lesson,
    loadCurriculumSpy: vi.fn(() => Promise.resolve(built)),
    allItemsSpy: vi.fn((): Promise<CatalogItem[]> => Promise.resolve([])),
    fetchMarkdownSpy: vi.fn(
      (): Promise<string> => Promise.reject(new Error('no lesson text in this fixture')),
    ),
  };
});

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: loadCurriculumSpy,
  allItems: allItemsSpy,
  fetchMarkdown: fetchMarkdownSpy,
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');

let router: { navigate: ReturnType<typeof vi.fn>; navigateChart: ReturnType<typeof vi.fn> };

async function mount(): Promise<HTMLElement> {
  const section = LessonScreen(router as unknown as Router, LESSON.id);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(document.querySelector(`[data-item="${WITH_CHORDS}"]`)).not.toBeNull();
  });
  return section;
}

/** The buttons drawn on one option row, by their words. */
function actions(itemId: string): string[] {
  const row = document.querySelector(`[data-item="${itemId}"]`);
  expect(row, itemId).not.toBeNull();
  return [...(row as Element).querySelectorAll('button')].map((b) => b.textContent ?? '');
}

beforeEach(() => {
  useFakeIndexedDb();
  router = { navigate: vi.fn(), navigateChart: vi.fn() };
  allItemsSpy.mockResolvedValue([song(WITH_CHORDS, 12), song(WITHOUT, 0)]);
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('the gate', () => {
  it('opens for a piece whose file has chord symbols in it', () => {
    const withChords = catalog.filter((item) => (item.notation?.chordCount ?? 0) > 0 && item.file);
    expect(withChords.length).toBeGreaterThan(10);
    for (const item of withChords.slice(0, 20)) expect(hasChordSymbols(item), item.id).toBe(true);
  });

  it('stays shut for a piece with none, so the door never opens on empty bars', () => {
    const none = catalog.filter(
      (item) => item.file && item.notation !== undefined && (item.notation?.chordCount ?? 0) === 0,
    );
    expect(none.length).toBeGreaterThan(10);
    for (const item of none.slice(0, 20)) expect(hasChordSymbols(item), item.id).toBe(false);
  });

  it('stays shut for a row the build never measured, because unknown is not yes', () => {
    const unmeasured = catalog.find(
      (item) => item.notation === undefined && item.imported !== true && item.type === 'song',
    );
    expect(unmeasured, 'no unmeasured song row to test with').toBeDefined();
    expect(hasChordSymbols(unmeasured as CatalogItem)).toBe(false);
  });

  it('stays shut for a drill, which is a prompt loop and has no bars to chart', () => {
    const drill = catalog.find((item) => item.drill && !item.file);
    expect(drill).toBeDefined();
    expect(hasChordSymbols(drill as CatalogItem)).toBe(false);
  });

  it('lets a song on the jam rung, whose lesson describes the chart, open one', () => {
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const openable = rung('jam').songOptions.filter((id) => {
      const item = byId.get(id);
      return item !== undefined && hasChordSymbols(item);
    });
    expect(openable.length, 'no song on `jam` can open a chart').toBeGreaterThan(0);
  });
});

describe('the door on a lesson page', () => {
  it('draws *Chart* on a song that has chord symbols, and opens the chart with it', async () => {
    await mount();
    expect(actions(WITH_CHORDS)).toContain('Chart');
    const button = [...document.querySelectorAll<HTMLButtonElement>(
      `[data-item="${WITH_CHORDS}"] button`,
    )].find((node) => node.textContent === 'Chart');
    expect(button).toBeDefined();
    (button as HTMLButtonElement).click();
    // With the rung, so the chart's Back comes back here (`04` §3b, T17-2's
    // *what is unverified*): the door used to open a screen whose only way
    // out was a hard-coded `← Library`.
    expect(router.navigateChart).toHaveBeenCalledWith(WITH_CHORDS, { from: LESSON.id });
  });

  it('draws none on a song that has not', async () => {
    await mount();
    expect(actions(WITHOUT)).not.toContain('Chart');
    // The row is otherwise the same row, so this is the gate and not the mount.
    expect(actions(WITHOUT)).toContain('Know it');
  });
});
