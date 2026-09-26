// @vitest-environment jsdom
/**
 * Today opens each card with the rung it chose and the slot it filled (C3
 * item 0b, backlog L50).
 *
 * Today opened its cards with no rung in the route, so since C1 — which
 * stopped the Score screen guessing the first rung listing a piece — every
 * Today run was judged by the Settings pair and stored with no rung, and the
 * record could not say which slot the run was for. Here the real Today screen
 * builds a session from a small curriculum through the real session builder,
 * and what is asserted is where its buttons send the learner: the rung and the
 * slot as parameters of their own, and never `from`, which also sends Back to
 * the rung's page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

function lesson(id: string, exerciseOptions: string[], songOptions: string[]): Lesson {
  return {
    id,
    title: `Rung ${id}`,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions,
    songOptions,
    mastery: { minAccuracy: 0.95, minTempoPct: 0.8 },
    requirements: [
      { kind: 'runs', from: 'exercises', count: 2 },
      { kind: 'runs', from: 'songs', count: 1 },
    ],
  };
}

/** One rung the learner is on, whose options fill the warm-up and the new slot. */
const CURRICULUM = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    {
      number: 1,
      title: 'Stage 1',
      summary: '',
      units: [
        {
          id: 'u1',
          title: 'Unit',
          track: 'core',
          lessons: [lesson('1.2', ['exercise.test.a', 'exercise.test.b'], ['song.test.c'])],
        },
      ],
    },
  ],
} as unknown as Curriculum;

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: id.startsWith('song') ? 'song' : 'exercise',
    title: id,
    level: 1,
    tracks: ['core'],
    concepts: [],
    tags: [],
    file: `scores/${id}.mxl`,
    ...over,
  } as unknown as CatalogItem;
}

/**
 * A reading row on no rung: the daily read comes out of it. Above the stage,
 * so the review slot (which fills by level) does not take it; the daily read
 * falls back to the easiest reader when none is at or below the stage.
 */
const READER = item('drill.reading.test', {
  type: 'drill',
  level: 5,
  file: undefined,
  concepts: ['sight-reading'],
  drill: { kind: 'sight-reading', params: { level: 1, bars: 4 } },
});

const ITEMS = [item('exercise.test.a'), item('exercise.test.b'), item('song.test.c'), READER];

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve(ITEMS),
}));

const { TodayScreen, rungForSlot } = await import('../../src/ui/screens/TodayScreen');
const { updateSettings, DEFAULT_SETTINGS } = await import('../../src/data/settingsStore');

let navigateScore: ReturnType<typeof vi.fn>;
let router: Router;

beforeEach(() => {
  navigateScore = vi.fn();
  router = {
    route: { tab: 'today' },
    navigate: vi.fn(),
    navigateScore,
    navigateDrill: vi.fn(),
    navigatePdf: vi.fn(),
    navigateLesson: vi.fn(),
  } as unknown as Router;
  updateSettings({ weekdaySessionMinutes: 15, weekendSessionMinutes: 15 });
});

afterEach(() => {
  document.body.replaceChildren();
  updateSettings({
    weekdaySessionMinutes: DEFAULT_SETTINGS.weekdaySessionMinutes,
    weekendSessionMinutes: DEFAULT_SETTINGS.weekendSessionMinutes,
  });
});

async function openToday(): Promise<HTMLElement> {
  const section = TodayScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#today-card [data-item]').length).toBeGreaterThan(0);
  });
  return section;
}

/** Presses ▶ on the card row for a slot, and returns what the Score screen was asked for. */
function openRow(section: HTMLElement, slot: string): { id: string; options: unknown } {
  const row = section.querySelector<HTMLElement>(`#today-card [data-slot="${slot}"]`);
  expect(row, `no ${slot} row on the card`).not.toBeNull();
  const play = row?.querySelector<HTMLButtonElement>('button[aria-label^="Open"]');
  expect(play, `the ${slot} row has no ▶`).not.toBeNull();
  navigateScore.mockClear();
  play?.click();
  expect(navigateScore).toHaveBeenCalledTimes(1);
  const [id, options] = navigateScore.mock.calls[0] as [string, unknown];
  return { id, options };
}

describe('Today opens a card with its rung and its slot (L50)', () => {
  it('the warm-up from the rung the learner is on carries that rung and the slot', async () => {
    const section = await openToday();
    const opened = openRow(section, 'technique');
    expect(['exercise.test.a', 'exercise.test.b']).toContain(opened.id);
    expect(opened.options, 'a Today card opened with no rung for the run to be judged by').toEqual({
      rung: '1.2',
      slot: 'technique',
    });
  });

  it('the new piece carries the rung and the slot, and no `from`', async () => {
    const section = await openToday();
    const opened = openRow(section, 'new');
    expect(opened.options).toMatchObject({ rung: '1.2', slot: 'new' });
    expect(opened.options).not.toHaveProperty('from');
  });

  it('a card whose item is on one rung Today did not choose carries that rung', async () => {
    // The review slot is filled by level, not from the rung: its item is
    // still listed on exactly one rung, which is the rung it is played for.
    const section = await openToday();
    const opened = openRow(section, 'review');
    expect(['exercise.test.a', 'exercise.test.b']).toContain(opened.id);
    expect(opened.options).toEqual({ rung: '1.2', slot: 'review' });
  });

  it('Start session opens the first card the same way', async () => {
    const section = await openToday();
    await vi.waitFor(() => expect(section.querySelector('#today-start')).not.toBeNull());
    navigateScore.mockClear();
    section.querySelector<HTMLButtonElement>('#today-start')?.click();
    expect(navigateScore).toHaveBeenCalledTimes(1);
    expect(navigateScore.mock.calls[0]?.[1]).toMatchObject({ rung: '1.2', slot: 'technique' });
  });

  it('the daily read says it is the daily read, and names no rung for a row on none', async () => {
    const section = await openToday();
    await vi.waitFor(() => expect(section.querySelector('#today-daily [data-daily]')).not.toBeNull());
    navigateScore.mockClear();
    section.querySelector<HTMLButtonElement>('#today-daily button')?.click();
    expect(navigateScore).toHaveBeenCalledTimes(1);
    const [id, options] = navigateScore.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe(READER.id);
    expect(options).toMatchObject({ slot: 'daily-read' });
    expect(typeof options.seed).toBe('number');
    expect(options).not.toHaveProperty('rung');
  });
});

describe('the rung a card is judged by, where the builder offered it from no rung (C5)', () => {
  // Added (C5, L8). The first rung listing an item stood in for the rung that
  // judged it; for an item several rungs list, that credited the first of them
  // with a run nobody opened from it.
  const TWO = {
    ...CURRICULUM,
    stages: [
      {
        number: 1,
        title: 'Stage 1',
        summary: '',
        units: [
          {
            id: 'u1',
            title: 'Unit',
            track: 'core',
            lessons: [lesson('1.2', ['exercise.shared', 'exercise.only'], ['song.test.c']), lesson('1.3', ['exercise.shared'], [])],
          },
        ],
      },
    ],
  } as unknown as Curriculum;
  it('offered from a rung that lists it: that rung', () => {
    expect(rungForSlot(TWO, item('exercise.shared'), '1.3')).toBe('1.3');
  });
  it('listed by one rung: that rung, whose standard is the only one it has', () => {
    expect(rungForSlot(TWO, item('exercise.only'))).toBe('1.2');
  });
  it('listed by several and offered from none: no rung judges it, so it counts towards none', () => {
    expect(rungForSlot(TWO, item('exercise.shared')), 'the first listing judged a run nobody opened from it').toBeUndefined();
  });
});
