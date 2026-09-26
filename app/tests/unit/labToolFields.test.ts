// @vitest-environment jsdom
/**
 * `unlock` and `mode` on a rung's lab entry, and the duet that may open an
 * exercise (T16, items 5 and 8).
 *
 * **What was wrong.** `curriculum.schema.json` closed a `tools` item to `kind`,
 * `preset`, `item` and `label` with `additionalProperties: false`, so a rung
 * could say *which* preset and nothing else about it. Two things fell out of
 * that and both are recorded rather than remembered:
 *
 * * Entry 24 item 5: six rungs whose preset locks the very control their
 *   lesson teaches were given a **second lab button** with no preset at all.
 *   Two controls opening one screen, and six lesson paragraphs naming both.
 * * Entry 30 item 5: a preset carries one default way round for every rung
 *   that shares it, and three rungs want the other one. Their lessons say so
 *   in prose and the chip is a tap away.
 *
 * One button that names what it frees and which way round it opens answers
 * both. The route is where it lands, so the round trip through the hash is the
 * first thing tested: a rung that cannot say it in a URL cannot say it at all.
 *
 * The duet is the other half. `validate.py`'s rule said a duet's `item` had to
 * be one of the rung's **songs**, and `technique.7` is the rung that was wrong
 * about — its sentence is about the two-against-three exercise and its only
 * songs are Czerny études, so Entry 24 item 7 left that paragraph unbuilt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { parseHash, routeToHash } from '../../src/router';
import { LAB_PRESETS, labBedFor, labLocksFor, labPreset } from '../../src/engine/sightReading';
import type { CatalogItem, Lesson, LessonTool } from '../../src/curriculum/types';
import type { Router } from '../../src/router';

describe('the lab route carries what the rung freed and which way round', () => {
  it('parses both and round-trips them', () => {
    const route = parseHash('#/lab?preset=ballad&unlock=progression&mode=tune');
    expect(route.lab).toBe(true);
    expect(route.labPreset).toBe('ballad');
    expect(route.labUnlock).toEqual(['progression']);
    expect(route.labBed).toBe('tune');
    expect(routeToHash(route)).toBe('#/lab?preset=ballad&unlock=progression&mode=tune');
  });

  it('carries more than one freed control', () => {
    const route = parseHash('#/lab?preset=ballad&unlock=progression,rightHand');
    expect(route.labUnlock).toEqual(['progression', 'rightHand']);
    expect(routeToHash(route)).toBe('#/lab?preset=ballad&unlock=progression,rightHand');
  });

  it('drops a control name the lab has no picker for, rather than carrying it', () => {
    // The same rule `?loop=` and `?preset=` already follow: a route asking for
    // something that does not exist arrives without it instead of arriving
    // broken.
    expect(parseHash('#/lab?preset=ballad&unlock=tempo').labUnlock).toBeUndefined();
    expect(parseHash('#/lab?preset=ballad&unlock=progression,tempo').labUnlock).toEqual([
      'progression',
    ]);
  });

  it('drops a way round the lab does not have', () => {
    expect(parseHash('#/lab?preset=ballad&mode=comp').labBed).toBeUndefined();
  });

  it('leaves a plain lab route exactly as it was', () => {
    expect(routeToHash({ tab: 'library', lab: true })).toBe('#/lab');
    expect(routeToHash({ tab: 'library', lab: true, labPreset: 'ballad' })).toBe(
      '#/lab?preset=ballad',
    );
  });
});

describe('what the screen locks, as a function rather than as a screen', () => {
  it('locks exactly what the preset locks when the rung frees nothing', () => {
    for (const preset of LAB_PRESETS) {
      expect([...labLocksFor(preset, undefined)].sort(), preset.id).toEqual(
        [...preset.locks].sort(),
      );
    }
  });

  it('hands back the one the rung named and keeps the rest', () => {
    const ballad = labPreset('ballad');
    expect(ballad).not.toBeNull();
    const locked = labLocksFor(ballad, ['progression']);
    expect(locked.has('progression')).toBe(false);
    expect(locked.has('leftHand')).toBe(true);
    expect(locked.has('rightHand')).toBe(true);
  });

  it('locks nothing at all when there is no preset', () => {
    expect(labLocksFor(null, ['progression']).size).toBe(0);
  });

  it('takes the rung’s way round over the preset’s, and the preset’s over none', () => {
    const shuffle = labPreset('blues-shuffle');
    expect(shuffle?.bed).toBe('hold');
    expect(labBedFor(shuffle, 'tune')).toBe('tune');
    expect(labBedFor(shuffle, undefined)).toBe('hold');
    expect(labBedFor(null, undefined)).toBe('off');
    expect(labBedFor(labPreset('pop-four-chord'), undefined)).toBe('off');
  });
});

// --- the lesson page, driven for real ---------------------------------------

const EXERCISE = 'exercise.independence.c.2v3';
const SONG = 'song.classical.czerny-299-no-5';
const DRILL = 'drill.chord.inversions';

function item(id: string, type: string, file: string | null): CatalogItem {
  return {
    id,
    type,
    title: id,
    level: 7.4,
    hands: 'both',
    tracks: ['technique'],
    concepts: [],
    ...(file === null ? {} : { file }),
  } as unknown as CatalogItem;
}

const { loadCurriculumSpy, allItemsSpy, fetchMarkdownSpy, toolsRef } = vi.hoisted(() => ({
  loadCurriculumSpy: vi.fn(),
  allItemsSpy: vi.fn((): Promise<CatalogItem[]> => Promise.resolve([])),
  fetchMarkdownSpy: vi.fn((): Promise<string> => Promise.reject(new Error('no lesson text here'))),
  toolsRef: { current: [] as LessonTool[] },
}));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: loadCurriculumSpy,
  allItems: allItemsSpy,
  fetchMarkdown: fetchMarkdownSpy,
}));

const { LessonScreen } = await import('../../src/ui/screens/LessonScreen');

interface FakeRouter {
  navigate: ReturnType<typeof vi.fn>;
  navigateLab: ReturnType<typeof vi.fn>;
  navigateScore: ReturnType<typeof vi.fn>;
  navigateChart: ReturnType<typeof vi.fn>;
}

let router: FakeRouter;

function lesson(): Lesson {
  return {
    id: 'technique.7',
    title: 'Double notes, octaves and the pedal',
    concepts: [],
    textFile: 'lessons/technique.7.md',
    exerciseOptions: [EXERCISE, DRILL],
    songOptions: [SONG],
    tools: toolsRef.current,
    mastery: { minAccuracy: 0.9, minTempoPct: 0.85 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
  };
}

async function mount(tools: LessonTool[]): Promise<void> {
  toolsRef.current = tools;
  loadCurriculumSpy.mockResolvedValue({
    version: 1,
    tracks: [],
    stages: [
      {
        number: 7,
        title: 'Seven',
        units: [{ id: 'technique', track: 'technique', lessons: [lesson()] }],
      },
    ],
  });
  const section = LessonScreen(router as unknown as Router, 'technique.7');
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(document.querySelector(`[data-item="${SONG}"]`)).not.toBeNull();
  });
}

function toolButtons(): string[] {
  return [...document.querySelectorAll('#lesson-tools button')].map((b) => b.textContent ?? '');
}

beforeEach(() => {
  useFakeIndexedDb();
  router = {
    navigate: vi.fn(),
    navigateLab: vi.fn(),
    navigateScore: vi.fn(),
    navigateChart: vi.fn(),
  };
  allItemsSpy.mockResolvedValue([
    item(EXERCISE, 'exercise', 'scores/generated/exercise.independence.c.2v3.mxl'),
    item(SONG, 'song', 'scores/imported/czerny.mxl'),
    item(DRILL, 'drill', null),
  ]);
});

afterEach(() => {
  document.body.replaceChildren();
  clearFakeIndexedDb();
  vi.restoreAllMocks();
});

describe('the lesson page draws one lab button carrying both fields', () => {
  it('opens the lab with the freed control and the way round', async () => {
    await mount([{ kind: 'lab', preset: 'ballad', unlock: ['progression'], mode: 'tune' }]);
    expect(toolButtons()).toEqual(['Accompaniment lab']);
    document.querySelector<HTMLButtonElement>('#lesson-tool-lab')?.click();
    expect(router.navigateLab).toHaveBeenCalledWith('ballad', {
      unlock: ['progression'],
      mode: 'tune',
    });
  });

  it('passes nothing extra when the rung says nothing extra', async () => {
    await mount([{ kind: 'lab', preset: 'ballad' }]);
    document.querySelector<HTMLButtonElement>('#lesson-tool-lab')?.click();
    expect(router.navigateLab).toHaveBeenCalledWith('ballad', {});
  });
});

describe('a duet may open one of the rung’s exercises', () => {
  it('opens the two-against-three exercise technique.7 names', async () => {
    await mount([{ kind: 'duet', item: EXERCISE }]);
    expect(toolButtons()).toEqual(['Play it as a duet']);
    document.querySelector<HTMLButtonElement>('#lesson-tool-duet')?.click();
    // And the rung, so `← Back` returns to it rather than to the tab
    // (`04` §5, T17-2).
    expect(router.navigateScore).toHaveBeenCalledWith(EXERCISE, {
      mode: 'tempo',
      hands: 'R',
      from: 'technique.7',
    });
  });

  it('draws nothing for an option that opens as a drill rather than as notation', async () => {
    // The same rule the ladder button already follows: `drill.chord.inversions`
    // is one of `4.3`'s exercise options and has no file, so a duet against it
    // would land on a screen with no notes.
    await mount([{ kind: 'duet', item: DRILL }]);
    expect(toolButtons()).toEqual([]);
  });

  it('still refuses an item the rung does not offer at all', async () => {
    await mount([{ kind: 'duet', item: 'song.somewhere.else' }]);
    expect(toolButtons()).toEqual([]);
  });

  it('takes the rung’s first playable song when no item is named', async () => {
    await mount([{ kind: 'duet' }]);
    document.querySelector<HTMLButtonElement>('#lesson-tool-duet')?.click();
    expect(router.navigateScore).toHaveBeenCalledWith(SONG, {
      mode: 'tempo',
      hands: 'R',
      from: 'technique.7',
    });
  });
});
