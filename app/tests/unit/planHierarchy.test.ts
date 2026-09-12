// @vitest-environment jsdom
/**
 * What the Plan screen says first, second and last (`04` §0 R1, R3; §3).
 *
 * Photographed on the owner's phone the screen ranked nothing. Top to bottom:
 * two rows of track chips, a row of links, then stage cards with, between
 * them, a line per unit in capitals —
 *
 *     CLASSICAL.5.1 · CLASSICAL: SONATINA FORM AND ROMANTIC MINIATURES — CLASSICAL
 *     classical.5 · Sonatina form and Romantic…
 *     4 exercises · 4 songs · ~90 days
 *
 * — an internal id, the track's name inside the unit's title, the track's name
 * again after a dash, and under all that the card you actually tap, saying the
 * same words a third time with the end cut off. The answer to "what do I play
 * next?" was a sentence at the very bottom of the body, under every rung.
 *
 * So this holds the ranking rather than the pixels: the next rung is a card at
 * the top and it is the only filled thing on the screen; a track is named once
 * over the rungs that belong to it and never twice inside its own heading; a
 * rung's card carries its title and no id; a unit gets a line only where it is
 * genuinely more than one rung; the occasional links are below the list; and a
 * stage's fraction counts the rungs that are on screen rather than the ones the
 * learner has switched off.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import type { Curriculum, Lesson, Mastery, Stage, Unit } from '../../src/curriculum/types';

const MASTERY: Mastery = {
  exercisesRequired: 1,
  songsRequired: 0,
  minAccuracy: 0,
  minTempoPct: 0,
};

function lesson(id: string, title: string, extra: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title,
    concepts: [],
    textFile: '',
    exerciseOptions: [`ex.${id}`],
    songOptions: [`song.${id}.a`, `song.${id}.b`],
    mastery: MASTERY,
    ...extra,
  };
}

function unit(id: string, title: string, track: string, lessons: Lesson[]): Unit {
  return { id, title, track, lessons };
}

const STAGE_ONE: Stage = {
  number: 1,
  title: 'First notes',
  summary: 'Five fingers, one hand at a time.',
  approxDuration: '6-10 weeks',
  units: [
    unit('1.1', 'Landing on C', 'core', [lesson('1.1', 'Right hand C position')]),
    // More than one rung, and a name of its own: this is the one shape that
    // still earns a unit line.
    unit('1.2', 'Sight-reading capstone', 'core', [
      lesson('1.2', 'Reading by interval'),
      lesson('1.3', 'Learning it from memory'),
    ]),
    // More than one rung, but named after the first of them — which is how
    // `4.6` "Sight-reading and phrasing capstone" is shaped in the real
    // curriculum. No line: it is the card's own words again.
    unit('1.4', 'Playing for someone', 'core', [
      lesson('1.4', 'Playing for someone'),
      lesson('1.5', 'What to do when it goes wrong'),
    ]),
    // More than one rung, but named after its own track — the heading over it
    // already says these words, so it gets no line either.
    unit('practice.1.1', 'How to practise', 'practice', [
      lesson('practice.1', 'Chunking, and the loop'),
      lesson('practice.2', 'Slow practice and the tempo ladder'),
    ]),
  ],
};

const STAGE_TWO: Stage = {
  number: 2,
  title: 'Tracks take over',
  summary: 'Pick a direction.',
  units: [
    unit('classical.2.1', 'Classical: Baroque and Classical dances', 'classical', [
      lesson('classical.2', 'Baroque and Classical dances', { estimatedDays: 30 }),
    ]),
    unit('theory-ear.2.1', 'Theory & ear: intervals and key signatures', 'theory-ear', [
      lesson('theory.2', 'Intervals, key signatures and I-IV-V by ear', {
        songOptions: [],
        songOptional: true,
      }),
    ]),
    unit('jazz.2.1', 'Jazz: swing and shell voicings', 'jazz', [
      lesson('jazz.2', 'Swing, shell voicings and ii-V-I'),
    ]),
  ],
};

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [
    { id: 'core', title: 'Core path', description: '', startsAtStage: 0 },
    { id: 'practice', title: 'How to practise', description: '', startsAtStage: 1 },
    { id: 'classical', title: 'Classical', description: '', startsAtStage: 2 },
    { id: 'theory-ear', title: 'Theory & ear', description: '', startsAtStage: 2 },
    { id: 'jazz', title: 'Jazz', description: '', startsAtStage: 2 },
  ],
  stages: [STAGE_ONE, STAGE_TWO],
};

const ALL_TRACKS = ['core', 'practice', 'classical', 'theory-ear', 'jazz'];

/**
 * Mutable between mounts, read lazily by the mocked stores.
 *
 * `vi.hoisted` because `vi.mock`'s factory is hoisted above everything else in
 * the file, so a plain `const` declared here would still be in its temporal
 * dead zone when the factory is defined.
 */
const state = vi.hoisted(() => ({
  trackOrder: ['core', 'practice', 'classical', 'theory-ear', 'jazz'],
  // Enough passes to finish every core rung of Stage 1 and the classical rung
  // of Stage 2 — so the recommendation falls on a side track, and a stage's
  // fraction has something in it to count.
  passed: ['ex.1.1', 'ex.1.2', 'ex.1.3', 'ex.1.4', 'ex.1.5', 'ex.classical.2'],
}));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve(CURRICULUM),
  allItems: () => Promise.resolve([]),
}));

vi.mock('../../src/data/planStore', () => ({
  getPlan: () => Promise.resolve({ trackOrder: state.trackOrder }),
  updatePlan: () => Promise.resolve(undefined),
}));

vi.mock('../../src/data/progressStore', () => ({
  allProgress: () =>
    Promise.resolve(state.passed.map((itemId) => ({ itemId, status: 'passed' as const }))),
}));

const { PlanScreen } = await import('../../src/ui/screens/PlanScreen');

const navigateLesson = vi.fn();
const router = { navigateLesson, navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = PlanScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('[data-stage="1"]')).toBeTruthy();
  });
  return section;
}

function openStage(section: HTMLElement, number: number): HTMLElement {
  const row = section.querySelector(`[data-stage="${String(number)}"]`) as HTMLElement;
  if (row.getAttribute('data-open') !== 'true') row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return section.querySelector(`[data-stage="${String(number)}"]`) as HTMLElement;
}

function closeStage(section: HTMLElement, number: number): void {
  const row = section.querySelector(`[data-stage="${String(number)}"]`) as HTMLElement;
  if (row.getAttribute('data-open') === 'true') row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').trim();
}

function metaOf(row: Element): string {
  return text(row.querySelector('.list-row__metatext'));
}

describe('the Plan screen', () => {
  beforeEach(() => {
    state.trackOrder = [...ALL_TRACKS];
    state.passed = ['ex.1.1', 'ex.1.2', 'ex.1.3', 'ex.1.4', 'ex.1.5', 'ex.classical.2'];
    navigateLesson.mockClear();
    document.body.replaceChildren();
  });

  it('answers "what next?" in a card at the top, before the stage list', async () => {
    const section = await mount();
    const card = section.querySelector('#plan-next');
    expect(card, 'there is no next-up card').toBeTruthy();
    // The rung's own words, and where it sits — no id anywhere in it.
    expect(text(card?.querySelector('.plan-next__title'))).toBe('Chunking, and the loop');
    expect(text(card?.querySelector('.plan-next__eyebrow'))).toBe('Next up · Stage 1 · How to practise');
    expect(text(card)).not.toMatch(/practice\.1/);

    // Before the list, in the reading order of the body.
    const body = section.querySelector('.screen-body') as HTMLElement;
    const list = section.querySelector('#plan-list') as HTMLElement;
    const order = Array.from(body.children);
    expect(order.indexOf(card?.parentElement as Element)).toBeLessThan(order.indexOf(list));
  });

  it('makes that card the tap that opens the rung', async () => {
    const section = await mount();
    (section.querySelector('#plan-next') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(navigateLesson).toHaveBeenCalledWith('practice.1');
  });

  it('names a track once over its rungs, and never twice inside one heading', async () => {
    const section = await mount();
    openStage(section, 2);
    const heads = Array.from(section.querySelectorAll('.plan-track'));
    // Stage 1 is open too — it is the stage being worked on — so its one side
    // track is in the list before Stage 2's three.
    expect(heads.map((head) => text(head))).toEqual([
      'How to practise',
      'Classical',
      'Theory & ear',
      'Jazz',
    ]);
    for (const head of heads) {
      const name = text(head);
      // "CLASSICAL: … — CLASSICAL" was the fault: the track's name inside the
      // unit's title and again after a dash.
      expect(text(head).toLowerCase().split(name.toLowerCase()).length - 1).toBe(1);
      expect(text(head)).not.toMatch(/[·—]/);
    }
  });

  it('gives the core path no heading — it is the stage, not a side track', async () => {
    const section = await mount();
    const stageOne = section.querySelectorAll('[data-track-head="core"]');
    expect(stageOne).toHaveLength(0);
    // And Stage 1's core rungs are on screen regardless.
    expect(section.querySelector('[data-lesson="1.1"]')).toBeTruthy();
  });

  it('shows no internal id on any rung, unit or track line', async () => {
    const section = await mount();
    openStage(section, 2);
    for (const [id, title] of [
      ['1.1', 'Right hand C position'],
      ['practice.1', 'Chunking, and the loop'],
      ['classical.2', 'Baroque and Classical dances'],
      ['jazz.2', 'Swing, shell voicings and ii-V-I'],
    ] as const) {
      const row = section.querySelector(`[data-lesson="${id}"]`);
      expect(row, `no row for ${id}`).toBeTruthy();
      expect(text(row?.querySelector('.list-row__title'))).toBe(title);
    }
    // The unit ids that used to head every group.
    expect(text(section)).not.toMatch(/classical\.2\.1|practice\.1\.1|jazz\.2\.1/);
  });

  it('draws a unit line only where a unit is more than one rung', async () => {
    const section = await mount();
    const units = Array.from(section.querySelectorAll('.plan-unit[data-unit]'));
    // `1.2` has two rungs and a name of its own. `1.4` has two rungs but is
    // named after the first of them, and `practice.1.1` has two rungs but is
    // named after its own track, which the heading above it already says.
    // Every single-rung unit — all three in Stage 2 — gets nothing.
    expect(units.map((node) => text(node))).toEqual(['Sight-reading capstone']);
    openStage(section, 2);
    expect(
      Array.from(section.querySelectorAll('.plan-unit[data-unit]')).map((node) => text(node)),
    ).toEqual(['Sight-reading capstone']);
  });

  it('does not print "0 songs" beside a rung that needs no song', async () => {
    const section = await mount();
    openStage(section, 2);
    const row = section.querySelector('[data-lesson="theory.2"]') as HTMLElement;
    // It read "3 exercises · 0 songs" with a badge beside it saying "no song
    // needed": the same fact three times, one of them in the form of an
    // absence, and the badge's own line put two real rungs over R2's 96 px.
    expect(metaOf(row)).toBe('1 exercise · no song needed');
    expect(row.querySelectorAll('.badge')).toHaveLength(0);
  });

  it('counts in English: "1 exercise", "4 exercises", and no zeroes at all', async () => {
    const section = await mount();
    openStage(section, 2);
    // Stage 0's orientation rungs read "2 exercises · 0 songs · ~1 days" on
    // the phone. A count of one is singular and a count of none is left out.
    expect(metaOf(section.querySelector('[data-lesson="classical.2"]') as HTMLElement)).toBe(
      '1 exercise · 2 songs · ~30 days',
    );
    expect(metaOf(section.querySelector('[data-lesson="jazz.2"]') as HTMLElement)).toBe(
      '1 exercise · 2 songs',
    );
  });

  it('puts what a stage is about below the stage, not on its row', async () => {
    const section = await mount();
    // On the row it was a second muted line — over R2's one — and at the
    // phone's width it was cut to "Sitting, the layout of the keyboard, how…",
    // which is an explanation that has stopped explaining. R1: the long
    // version lives below the thing it explains.
    const head = section.querySelector('[data-stage="1"]') as HTMLElement;
    expect(head.querySelectorAll('.list-row__sub')).toHaveLength(0);
    expect(text(head)).not.toMatch(/Five fingers/);

    // Stage 1 is open — it is the one being worked on — so its summary is
    // there in full. `expanded` is module-level state in `PlanScreen.ts` that
    // outlives a mount, so Stage 2 is closed explicitly rather than assumed.
    expect(text(section.querySelector('[data-summary-for="1"]'))).toBe(
      'Five fingers, one hand at a time.',
    );
    closeStage(section, 2);
    expect(section.querySelector('[data-summary-for="2"]')).toBeNull();
    openStage(section, 2);
    expect(text(section.querySelector('[data-summary-for="2"]'))).toBe('Pick a direction.');
  });

  it('counts a stage against the rungs that are on screen, not the ones switched off', async () => {
    const section = await mount();
    const withJazz = metaOf(section.querySelector('[data-stage="2"]') as HTMLElement);
    expect(withJazz).toMatch(/^1 of 3 lessons/);

    state.trackOrder = ALL_TRACKS.filter((id) => id !== 'jazz');
    const narrower = await mount();
    const withoutJazz = metaOf(narrower.querySelector('[data-stage="2"]') as HTMLElement);
    // The denominator followed the rows. It used to count all three whatever
    // was on, so a stage showing two rungs was headed "1 of 3".
    expect(withoutJazz).toMatch(/^1 of 2 lessons/);
    expect(narrower.querySelector('[data-lesson="jazz.2"]')).toBeNull();
  });

  it('shows how far through a stage is, as a bar as well as a fraction', async () => {
    const section = await mount();
    const fill = section.querySelector('[data-stage="2"] .plan-stage-bar__fill') as HTMLElement;
    expect(fill.style.width).toBe('33%');
    const stageOne = section.querySelector('[data-stage="1"] .plan-stage-bar__fill') as HTMLElement;
    // Five of Stage 1's seven rungs are passed.
    expect(stageOne.style.width).toBe('71%');
  });

  it('marks the stage being worked on, and the rung inside it', async () => {
    const section = await mount();
    expect(section.querySelector('[data-stage="1"]')?.getAttribute('data-current')).toBe('true');
    expect(section.querySelector('[data-stage="2"]')?.getAttribute('data-current')).toBe('false');
    expect(section.querySelector('[data-lesson="practice.1"]')?.getAttribute('data-next')).toBe('true');
  });

  it('keeps one control in the header and one filled box on the screen (R3)', async () => {
    const section = await mount();
    const header = section.querySelector('.screen-header') as HTMLElement;
    // It was three chips that read as pressed toggles and had no handler at
    // all, on their own line, above a fourth that opened the sheet.
    expect(header.querySelectorAll('button')).toHaveLength(1);
    expect(text(header.querySelector('#plan-tracks-open'))).toMatch(/^Tracks: /);
    expect(header.querySelector('[aria-pressed="true"]')).toBeNull();

    expect(section.querySelectorAll('.button--primary')).toHaveLength(0);
    expect(section.querySelectorAll('.plan-next')).toHaveLength(1);
  });

  it('puts the occasional links below the list, not above it (R1)', async () => {
    const section = await mount();
    const body = section.querySelector('.screen-body') as HTMLElement;
    const order = Array.from(body.children);
    const links = section.querySelector('#plan-links') as HTMLElement;
    expect(order.indexOf(links)).toBeGreaterThan(order.indexOf(section.querySelector('#plan-list') as Element));
    expect(section.querySelector('.screen-header #plan-links')).toBeNull();
    // And all three are still there to press.
    for (const id of ['plan-placement', 'plan-skills', 'plan-practice']) {
      expect(links.querySelector(`#${id}`), id).toBeTruthy();
    }
  });

  it('says so on the one line that announces, when there is nothing left', async () => {
    state.passed = [
      'ex.1.1', 'ex.1.2', 'ex.1.3', 'ex.1.4', 'ex.1.5',
      'ex.practice.1', 'ex.practice.2',
      'ex.classical.2', 'ex.theory.2', 'ex.jazz.2',
    ];
    const section = await mount();
    expect(section.querySelector('#plan-next')).toBeNull();
    expect(text(section.querySelector('#plan-status'))).toBe('Every lesson is complete.');
  });
});
