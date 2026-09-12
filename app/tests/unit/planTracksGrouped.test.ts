// @vitest-environment jsdom
/**
 * The Tracks sheet: what is on, in the order it is stored, then the rest in
 * families (`04` §3, §0 R3).
 *
 * Two faults, both of them about sixteen tracks in one flat list.
 *
 *  - **The list was drawn in curriculum order whatever `activeTracks` said.**
 *    `redraw()` walked `curriculum.tracks`, so a drag moved rows that snapped
 *    back the next time any chip was tapped — the sheet showed one order and
 *    the plan stored another, and nothing on screen said which was real.
 *  - **A ladder and a mini-module read as the same offer.** Jazz runs from
 *    Stage 5 to Stage 9; Holiday is one rung. Sixteen undifferentiated rows is
 *    the "organise all the different genres" problem the owner named, and the
 *    only way to tell the two apart was to read all sixteen descriptions.
 *
 * The families are partly named in `PlanScreen.ts` and partly read off the
 * curriculum — a track with one unit in the whole plan is a mini-module — so
 * this drives the real screen with a curriculum that has both shapes in it
 * rather than asserting against a hard-coded list of names.
 *
 * The headings are drawn **only below the block of tracks that are on**, so
 * that no heading ever falls between two draggable rows: the drag hit-tests
 * `activeTracks` against `getBoundingClientRect`, and it needs that column
 * contiguous and in the same order as the array. That is asserted here too,
 * because it is the reason the grouping is shaped this way.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { Curriculum, Mastery, Stage, Unit } from '../../src/curriculum/types';

const MASTERY: Mastery = { exercisesRequired: 1, songsRequired: 0, minAccuracy: 0, minTempoPct: 0 };

function unit(id: string, track: string): Unit {
  return {
    id,
    title: id,
    track,
    lessons: [
      {
        id,
        title: id,
        concepts: [],
        textFile: '',
        exerciseOptions: [`ex.${id}`],
        songOptions: [],
        songOptional: true,
        mastery: MASTERY,
      },
    ],
  };
}

function stage(number: number, units: Unit[]): Stage {
  return { number, title: `Stage ${String(number)}`, summary: '', units };
}

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [
    { id: 'core', title: 'Core path', description: '', startsAtStage: 0 },
    { id: 'practice', title: 'How to practise', description: '', startsAtStage: 1 },
    { id: 'technique', title: 'Technique', description: '', startsAtStage: 4 },
    { id: 'theory-ear', title: 'Theory & ear', description: '', startsAtStage: 3 },
    // Two units: a ladder.
    { id: 'jazz', title: 'Jazz', description: '', startsAtStage: 5 },
    { id: 'classical', title: 'Classical', description: '', startsAtStage: 3 },
    // One unit each: mini-modules.
    { id: 'holiday', title: 'Holiday', description: '', startsAtStage: 2 },
    { id: 'latin', title: 'Latin', description: '', startsAtStage: 5 },
  ],
  stages: [
    stage(1, [unit('1.1', 'core'), unit('practice.1.1', 'practice')]),
    stage(2, [
      unit('technique.2.1', 'technique'),
      unit('theory-ear.2.1', 'theory-ear'),
      unit('jazz.2.1', 'jazz'),
      unit('classical.2.1', 'classical'),
      unit('holiday.2.1', 'holiday'),
      unit('latin.2.1', 'latin'),
    ]),
    stage(3, [unit('jazz.3.1', 'jazz'), unit('classical.3.1', 'classical'), unit('2.1', 'core')]),
  ],
};

const state = vi.hoisted(() => ({ trackOrder: ['core'] }));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve([]),
}));

vi.mock('../../src/data/planStore', () => ({
  getPlan: () => Promise.resolve({ trackOrder: state.trackOrder }),
  updatePlan: () => Promise.resolve(undefined),
}));

vi.mock('../../src/data/progressStore', () => ({
  allProgress: () => Promise.resolve([]),
}));

const { PlanScreen } = await import('../../src/ui/screens/PlanScreen');

const router = { navigateLesson: vi.fn(), navigate: vi.fn() } as unknown as Router;

async function openSheet(): Promise<HTMLElement> {
  const section = PlanScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#plan-tracks-open')).toBeTruthy();
  });
  (section.querySelector('#plan-tracks-open') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    expect(document.getElementById('plan-tracks-list')).toBeTruthy();
  });
  return document.getElementById('plan-tracks-list') as HTMLElement;
}

/** The sheet, read top to bottom: `{family: …}` for a heading, `{track: …}` otherwise. */
function rows(listEl: HTMLElement): { family?: string; track?: string }[] {
  return Array.from(listEl.children).map((child) => {
    if (child.classList.contains('track-family')) return { family: child.textContent ?? '' };
    const track = child.getAttribute('data-row-track');
    return track ? { track } : { family: `(${child.id})` };
  });
}

describe('the Tracks sheet', () => {
  beforeEach(() => {
    document.getElementById('plan-tracks-sheet')?.remove();
    document.body.replaceChildren();
    state.trackOrder = ['core', 'jazz', 'classical'];
  });

  it('lists the tracks that are on first, in the order the plan stores', async () => {
    // Not curriculum order — `jazz` comes after `technique` and `theory-ear`
    // there. The list used to be drawn in curriculum order whatever the plan
    // said, so an order set by dragging was shown once and then lost.
    const listEl = await openSheet();
    const shown = rows(listEl);
    expect(shown.slice(0, 3)).toEqual([{ track: 'core' }, { track: 'jazz' }, { track: 'classical' }]);
  });

  it('keeps the tracks that are on contiguous, so a drag can measure them', async () => {
    const listEl = await openSheet();
    const shown = rows(listEl);
    const lastOn = shown.map((row) => row.track).lastIndexOf('classical');
    // Nothing but rows above the last active one: a heading in there would put
    // a gap in the column `indexAtPoint` hit-tests against `activeTracks`.
    for (const row of shown.slice(0, lastOn + 1)) expect(row.family).toBeUndefined();
    expect(shown[lastOn + 1]?.family).toBeTruthy();
  });

  it('groups the tracks that are off into families', async () => {
    const listEl = await openSheet();
    const shown = rows(listEl);
    let family = '';
    const byFamily = new Map<string, string[]>();
    for (const row of shown.slice(3)) {
      if (row.family !== undefined) {
        family = row.family;
        byFamily.set(family, []);
      } else if (row.track) {
        byFamily.get(family)?.push(row.track);
      }
    }
    expect([...byFamily.keys()]).toEqual([
      'The path itself',
      'Alongside everything',
      'Mini-modules — one rung each',
    ]);
    expect(byFamily.get('The path itself')).toEqual(['practice']);
    expect(byFamily.get('Alongside everything')).toEqual(['technique', 'theory-ear']);
    // One unit in the whole plan, so read off the curriculum rather than named
    // in the screen: these are mini-modules.
    expect(byFamily.get('Mini-modules — one rung each')).toEqual(['holiday', 'latin']);
    // `jazz` and `classical` have two units each and are ladders — they are on
    // here, so the "Style ladders" heading correctly has nothing under it and
    // is not drawn at all (`04` §0 R4).
    expect(shown.some((row) => row.family === 'Style ladders')).toBe(false);
  });

  it('names every track exactly once', async () => {
    const listEl = await openSheet();
    const tracks = rows(listEl)
      .map((row) => row.track)
      .filter((id): id is string => Boolean(id));
    expect([...tracks].sort()).toEqual(CURRICULUM.tracks.map((track) => track.id).sort());
  });

  it('says so rather than drawing empty headings when every track is on', async () => {
    state.trackOrder = CURRICULUM.tracks.map((track) => track.id);
    const listEl = await openSheet();
    expect(listEl.querySelectorAll('.track-family')).toHaveLength(0);
    expect(listEl.querySelector('#plan-tracks-all-on')?.textContent).toMatch(/Every track/);
    expect(listEl.querySelectorAll('.track-row')).toHaveLength(CURRICULUM.tracks.length);
  });
});
